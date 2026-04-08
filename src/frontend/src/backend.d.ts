import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface UploadEntry {
    uploaderName: string;
    fileName: string;
    timestamp: bigint;
    blobId: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adminLogin(password: string): Promise<string | null>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteAllUploads(sessionToken: string): Promise<void>;
    deleteSelectedUploads(blobIds: Array<string>, sessionToken: string): Promise<void>;
    deleteUpload(blobId: string, sessionToken: string): Promise<void>;
    getAllUploads(sessionToken: string): Promise<Array<UploadEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getStats(sessionToken: string): Promise<[bigint, bigint]>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    uploadMemory(uploaderName: string, file: ExternalBlob, fileName: string): Promise<void>;
}
