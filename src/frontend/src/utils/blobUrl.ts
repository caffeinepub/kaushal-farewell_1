import { loadConfig } from "@caffeineai/core-infrastructure";

const MOTOKO_DEDUPLICATION_SENTINEL = "!caf!";

interface StorageConfig {
  storageGatewayUrl: string;
  backendCanisterId: string;
  projectId: string;
}

let _configPromise: Promise<StorageConfig> | null = null;

async function getStorageConfig(): Promise<StorageConfig> {
  if (!_configPromise) {
    _configPromise = loadConfig().then((config) => ({
      storageGatewayUrl: config.storage_gateway_url,
      backendCanisterId: config.backend_canister_id,
      projectId: config.project_id,
    }));
  }
  return _configPromise;
}

/**
 * Converts a blobId stored in the backend (e.g. "!caf!sha256:abc...") into a
 * direct HTTP URL that can be used in <img src>, <video src>, fetch(), etc.
 *
 * The correct URL format for the object-storage gateway is:
 *   {storage_gateway_url}/v1/blob/?blob_hash=sha256:HASH&owner_id=CANISTER_ID&project_id=PROJECT_ID
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

  // Extract the hash portion: "sha256:HASH"
  const hash = blobId.substring(MOTOKO_DEDUPLICATION_SENTINEL.length);

  const { storageGatewayUrl, backendCanisterId, projectId } =
    await getStorageConfig();

  const base = storageGatewayUrl.endsWith("/")
    ? storageGatewayUrl.slice(0, -1)
    : storageGatewayUrl;

  const params = new URLSearchParams({
    blob_hash: hash,
    owner_id: backendCanisterId,
    project_id: projectId,
  });

  return `${base}/v1/blob/?${params.toString()}`;
}
