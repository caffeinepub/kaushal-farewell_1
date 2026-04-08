import { useActor as useCoreActor } from "@caffeineai/core-infrastructure";
import type { ExternalBlob } from "../backend";
import { createActor } from "../backend";
import type { UploadEntry } from "../types";

// Full typed interface for the backend actor methods
export interface BackendActor {
  adminLogin(password: string): Promise<string | null>;
  uploadMemory(
    uploaderName: string,
    file: ExternalBlob,
    fileName: string,
  ): Promise<void>;
  deleteUpload(blobId: string, sessionToken: string): Promise<void>;
  deleteAllUploads(sessionToken: string): Promise<void>;
  deleteSelectedUploads(blobIds: string[], sessionToken: string): Promise<void>;
  getAllUploads(sessionToken: string): Promise<UploadEntry[]>;
  getStats(sessionToken: string): Promise<[bigint, bigint]>;
}

const createActorFn = (
  canisterId: string,
  uploadFile: Parameters<typeof createActor>[1],
  downloadFile: Parameters<typeof createActor>[2],
  options: Parameters<typeof createActor>[3],
) =>
  createActor(
    canisterId,
    uploadFile,
    downloadFile,
    options,
  ) as unknown as BackendActor;

export function useActor() {
  return useCoreActor(createActorFn);
}
