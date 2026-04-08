/**
 * CRITICAL FETCH PATCH — must be the very first module executed.
 *
 * WHY: The Caffeine platform sets backend_host = "http://localhost:8081" in
 * env.json. StorageClient.getCertificate() builds an HttpAgent internally and
 * calls /api/v3/canister/{id}/call on localhost:8081. That proxy does NOT
 * support the v3 endpoint, so the response body is null/empty, which causes:
 *   isV3ResponseBody(null) = false → "Expected v3 response body" error.
 *
 * FIX: Intercept ALL fetch calls targeting localhost:[port]/api/... and redirect
 * them to https://icp-api.io/api/.... By patching globalThis.fetch here — in
 * a dedicated module that is imported before anything else in main.tsx — every
 * library, including internally-created HttpAgent instances inside
 * StorageClient, uses the patched fetch automatically.
 */

const IC_MAINNET_API = "https://icp-api.io";
const _originalFetch = globalThis.fetch.bind(globalThis);

globalThis.fetch = function patchedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let url: string;
  if (typeof input === "string") {
    url = input;
  } else if (input instanceof URL) {
    url = input.href;
  } else {
    url = (input as Request).url;
  }

  // Rewrite any localhost:<port>/api/* → icp-api.io/api/*
  // This covers /api/v2/ and /api/v3/ calls the StorageClient makes
  if (/https?:\/\/localhost:\d+\/api\//.test(url)) {
    const rewritten = url.replace(
      /https?:\/\/localhost:\d+\/api\//,
      `${IC_MAINNET_API}/api/`,
    );
    return _originalFetch(rewritten, init);
  }

  return _originalFetch(input, init);
};

export {};
