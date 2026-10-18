/**
 * Request forwarded to the API Worker over the Service Binding.
 *
 * The API rate-limits per client IP and trusts `cf-connecting-ip`. The edge stamps that header on
 * every public request, so a visitor's request always carries it; only the web Worker's own
 * server-side renders reach the API without one (and the API leaves those unlimited, unless they
 * pass the visitor's IP with `asVisitor`). Copying the
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

/**
 * Request options for a server-side render's API call whose URL comes from the visitor (a slug, a
 * cursor). Each new value misses the API's cache and queries D1, so the call carries the visitor's
 * IP and counts against their API rate limit; calls with fixed URLs stay unlimited.
 */
export const asVisitor = (request: Request) => {
  const ip = request.headers.get("cf-connecting-ip");
  return ip ? { headers: { "cf-connecting-ip": ip } } : undefined;
};
