import { loadConfig } from "@caffeineai/core-infrastructure";

const MOTOKO_DEDUPLICATION_SENTINEL = "!caf!";

let _directUrlBasePromise: Promise<string> | null = null;

async function getStorageGatewayUrl(): Promise<string> {
  if (!_directUrlBasePromise) {
    _directUrlBasePromise = loadConfig().then(
      (config) => config.storage_gateway_url,
    );
  }
  return _directUrlBasePromise;
}

/**
 * Converts a blobId stored in the backend (e.g. "!caf!sha256:abc...") into a
 * direct HTTP URL that can be used in <img src>, <video src>, fetch(), etc.
 *
 * Falls back to returning the raw string for legacy entries that may have
 * stored a plain URL or file name.
 */
export async function getDirectUrlFromBlobId(blobId: string): Promise<string> {
  if (!blobId) return blobId;

  if (!blobId.startsWith(MOTOKO_DEDUPLICATION_SENTINEL)) {
    // Old entry or plain URL — return as-is
    return blobId;
  }

  const hash = blobId.substring(MOTOKO_DEDUPLICATION_SENTINEL.length);
  const gatewayUrl = await getStorageGatewayUrl();
  // Construct direct URL: {gateway_url}/{hash}
  const base = gatewayUrl.endsWith("/") ? gatewayUrl.slice(0, -1) : gatewayUrl;
  return `${base}/${hash}`;
}
