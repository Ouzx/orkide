/**
 * Request forwarded to the API Worker over the Service Binding.
 *
 * The API rate-limits per client IP and trusts `cf-connecting-ip`. The edge stamps that header on
 * every public request, so a visitor's request always carries it; only the web Worker's own
 * server-side renders reach the API without one (and the API leaves those unlimited). Copying the
 * IP explicitly keeps the limiter working even if a runtime stops passing headers through
 * implicitly. A request that arrives without the header stays without it: it is never invented.
 */
export const forwardToApi = (request: Request): Request => {
  const ip = request.headers.get("cf-connecting-ip");
  if (!ip) {
    return request;
  }
  const headers = new Headers(request.headers);
  headers.set("cf-connecting-ip", ip);
  return new Request(request, { headers });
};
