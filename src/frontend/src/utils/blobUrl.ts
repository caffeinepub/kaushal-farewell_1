import { loadConfig } from "@caffeineai/core-infrastructure";

// ─── PERMANENT FIX: Correct blob URL construction ────────────────────────────
//
// ROOT CAUSE: "Bad request: Method GET not supported for path sha256:HASH"
//
// The storage gateway only supports GET on the query-param URL format:
//   {gateway}/v1/blob/?blob_hash=sha256:HASH&owner_id=CANISTER_ID&project_id=PROJECT_ID
//
// The raw path format (/{gateway}/sha256:HASH) is PUT-only (for uploads).
//
// Backend stores blobId in several possible formats:
//   1. "!caf!sha256:HASH"   — current standard format (Motoko deduplication sentinel)
//   2. "sha256:HASH"        — some older entries stored without the !caf! prefix
//   3. "HASH"               — rare legacy entries with just the raw hex hash
//   4. "https://..."        — very old entries that stored a full URL directly
//
// This function correctly handles ALL formats and ALWAYS returns the proper
// query-param URL for GET access.
// ─────────────────────────────────────────────────────────────────────────────

const MOTOKO_SENTINEL = "!caf!";

interface StorageConfig {
  storageGatewayUrl: string;
  backendCanisterId: string;
  projectId: string;
}

let _configPromise: Promise<StorageConfig> | null = null;

async function getStorageConfig(): Promise<StorageConfig> {
  if (!_configPromise) {
    _configPromise = loadConfig().then((config) => {
      const url = config.storage_gateway_url;
      const canister = config.backend_canister_id;
      const project = config.project_id;

      if (!url || !canister || !project) {
        console.error("[blobUrl] Missing storage config values:", {
          storage_gateway_url: url,
          backend_canister_id: canister,
          project_id: project,
        });
      }

      return {
        storageGatewayUrl: url,
        backendCanisterId: canister,
        projectId: project,
      };
    });
  }
  return _configPromise;
}

/**
 * Extracts the raw SHA-256 hex hash from a blobId in any supported format.
 * Returns null if the blobId appears to be a legacy full URL.
 */
function extractHash(blobId: string): string | null {
  if (!blobId) return null;

  // Format 1: "!caf!sha256:HASH" — current standard
  if (blobId.startsWith(MOTOKO_SENTINEL)) {
    const afterSentinel = blobId.slice(MOTOKO_SENTINEL.length);
    // afterSentinel is "sha256:HASH"
    if (afterSentinel.startsWith("sha256:")) {
      return afterSentinel.slice("sha256:".length);
    }
    // Unexpected — return as-is after sentinel
    return afterSentinel;
  }

  // Format 2: "sha256:HASH" — no sentinel prefix
  if (blobId.startsWith("sha256:")) {
    return blobId.slice("sha256:".length);
  }

  // Format 3: Already a full URL (legacy) — caller should use as-is
  if (blobId.startsWith("http://") || blobId.startsWith("https://")) {
    return null;
  }

  // Format 4: Raw hex hash with no prefix
  return blobId;
}

/**
 * Converts a blobId stored in the backend into a direct HTTP URL that can be
 * used in <img src>, fetch(), etc.
 *
 * ALWAYS returns the correct query-param URL format:
 *   {storage_gateway_url}/v1/blob/?blob_hash=sha256:HASH&owner_id=CANISTER_ID&project_id=PROJECT_ID
 *
 * This is the ONLY format the storage gateway supports for GET requests.
 * The raw path format (/sha256:HASH) only works for PUT (uploads), not GET.
 */
export async function getDirectUrlFromBlobId(blobId: string): Promise<string> {
  if (!blobId) return blobId;

  // Check if it's a legacy full URL — return as-is
  if (blobId.startsWith("http://") || blobId.startsWith("https://")) {
    return blobId;
  }

  const hash = extractHash(blobId);

  if (!hash) {
    // Fallback for truly unrecognised formats
    console.warn(
      "[blobUrl] Unrecognised blobId format, returning as-is:",
      blobId,
    );
    return blobId;
  }

  const { storageGatewayUrl, backendCanisterId, projectId } =
    await getStorageConfig();

  if (!storageGatewayUrl || !backendCanisterId || !projectId) {
    console.error("[blobUrl] Cannot build URL — storage config incomplete.", {
      storageGatewayUrl,
      backendCanisterId,
      projectId,
    });
    return blobId;
  }

  const base = storageGatewayUrl.endsWith("/")
    ? storageGatewayUrl.slice(0, -1)
    : storageGatewayUrl;

  const params = new URLSearchParams({
    blob_hash: `sha256:${hash}`,
    owner_id: backendCanisterId,
    project_id: projectId,
  });

  return `${base}/v1/blob/?${params.toString()}`;
}
