// ─── STEP 1: Apply the fetch patch FIRST, before any other import ─────────────
// This module overwrites globalThis.fetch before any library (InternetIdentity,
// StorageClient, etc.) can capture a reference to the original fetch.
// ESM import order guarantees this module runs before the ones below.
import "./fetch-patch";

// ─── STEP 2: All other imports ────────────────────────────────────────────────
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

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <App />
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
