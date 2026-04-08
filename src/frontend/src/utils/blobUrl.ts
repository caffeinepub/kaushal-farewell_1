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
//   3. "HASH" (64 hex)      — rare legacy entries with just the raw hex hash
//   4. "https://..."        — very old entries that stored a full URL directly
//
// This function handles ALL formats and ALWAYS returns the proper query-param
// URL for GET access, or null if the config is unavailable.
// It NEVER returns a raw blobId as a URL — that would cause the GET error.
// ─────────────────────────────────────────────────────────────────────────────

interface StorageConfig {
  gateway: string;
  canisterId: string;
  projectId: string;
}

let cachedConfig: StorageConfig | null = null;

async function getStorageConfig(): Promise<StorageConfig | null> {
  if (cachedConfig) return cachedConfig;
  try {
    const config = await loadConfig();
    const gateway = config.storage_gateway_url as string | undefined;
    const canisterId = config.backend_canister_id as string | undefined;
    const projectId = config.project_id as string | undefined;
    if (!gateway || !canisterId || !projectId) {
      console.error("[blobUrl] Missing config values:", {
        gateway,
        canisterId,
        projectId,
      });
      return null;
    }
    cachedConfig = {
      gateway: gateway.replace(/\/$/, ""),
      canisterId,
      projectId,
    };
    return cachedConfig;
  } catch (err) {
    console.error("[blobUrl] Failed to load config:", err);
    return null;
  }
}

/**
 * Extracts the raw SHA-256 hex hash from any blobId format.
 *
 * Returns:
 *   - The hex hash string for formats 1–3
 *   - null for legacy full URLs (https://...) — caller should use them as-is
 *   - null for unrecognised formats — caller should NOT use the raw string as a URL
 */
function extractSha256Hash(blobId: string): string | null {
  if (!blobId) return null;

  // Legacy full URL — handled separately by the caller
  if (blobId.startsWith("https://") || blobId.startsWith("http://")) {
    return null;
  }

  // Current format: !caf!sha256:HASH
  if (blobId.startsWith("!caf!sha256:")) {
    return blobId.slice("!caf!sha256:".length);
  }

  // Older format without sentinel: sha256:HASH
  if (blobId.startsWith("sha256:")) {
    return blobId.slice("sha256:".length);
  }

  // Raw hex hash (exactly 64 lowercase hex chars)
  if (/^[0-9a-f]{64}$/i.test(blobId)) {
    return blobId;
  }

  // Completely unknown format — log and return null so caller returns null
  console.error("[blobUrl] Unrecognized blobId format:", blobId);
  return null;
}

/**
 * Converts any blobId stored in the backend into the proper storage gateway
 * GET URL that can be used in <img src>, fetch(), window.open(), etc.
 *
 * ALWAYS returns the correct query-param URL format:
 *   {storage_gateway_url}/v1/blob/?blob_hash=sha256:HASH&owner_id=CANISTER_ID&project_id=PROJECT_ID
 *
 * Returns null if:
 *   - The blobId is empty / unrecognized
 *   - The storage config (gateway URL, canister ID, project ID) cannot be loaded
 *
 * NEVER returns a raw "sha256:..." or "!caf!..." string as a URL — doing so
 * causes "Method GET not supported" errors from the storage gateway.
 */
export async function getDirectUrlFromBlobId(
  blobId: string,
): Promise<string | null> {
  if (!blobId) return null;

  // Legacy full URL — already valid for GET
  if (blobId.startsWith("https://") || blobId.startsWith("http://")) {
    return blobId;
  }

  const hash = extractSha256Hash(blobId);
  if (!hash) {
    console.error("[blobUrl] Could not extract hash from blobId:", blobId);
    return null;
  }

  const config = await getStorageConfig();
  if (!config) {
    console.error("[blobUrl] No storage config available for blobId:", blobId);
    return null;
  }

  // Build the query-param URL — the ONLY format that supports GET
  const params = new URLSearchParams({
    blob_hash: `sha256:${hash}`,
    owner_id: config.canisterId,
    project_id: config.projectId,
  });

  return `${config.gateway}/v1/blob/?${params.toString()}`;
}
