import {
  createActorWithConfig,
  useInternetIdentity,
} from "@caffeineai/core-infrastructure";
import type { Identity } from "@icp-sdk/core/agent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createActor } from "../backend";
import type { ExternalBlob } from "../backend";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CreateActorFn = (
  canisterId: string,
  uploadFile: any,
  downloadFile: any,
  options: any,
) => BackendActor;

const createActorFn: CreateActorFn = (
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

async function buildActor(identity?: Identity): Promise<BackendActor> {
  // NOTE: globalThis.fetch is already patched in main.tsx (before React renders)
  // to redirect localhost:8081/api/* → icp-api.io/api/*. That patch covers ALL
  // libraries including the StorageClient's internally-created HttpAgent.
  //
  // We also pass it explicitly here as a belt-and-suspenders measure, in case
  // createActorWithConfig creates an HttpAgent that captures fetch at
  // construction time rather than using globalThis.fetch dynamically.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (createActorWithConfig as any)(createActorFn, {
    agentOptions: {
      ...(identity ? { identity } : {}),
      fetch: globalThis.fetch,
    },
  });
}

const ACTOR_QUERY_KEY = "actor";

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const actorQuery = useQuery({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: () => buildActor(identity as Identity | undefined),
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
      queryClient.refetchQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data ?? null,
    isFetching: actorQuery.isFetching,
  };
}
