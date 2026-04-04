import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob } from "../backend";
import { useActor } from "./useActor";

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
