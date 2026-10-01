/**
 * Joins the live presence room (a hibernatable WebSocket on the API's Durable Object), so the
 * dashboard can show how many people are on the site right now. Idle sockets cost nothing; the
 * connection closes with the page. Disabled by the `live-visitors` flag server-side.
 */
export const joinPresence = (): void => {
  if (!("WebSocket" in globalThis) || navigator.webdriver) {
    return;
  }
  const url = new URL("/api/live", location.href);
  url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(url);
  // Presence only: messages are not needed on public pages.
  socket.addEventListener("error", () => socket.close());
};
