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

// The IC mainnet API endpoint — supports /api/v3/canister/{id}/call (sync calls)
// which is required by StorageClient.getCertificate() to get the IC consensus
// certificate for upload authorization.
const IC_MAINNET_API = "https://icp-api.io";

/**
 * Creates a patched fetch function that rewrites IC API calls from the
 * Caffeine localhost:8081 proxy to icp-api.io directly.
 *
 * Root cause of "Expected v3 response body" error:
 * - The Caffeine platform sets env.json backend_host = "http://localhost:8081"
 * - StorageClient calls agent.call() → /api/v3/canister/{id}/call on localhost:8081
 * - The localhost proxy doesn't support v3 (returns 404) → agent falls back to v2
 * - v2 response body is null (202 accepted) → isV3ResponseBody(null) = false → error
 *
 * Fix: Route /api/v3/ and /api/v2/ IC calls through icp-api.io which DOES support
 * the v3 sync endpoint and returns the certificate in the response body.
 */
function createIcApiFetch(): typeof globalThis.fetch {
  const baseFetch = globalThis.fetch.bind(globalThis);
  return function icApiFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    let url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

    // Rewrite localhost:8081 IC API calls to go directly to icp-api.io
    if (url.includes("localhost:8081/api/")) {
      url = url.replace(
        /https?:\/\/localhost:\d+\/api\//,
        `${IC_MAINNET_API}/api/`,
      );
      return baseFetch(url, init);
    }

    return baseFetch(input, init);
  };
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (createActorWithConfig as any)(createActorFn, {
    agentOptions: {
      ...(identity ? { identity } : {}),
      // Patch fetch so that agent.call() for StorageClient.getCertificate()
      // goes to icp-api.io instead of localhost:8081, enabling v3 sync calls
      // which return the IC certificate needed for storage uploads.
      fetch: createIcApiFetch(),
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
