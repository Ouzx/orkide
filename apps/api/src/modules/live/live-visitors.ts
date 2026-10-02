import { DurableObject } from "cloudflare:workers";

const NO_STATUS_CODE = 1005;
const NORMAL_CLOSE_CODE = 1000;

/**
 * Open sockets one visitor (client IP) may hold: enough for a handful of tabs or a shared office
 * network, low enough that a script cannot inflate the count from one address.
 */
export const MAX_SOCKETS_PER_VISITOR = 10;

/** Short one-way tag for a client IP, so the IP itself is never kept with the socket. */
const visitorTag = async (ip: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ip)
  );
  return `v:${new Uint8Array(digest).toHex().slice(0, 32)}`;
};

/**
 * Counts concurrent visitors across the whole site.
 *
 * Visitors only need to be counted, so the room never sends them anything: the admin dashboard
 * reads `count()` over RPC on its own schedule. With nothing to broadcast, joins and leaves cost
 * O(1) however many visitors are connected, and the hibernatable WebSocket API keeps the object
 * evicted from memory while connections stay open, so an idle audience costs nothing.
 */
export class LiveVisitors extends DurableObject<Env> {
  override async fetch(request: Request): Promise<Response> {
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected a WebSocket upgrade", { status: 426 });
    }
    const ip = request.headers.get("cf-connecting-ip");
    const tags = ip ? [await visitorTag(ip)] : [];
    if (
      tags[0] &&
      this.openSockets(tags[0]).length >= MAX_SOCKETS_PER_VISITOR
    ) {
      return new Response("Too many connections", { status: 429 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server, tags);
    return new Response(null, { status: 101, webSocket: client });
  }

  /** RPC: current number of open connections. */
  count(): number {
    return this.openSockets().length;
  }

  // The runtime dispatches socket events to instance methods; nothing here needs `this`.
  // oxlint-disable-next-line class-methods-use-this
  override webSocketClose(
    socket: WebSocket,
    code: number,
    reason: string
  ): void {
    // 1005 ("no status") is reserved: it is reported when a peer closes without a code and may not
    // be sent back, so echoing it would throw.
    socket.close(code === NO_STATUS_CODE ? NORMAL_CLOSE_CODE : code, reason);
  }

  // oxlint-disable-next-line class-methods-use-this
  override webSocketError(socket: WebSocket): void {
    socket.close(1011, "error");
  }

  private openSockets(tag?: string): WebSocket[] {
    return this.ctx
      .getWebSockets(tag)
      .filter((socket) => socket.readyState === WebSocket.OPEN);
  }
}
