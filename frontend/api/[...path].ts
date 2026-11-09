import type { IncomingMessage, ServerResponse } from "node:http";
import { proxyToBackend } from "../proxy.js";

export const config = { api: { bodyParser: false } };

export default function handler(req: IncomingMessage, res: ServerResponse) {
  proxyToBackend(req, res, "/api");
}
