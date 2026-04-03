import { HttpAgent } from "@icp-sdk/core/agent";
import { loadConfig } from "../config";
import { StorageClient } from "./StorageClient";

const MOTOKO_DEDUPLICATION_SENTINEL = "!caf!";

let _storageClientPromise: Promise<StorageClient> | null = null;

async function getStorageClient(): Promise<StorageClient> {
  if (!_storageClientPromise) {
    _storageClientPromise = loadConfig().then((config) => {
      const agent = new HttpAgent({ host: config.backend_host });
      return new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
    });
  }
  return _storageClientPromise;
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
  const storageClient = await getStorageClient();
  return storageClient.getDirectURL(hash);
}
