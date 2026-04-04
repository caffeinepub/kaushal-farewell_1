import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Download,
  Eye,
  File,
  FileImage,
  FileVideo,
  Heart,
  Loader2,
  LogOut,
  RefreshCw,
  Shield,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UploadEntry } from "../backend";
import { useActor } from "../hooks/useActor";
import { getDirectUrlFromBlobId } from "../utils/blobUrl";

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "heic", "avif"];
const VIDEO_EXTS = ["mp4", "mov", "avi", "mkv", "webm", "m4v"];
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function getFileExt(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isImage(fileName: string): boolean {
  return IMAGE_EXTS.includes(getFileExt(fileName));
}

function isVideo(fileName: string): boolean {
  return VIDEO_EXTS.includes(getFileExt(fileName));
}

interface AdminPageProps {
  onNavigateHome: () => void;
}

interface PreviewEntry {
  blobId: string;
  fileName: string;
  uploaderName: string;
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  const date = new Date(ms);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileTypeIcon(fileName: string) {
  const ext = getFileExt(fileName);
  if (IMAGE_EXTS.includes(ext))
    return (
      <FileImage
        className="w-4 h-4"
        style={{ color: "oklch(var(--coral-primary))" }}
      />
    );
  if (VIDEO_EXTS.includes(ext))
    return (
      <FileVideo
        className="w-4 h-4"
        style={{ color: "oklch(var(--coral-primary))" }}
      />
    );
  return (
    <File
      className="w-4 h-4"
      style={{ color: "oklch(var(--muted-foreground))" }}
    />
  );
}

function MediaThumbnail({
  blobId,
  fileName,
  onClick,
}: {
  blobId: string;
  fileName: string;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDirectUrlFromBlobId(blobId).then((resolved) => {
      if (!cancelled) setUrl(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [blobId]);

  if (isImage(fileName)) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative flex-shrink-0 overflow-hidden rounded-lg border border-border/40 cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
        style={{ width: 64, height: 48 }}
        aria-label="Preview image"
        data-ocid="admin.uploads.preview_button"
      >
        {(!loaded || !url) && (
          <Skeleton className="absolute inset-0 rounded-lg" />
        )}
        {url && (
          <img
            src={url}
            alt={fileName}
            className="w-full h-full object-cover rounded-lg"
            style={{ display: loaded ? "block" : "none" }}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
          />
        )}
        {loaded && url && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors rounded-lg">
            <Eye className="w-3.5 h-3.5 text-white opacity-0 hover:opacity-100" />
          </div>
        )}
      </button>
    );
  }

  if (isVideo(fileName)) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative flex-shrink-0 overflow-hidden rounded-lg border border-border/40 cursor-pointer hover:opacity-90 transition-opacity bg-black focus:outline-none focus:ring-2 focus:ring-ring"
        style={{ width: 80, height: 48 }}
        aria-label="Preview video"
        data-ocid="admin.uploads.preview_button"
      >
        {url ? (
          <video
            src={url}
            muted
            preload="metadata"
            className="w-full h-full object-cover rounded-lg"
            style={{ pointerEvents: "none" }}
          >
            <track kind="captions" />
          </video>
        ) : (
          <Skeleton className="absolute inset-0 rounded-lg" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "oklch(0.63 0.14 29 / 0.9)" }}
          >
            <span className="text-white text-xs ml-0.5">▶</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div
      className="flex-shrink-0 rounded-lg border border-border/40 flex items-center justify-center"
      style={{
        width: 48,
        height: 48,
        backgroundColor: "oklch(0.96 0.015 55)",
      }}
    >
      {getFileTypeIcon(fileName)}
    </div>
  );
}

function MediaPreviewModal({
  entry,
  onClose,
}: {
  entry: PreviewEntry | null;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!entry) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    getDirectUrlFromBlobId(entry.blobId).then((resolved) => {
      if (!cancelled) setUrl(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [entry]);

  if (!entry) return null;

  return (
    <Dialog open={!!entry} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-3xl w-full p-0 overflow-hidden rounded-2xl"
        style={{ backgroundColor: "oklch(0.14 0.02 30)" }}
        data-ocid="admin.preview.dialog"
      >
        <DialogHeader
          className="px-5 pt-4 pb-3 border-b"
          style={{ borderColor: "oklch(1 0 0 / 0.1)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle
                className="text-base font-semibold leading-tight"
                style={{ color: "oklch(0.95 0.02 55)" }}
              >
                {entry.fileName}
              </DialogTitle>
              <p
                className="text-xs mt-0.5"
                style={{ color: "oklch(0.65 0.04 40)" }}
              >
                Uploaded by{" "}
                <span style={{ color: "oklch(0.78 0.1 30)" }}>
                  {entry.uploaderName}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: "oklch(1 0 0 / 0.1)" }}
              data-ocid="admin.preview.close_button"
            >
              <X className="w-4 h-4" style={{ color: "oklch(0.85 0.02 55)" }} />
            </button>
          </div>
        </DialogHeader>

        <div
          className="flex items-center justify-center p-4"
          style={{ minHeight: 320, backgroundColor: "oklch(0.1 0.01 30)" }}
        >
          {!url ? (
            <Skeleton className="w-full h-64 rounded-lg" />
          ) : isImage(entry.fileName) ? (
            <img
              src={url}
              alt={entry.fileName}
              className="max-w-full max-h-[65vh] object-contain rounded-lg"
              style={{ boxShadow: "0 8px 40px oklch(0 0 0 / 0.5)" }}
            />
          ) : isVideo(entry.fileName) ? (
            <video
              src={url}
              controls
              autoPlay
              className="max-w-full max-h-[65vh] rounded-lg"
              style={{ boxShadow: "0 8px 40px oklch(0 0 0 / 0.5)" }}
            >
              <track kind="captions" />
            </video>
          ) : (
            <div className="text-center py-12">
              <File
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: "oklch(0.65 0.04 40)" }}
              />
              <p className="text-sm" style={{ color: "oklch(0.65 0.04 40)" }}>
                Preview not available for this file type.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPage({ onNavigateHome }: AdminPageProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);
  const [previewEntry, setPreviewEntry] = useState<PreviewEntry | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Local data state — fetched only after login
  const [uploads, setUploads] = useState<UploadEntry[] | null>(null);
  const [stats, setStats] = useState<[bigint, bigint] | null>(null);
  const [uploadsLoading, setUploadsLoading] = useState(false);

  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { actor } = useActor();

  const totalUploads = stats ? Number(stats[0]) : 0;
  const uniqueUploaders = stats ? Number(stats[1]) : 0;

  // Fetch admin data — only called after login
  const fetchAdminData = useCallback(
    async (token: string) => {
      if (!actor) return;
      setUploadsLoading(true);
      try {
        const [fetchedUploads, fetchedStats] = await Promise.all([
          actor.getAllUploads(token),
          actor.getStats(token),
        ]);
        setUploads(fetchedUploads);
        setStats(fetchedStats);
      } catch {
        toast.error("Failed to load uploads. Please refresh.");
      } finally {
        setUploadsLoading(false);
      }
    },
    [actor],
  );

  // Load data once logged in and actor is ready
  useEffect(() => {
    if (isLoggedIn && actor !== null && sessionToken) {
      fetchAdminData(sessionToken);
    }
  }, [isLoggedIn, actor, sessionToken, fetchAdminData]);

  // Session timeout
  const resetSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    sessionTimerRef.current = setTimeout(() => {
      setIsLoggedIn(false);
      setSessionToken(null);
      setEmail("");
      setPassword("");
      setUploads(null);
      setStats(null);
      toast.error("Session expired. Please log in again.");
    }, SESSION_TIMEOUT_MS);
  }, []);

  // Activity listeners to reset session timer
  useEffect(() => {
    if (!isLoggedIn) return;
    const events = ["mousemove", "keydown", "click", "scroll"] as const;
    const handler = () => resetSessionTimer();
    for (const ev of events) window.addEventListener(ev, handler);
    return () => {
      for (const ev of events) window.removeEventListener(ev, handler);
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    };
  }, [isLoggedIn, resetSessionTimer]);

  // Lockout countdown
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setLockoutSecondsLeft(0);
        setLoginError("");
        setFailedAttempts(0);
      } else {
        setLockoutSecondsLeft(remaining);
        setLoginError(`Too many failed attempts. Try again in ${remaining}s.`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleViewFile = async (blobId: string) => {
    const url = await getDirectUrlFromBlobId(blobId);
    window.open(url, "_blank");
  };

  const handleDownload = async (blobId: string, fileName: string) => {
    setDownloadingIds((prev) => new Set(prev).add(blobId));
    try {
      const url = await getDirectUrlFromBlobId(blobId);
      const response = await fetch(url);
      const data = await response.blob();
      const objectUrl = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(blobId);
        return next;
      });
    }
  };

  const handleDelete = async (blobId: string) => {
    if (!sessionToken) return;
    setDeletingIds((prev) => new Set(prev).add(blobId));
    try {
      if (actor) {
        await actor.deleteUpload(blobId, sessionToken);
        await fetchAdminData(sessionToken);
      }
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(blobId);
        return next;
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil) return;

    if (!actor) {
      setLoginError("Still connecting, please wait a moment and try again.");
      return;
    }

    setIsLoginLoading(true);
    try {
      const token = await actor.adminLogin(password);
      if (token !== null) {
        setSessionToken(token);
        setIsLoggedIn(true);
        setLoginError("");
        setFailedAttempts(0);
        resetSessionTimer();
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        if (newAttempts >= 5) {
          setLockoutUntil(Date.now() + 30_000);
          setLoginError("Too many failed attempts. Please wait 30 seconds.");
        } else {
          setLoginError(
            `Invalid password. ${5 - newAttempts} attempt${
              5 - newAttempts === 1 ? "" : "s"
            } remaining.`,
          );
        }
      }
    } catch {
      setLoginError("Connection error. Please try again.");
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setSessionToken(null);
    setEmail("");
    setPassword("");
    setLoginError("");
    setFailedAttempts(0);
    setLockoutUntil(null);
    setUploads(null);
    setStats(null);
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
  };

  void lockoutSecondsLeft;

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.93 0.04 55) 0%, oklch(0.88 0.07 35) 50%, oklch(0.82 0.1 25) 100%)",
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 shadow-header"
        style={{ backgroundColor: "oklch(var(--header-bg))" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onNavigateHome}
                className="flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: "oklch(0.55 0.06 40)" }}
                data-ocid="admin.back.link"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.63 0.14 29), oklch(0.72 0.11 28))",
                  }}
                >
                  <Shield className="w-3.5 h-3.5 text-white" />
                </div>
                <span
                  className="font-display font-bold text-base"
                  style={{ color: "oklch(var(--hero-brown))" }}
                >
                  Admin Panel
                </span>
              </div>
            </div>
            {isLoggedIn && (
              <Button
                onClick={handleSignOut}
                className="rounded-full font-semibold px-6 text-white"
                style={{ background: "oklch(0.55 0.06 40)" }}
                data-ocid="admin.signout.button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {!isLoggedIn ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
            data-ocid="admin.login.panel"
          >
            <div
              className="w-full max-w-sm rounded-2xl shadow-card p-8"
              style={{ backgroundColor: "oklch(1 0 0)" }}
            >
              <div className="flex justify-center mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.63 0.14 29), oklch(0.72 0.11 28))",
                  }}
                >
                  <Shield className="w-7 h-7 text-white" />
                </div>
              </div>

              <h2
                className="font-display font-bold text-2xl text-center mb-6"
                style={{ color: "oklch(var(--hero-brown))" }}
              >
                Admin Login
              </h2>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="admin-email"
                    className="text-sm font-medium"
                    style={{ color: "oklch(var(--hero-brown))" }}
                  >
                    Email
                  </Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    disabled={!!lockoutUntil}
                    className="rounded-xl border-border/60 focus:border-coral/60"
                    data-ocid="admin.login.input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="admin-password"
                    className="text-sm font-medium"
                    style={{ color: "oklch(var(--hero-brown))" }}
                  >
                    Password
                  </Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={!!lockoutUntil}
                    className="rounded-xl border-border/60 focus:border-coral/60"
                    data-ocid="admin.login.password"
                  />
                </div>

                {loginError && (
                  <p
                    className="text-sm text-center"
                    style={{ color: "oklch(0.5 0.18 25)" }}
                    data-ocid="admin.login.error_state"
                  >
                    {loginError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={!!lockoutUntil || isLoginLoading || !actor}
                  className="w-full rounded-xl font-semibold text-white mt-2"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.63 0.14 29), oklch(0.72 0.11 28))",
                  }}
                  data-ocid="admin.login.submit_button"
                >
                  {!actor ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : isLoginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div
                className="rounded-2xl p-5 shadow-card"
                style={{ backgroundColor: "oklch(1 0 0)" }}
                data-ocid="admin.stats.card"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "oklch(0.93 0.04 55)" }}
                  >
                    <Upload
                      className="w-5 h-5"
                      style={{ color: "oklch(var(--coral-primary))" }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-2xl font-display font-bold"
                      style={{ color: "oklch(var(--hero-brown))" }}
                    >
                      {totalUploads}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Total Uploads
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="rounded-2xl p-5 shadow-card"
                style={{ backgroundColor: "oklch(1 0 0)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "oklch(0.93 0.04 55)" }}
                  >
                    <Users
                      className="w-5 h-5"
                      style={{ color: "oklch(var(--coral-primary))" }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-2xl font-display font-bold"
                      style={{ color: "oklch(var(--hero-brown))" }}
                    >
                      {uniqueUploaders}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Contributors
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Uploads table */}
            <div
              className="rounded-2xl shadow-card overflow-hidden"
              style={{ backgroundColor: "oklch(1 0 0)" }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Heart
                    className="w-4 h-4"
                    style={{ color: "oklch(var(--coral-primary))" }}
                  />
                  <h3
                    className="font-display font-bold text-base"
                    style={{ color: "oklch(var(--hero-brown))" }}
                  >
                    All Uploaded Memories
                  </h3>
                  {uploads && (
                    <Badge variant="secondary" className="text-xs">
                      {uploads.length}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => sessionToken && fetchAdminData(sessionToken)}
                  className="gap-2 text-xs"
                  data-ocid="admin.refresh.button"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </Button>
              </div>

              {uploadsLoading ? (
                <div
                  className="p-5 space-y-3"
                  data-ocid="admin.uploads.loading_state"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-16 rounded-lg" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : !uploads || uploads.length === 0 ? (
                <div
                  className="py-16 text-center"
                  data-ocid="admin.uploads.empty_state"
                >
                  <Heart
                    className="w-10 h-10 mx-auto mb-3 opacity-30"
                    style={{ color: "oklch(var(--coral-primary))" }}
                  />
                  <p
                    className="text-sm font-medium"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    No uploads yet
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "oklch(0.65 0.04 55)" }}
                  >
                    Share the upload link with guests to start collecting
                    memories.
                  </p>
                </div>
              ) : (
                <div
                  className="overflow-x-auto"
                  data-ocid="admin.uploads.table"
                >
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider w-10"
                          style={{ color: "oklch(var(--hero-brown))" }}
                        >
                          #
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider w-24"
                          style={{ color: "oklch(var(--hero-brown))" }}
                        >
                          Preview
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: "oklch(var(--hero-brown))" }}
                        >
                          Uploader
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: "oklch(var(--hero-brown))" }}
                        >
                          File Name
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: "oklch(var(--hero-brown))" }}
                        >
                          Timestamp
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider text-right"
                          style={{ color: "oklch(var(--hero-brown))" }}
                        >
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {uploads.map((entry, idx) => (
                          <motion.tr
                            key={entry.blobId}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04, duration: 0.25 }}
                            className="border-border/30 hover:bg-accent/30 transition-colors"
                            data-ocid={`admin.uploads.item.${idx + 1}`}
                          >
                            <TableCell
                              className="text-xs"
                              style={{
                                color: "oklch(var(--muted-foreground))",
                              }}
                            >
                              {idx + 1}
                            </TableCell>

                            <TableCell>
                              <MediaThumbnail
                                blobId={entry.blobId}
                                fileName={entry.fileName}
                                onClick={() =>
                                  setPreviewEntry({
                                    blobId: entry.blobId,
                                    fileName: entry.fileName,
                                    uploaderName: entry.uploaderName,
                                  })
                                }
                              />
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                  style={{
                                    background:
                                      "linear-gradient(135deg, oklch(0.63 0.14 29), oklch(0.72 0.11 28))",
                                  }}
                                >
                                  {entry.uploaderName.charAt(0).toUpperCase()}
                                </div>
                                <span
                                  className="text-sm font-medium"
                                  style={{ color: "oklch(var(--hero-brown))" }}
                                >
                                  {entry.uploaderName}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {getFileTypeIcon(entry.fileName)}
                                <span
                                  className="text-sm max-w-[180px] truncate block"
                                  style={{ color: "oklch(var(--foreground))" }}
                                  title={entry.fileName}
                                >
                                  {entry.fileName}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell
                              className="text-xs whitespace-nowrap"
                              style={{
                                color: "oklch(var(--muted-foreground))",
                              }}
                            >
                              {formatTimestamp(entry.timestamp)}
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewFile(entry.blobId)}
                                  className="h-8 w-8 p-0 rounded-lg border-border/60 hover:border-primary/50"
                                  title="Open in new tab"
                                  data-ocid={`admin.uploads.view_button.${idx + 1}`}
                                >
                                  <Eye
                                    className="w-3.5 h-3.5"
                                    style={{
                                      color: "oklch(var(--coral-primary))",
                                    }}
                                  />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDownload(entry.blobId, entry.fileName)
                                  }
                                  disabled={downloadingIds.has(entry.blobId)}
                                  className="h-8 w-8 p-0 rounded-lg border-border/60 hover:border-primary/50"
                                  title="Download"
                                  data-ocid={`admin.uploads.download_button.${idx + 1}`}
                                >
                                  {downloadingIds.has(entry.blobId) ? (
                                    <Loader2
                                      className="w-3.5 h-3.5 animate-spin"
                                      style={{
                                        color: "oklch(var(--muted-foreground))",
                                      }}
                                    />
                                  ) : (
                                    <Download
                                      className="w-3.5 h-3.5"
                                      style={{
                                        color: "oklch(var(--coral-primary))",
                                      }}
                                    />
                                  )}
                                </Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={deletingIds.has(entry.blobId)}
                                      className="h-8 w-8 p-0 rounded-lg border-border/60 hover:border-red-400/50"
                                      title="Delete"
                                      data-ocid={`admin.uploads.delete_button.${idx + 1}`}
                                    >
                                      {deletingIds.has(entry.blobId) ? (
                                        <Loader2
                                          className="w-3.5 h-3.5 animate-spin"
                                          style={{
                                            color:
                                              "oklch(var(--muted-foreground))",
                                          }}
                                        />
                                      ) : (
                                        <Trash2
                                          className="w-3.5 h-3.5"
                                          style={{
                                            color: "oklch(0.55 0.18 25)",
                                          }}
                                        />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent data-ocid="admin.uploads.delete.dialog">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete this upload?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently remove the file
                                        and cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel data-ocid="admin.uploads.delete.cancel_button">
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDelete(entry.blobId)
                                        }
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        data-ocid="admin.uploads.delete.confirm_button"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="py-6 px-4 mt-8 border-t"
        style={{
          borderColor: "oklch(1 0 0 / 0.2)",
          backgroundColor: "oklch(0.38 0.09 35 / 0.15)",
        }}
      >
        <div className="max-w-6xl mx-auto text-center space-y-1">
          <p className="text-xs" style={{ color: "oklch(0.45 0.06 40)" }}>
            Created by Dhruv Dhameliya
          </p>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs hover:underline"
            style={{ color: "oklch(0.55 0.05 40)" }}
          >
            © {new Date().getFullYear()}. Built with love using caffeine.ai
          </a>
        </div>
      </footer>

      <MediaPreviewModal
        entry={previewEntry}
        onClose={() => setPreviewEntry(null)}
      />
    </div>
  );
}
