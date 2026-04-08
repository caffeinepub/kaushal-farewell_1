import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// ─── PERMANENT FIX: Patch globalThis.fetch at startup ─────────────────────────
//
// ROOT CAUSE: The Caffeine platform sets backend_host = "http://localhost:8081"
// in env.json. StorageClient.getCertificate() calls agent.call() which hits
// /api/v3/canister/{id}/call on localhost:8081. The proxy does NOT support v3
// and falls back to v2, returning a null/empty body. This causes:
//   isV3ResponseBody(null) = false → "Expected v3 response body" error.
//
// FIX: Intercept ALL fetch calls (from actor, storage client, any library)
// that target localhost:8081/api/* and redirect them to icp-api.io/api/*.
// By patching globalThis.fetch here — before React renders — every library
// (including internally-created HttpAgents in the storage client) uses this
// patched fetch automatically.
// ─────────────────────────────────────────────────────────────────────────────
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

  // Rewrite any localhost:8081/api/* → icp-api.io/api/*
  // This covers /api/v2/ and /api/v3/ calls that the StorageClient makes
  if (/https?:\/\/localhost:\d+\/api\//.test(url)) {
    const rewritten = url.replace(
      /https?:\/\/localhost:\d+\/api\//,
      `${IC_MAINNET_API}/api/`,
    );
    return _originalFetch(rewritten, init);
  }

  return _originalFetch(input, init);
};

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <App />
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
