import { request as httpRequest, type IncomingMessage, type ServerResponse } from "node:http";
import { request as httpsRequest } from "node:https";

export function proxyToBackend(
  req: IncomingMessage,
  res: ServerResponse,
  pathPrefix: "/api" | "/uploads",
) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    res.statusCode = 500;
    res.end("Backend is not configured");
    return;
  }

  let base: URL;
  try {
    base = new URL(backendUrl);
  } catch {
    res.statusCode = 500;
    res.end("Backend URL is invalid");
    return;
  }
  if (base.protocol !== "https:") {
    res.statusCode = 500;
    res.end("Backend URL must use HTTPS");
    return;
  }

  let incoming: URL;
  try {
    incoming = new URL(req.url ?? "/", "https://website.invalid");
  } catch {
    res.statusCode = 400;
    res.end("Invalid request URL");
    return;
  }

  const route = pathPrefix === "/api"
    ? incoming.pathname
    : incoming.pathname.replace(/^\/api(?=\/|$)/, "");
  const target = new URL(`${route}${incoming.search}`, base);
  const headers = { ...req.headers, host: target.host };
  delete headers.connection;
  delete headers["content-length"];
  delete headers["transfer-encoding"];

  const send = target.protocol === "https:" ? httpsRequest : httpRequest;
  const upstream = send(target, { method: req.method, headers }, (response) => {
    res.statusCode = response.statusCode ?? 502;
    for (const [name, value] of Object.entries(response.headers)) {
      if (value !== undefined) res.setHeader(name, value);
    }
    response.pipe(res);
  });

  upstream.setTimeout(55_000, () => upstream.destroy(new Error("Backend request timed out")));
  upstream.on("error", () => {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    res.statusCode = 502;
    res.end("Backend is unavailable");
  });
  req.pipe(upstream);
}
