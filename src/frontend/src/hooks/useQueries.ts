import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UploadEntry } from "../backend";
import { ExternalBlob } from "../backend";
import { useActor } from "./useActor";

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllUploads() {
  const { actor } = useActor();
  return useQuery<UploadEntry[]>({
    queryKey: ["allUploads"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUploads();
    },
    enabled: !!actor,
  });
}

export function useGetStats() {
  const { actor } = useActor();
  return useQuery<[bigint, bigint]>({
    queryKey: ["stats"],
    queryFn: async () => {
      if (!actor) return [0n, 0n];
      return actor.getStats();
    },
    enabled: !!actor,
  });
}

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export function useUploadMemory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      uploaderName,
      file,
      fileName,
      onProgress,
    }: {
      uploaderName: string;
      file: File;
      fileName: string;
      onProgress: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(onProgress);
      await actor.uploadMemory(uploaderName, blob, fileName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUploads"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
