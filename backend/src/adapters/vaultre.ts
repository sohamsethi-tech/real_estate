import { config, vaultreConfigured } from "../config.js";

/**
 * VaultRE API 1.3, taken from the public documentation:
 * https://docs.api.vaultre.com.au/guide.html
 * https://docs.api.vaultre.com.au/samples.html
 * https://docs.api.vaultre.com.au/swagger/index.html
 *
 * Verified there:
 * - Base URL https://ap-southeast-2.api.vaultre.com.au/api/v1.3/
 * - Every request needs X-Api-Key and Authorization: Bearer
 * - A documented read is GET /properties/residential/sale?published=true&status=listingOrConditional
 * - VaultRE asks integrators to sync and cache, not to call the API on each page view
 * - HTTP 429 means the quota is exhausted
 *
 * Response fields are not mapped into public listings. A probe returns status and
 * top-level JSON keys only, and writes nothing.
 */
export const VAULTRE_DOCUMENTED_BASE = "https://ap-southeast-2.api.vaultre.com.au/api/v1.3";

const DOCUMENTED_SALE_PATH = "/properties/residential/sale?published=true&status=listingOrConditional";

export function vaultreStatus() {
  const base = (config.VAULTRE_API_BASE || VAULTRE_DOCUMENTED_BASE).replace(/\/$/, "");
  return {
    documentedBase: VAULTRE_DOCUMENTED_BASE,
    configuredBase: base,
    configured: vaultreConfigured(),
    writesEnabled: false,
    reason: vaultreConfigured()
      ? "Credentials are present, but listing fields are not mapped until a live payload is checked. Nothing is written to the website."
      : "VaultRE credentials are not configured. The website reads the internal property database only.",
  };
}

export async function probeVaultre() {
  const status = vaultreStatus();
  if (!status.configured || !config.VAULTRE_API_KEY || !config.VAULTRE_ACCESS_TOKEN) {
    return { ...status, probed: false, httpStatus: null as number | null, keys: [] as string[] };
  }
  const response = await fetch(`${status.configuredBase}${DOCUMENTED_SALE_PATH}`, {
    headers: {
      Accept: "application/json",
      "X-Api-Key": config.VAULTRE_API_KEY,
      Authorization: `Bearer ${config.VAULTRE_ACCESS_TOKEN}`,
    },
  });
  let keys: string[] = [];
  const text = await response.text();
  try {
    const body = JSON.parse(text) as unknown;
    if (body && typeof body === "object" && !Array.isArray(body)) keys = Object.keys(body).slice(0, 30);
    else if (Array.isArray(body)) keys = ["array"];
  } catch {
    keys = [];
  }
  return { ...status, probed: true, httpStatus: response.status, keys };
}
