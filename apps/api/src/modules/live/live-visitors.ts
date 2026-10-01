import { DurableObject } from "cloudflare:workers";

/** Messages pushed to connected clients. */
export interface PresenceMessage {
  readonly type: "presence";
  readonly visitors: number;
}

/**
 * Counts concurrent visitors across the whole site.
 *
 * Uses the hibernatable WebSocket API: the object is evicted from memory between messages while
 * connections stay open, so an idle audience costs nothing.
 */
export class LiveVisitors extends DurableObject<Env> {
  override fetch(request: Request): Response {
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected a WebSocket upgrade", { status: 426 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    this.broadcast();
    return new Response(null, { status: 101, webSocket: client });
  }

  /** RPC: current number of open connections. */
  count(): number {
    return this.openSockets().length;
  }

  override webSocketClose(
    socket: WebSocket,
    code: number,
    reason: string
  ): void {
    socket.close(code, reason);
    this.broadcast();
  }

  override webSocketError(socket: WebSocket): void {
    socket.close(1011, "error");
    this.broadcast();
  }

  private openSockets(): WebSocket[] {
    return this.ctx
      .getWebSockets()
      .filter((socket) => socket.readyState === WebSocket.OPEN);
  }

  private broadcast(): void {
    const sockets = this.openSockets();
    const message = JSON.stringify({
      type: "presence",
      visitors: sockets.length,
    } satisfies PresenceMessage);
    for (const socket of sockets) {
      socket.send(message);
    }
  }
}
