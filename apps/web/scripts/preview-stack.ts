/**
 * Serves the production build of both Workers locally (Miniflare, same Service Binding as in
 * production): the API on :8788 and the web Worker on :4322. Used by Lighthouse CI; Playwright
 * starts the same two servers itself.
 *
 * A third listener on :4323 stands in for the Cloudflare edge, which compresses text responses
 * (Miniflare does not): Lighthouse measures that port so its transfer sizes match production. Run `pnpm build` and `pnpm e2e:prepare` first.
 *
 * Run: `pnpm --filter @orkide/web preview:stack`
 */
import { spawn } from "node:child_process";
import { createServer, request } from "node:http";
import path from "node:path";
import { promisify } from "node:util";
import { brotliCompress, constants, gzip } from "node:zlib";

const root = path.resolve(import.meta.dirname, "..");
const apiPort = "8788";
const webPort = "4322";
const edgePort = 4323;
const compressibleType =
  /^(?:text\/|application\/(?:javascript|json|xml)|image\/svg)/u;
const minCompressBytes = 1024;

const children = [
  spawn("pnpm", ["--filter", "@orkide/api", "preview", "--port", apiPort], {
    cwd: root,
    stdio: "inherit",
  }),
  spawn(
    "pnpm",
    ["--filter", "@orkide/web", "preview", "--port", webPort, "--ignore-lock"],
    { cwd: root, stdio: "inherit" }
  ),
];

const stop = (): void => {
  for (const child of children) {
    child.kill("SIGTERM");
  }
  // The edge listener below would keep the process alive otherwise.
  setImmediate(() => process.exit(process.exitCode ?? 0));
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of children) {
  child.on("exit", (code) => {
    stop();
    process.exitCode = code ?? 1;
  });
}

const waitFor = async (url: string): Promise<void> => {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }
  throw new Error(`${url} did not become ready`);
};

const brotli = promisify(brotliCompress);
const deflate = promisify(gzip);

/** Compresses like the Cloudflare edge: brotli when accepted, else gzip, text types only. */
createServer((incoming, outgoing) => {
  const upstream = request(
    {
      headers: incoming.headers,
      hostname: "localhost",
      method: incoming.method,
      path: incoming.url,
      port: webPort,
    },
    async (response) => {
      const chunks: Buffer[] = [];
      for await (const chunk of response) {
        chunks.push(chunk as Buffer);
      }
      let body = Buffer.concat(chunks);
      const headers = { ...response.headers };
      const accepted = String(incoming.headers["accept-encoding"] ?? "");
      const type = String(headers["content-type"] ?? "");
      const compress =
        !headers["content-encoding"] &&
        compressibleType.test(type) &&
        body.length >= minCompressBytes;
      if (compress && accepted.includes("br")) {
        body = await brotli(body, {
          params: { [constants.BROTLI_PARAM_QUALITY]: 5 },
        });
        headers["content-encoding"] = "br";
      } else if (compress && accepted.includes("gzip")) {
        body = await deflate(body);
        headers["content-encoding"] = "gzip";
      }
      delete headers["transfer-encoding"];
      headers["content-length"] = String(body.length);
      outgoing.writeHead(response.statusCode ?? 502, headers);
      outgoing.end(body);
    }
  );
  upstream.on("error", () => {
    outgoing.writeHead(502).end();
  });
  incoming.pipe(upstream);
}).listen(edgePort);

await waitFor(`http://localhost:${apiPort}/api/health`);
await waitFor(`http://localhost:${edgePort}/en`);
process.stdout.write("stack ready\n");
