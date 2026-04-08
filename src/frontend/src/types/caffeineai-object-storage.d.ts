// Type declarations for @caffeineai/object-storage
// This package is a transitive dependency via @caffeineai/core-infrastructure
// and is not directly listed in package.json, so we declare its types here.
declare module "@caffeineai/object-storage" {
  import type { HttpAgent } from "@icp-sdk/core/agent";

  export class ExternalBlob {
    onProgress?: (percentage: number) => void;
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
  }

  export class StorageClient {
    constructor(
      bucket: string,
      storageGatewayUrl: string,
      backendCanisterId: string,
      projectId: string,
      agent: HttpAgent,
    );
    putFile(
      blobBytes: Uint8Array,
      onProgress?: (percentage: number) => void,
    ): Promise<{ hash: string }>;
    getDirectURL(hash: string): Promise<string>;
  }
}
