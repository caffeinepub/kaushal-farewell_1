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
import { Checkbox } from "@/components/ui/checkbox";
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
  ArrowLeft,
  Download,
  Eye,
  File,
  FileImage,
  Heart,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import type { UploadEntry } from "../types";
import { getDirectUrlFromBlobId } from "../utils/blobUrl";

// ─── Constants ────────────────────────────────────────────────────────────────
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "heic", "avif"];
const VIDEO_EXTS = ["mp4", "mov", "avi", "mkv", "webm", "m4v"];
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const LS_TOKEN_KEY = "kf-admin-token";
const AUTO_REFRESH_MS = 15000;

// ─── Google Drive colour palette (inner dashboard only) ───────────────────────
const GD = {
  bg: "#f8f9fa",
  white: "#ffffff",
  blue: "#1a73e8",
  blueHover: "#1557b0",
  blueBg: "#e8f0fe",
  textPrimary: "#202124",
  textSecondary: "#5f6368",
  border: "#dadce0",
  red: "#d93025",
  redBg: "#fce8e6",
  greenBg: "#e6f4ea",
  green: "#137333",
  rowHover: "#f1f3f4",
  selectedRow: "#e8f0fe",
} as const;

// ─── Luxury/Cinema dark palette (login + outer shell) ────────────────────────
const LX = {
  bg: "oklch(0.18 0.04 35)",
  bgGradient:
    "linear-gradient(160deg, oklch(0.18 0.04 35) 0%, oklch(0.14 0.06 30) 60%, oklch(0.12 0.08 25) 100%)",
  card: "oklch(0.22 0.04 35)",
  cardBorder: "oklch(0.3 0.06 35 / 0.6)",
  coral: "oklch(0.63 0.14 29)",
  coralLight: "oklch(0.72 0.12 28)",
  coralBg: "oklch(0.25 0.06 35)",
  text: "oklch(0.92 0.03 55)",
  textMuted: "oklch(0.65 0.05 40)",
  textDim: "oklch(0.45 0.04 35)",
  gold: "oklch(0.76 0.09 65)",
  error: "oklch(0.62 0.18 25)",
  errorBg: "oklch(0.2 0.06 25)",
  headerBg: "oklch(0.16 0.05 32)",
  headerBorder: "oklch(0.28 0.07 32)",
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getFileExt(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isImage(fileName: string): boolean {
  return IMAGE_EXTS.includes(getFileExt(fileName));
}

function isVideo(fileName: string): boolean {
  return VIDEO_EXTS.includes(getFileExt(fileName));
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

function getFileTypeChip(fileName: string) {
  const ext = getFileExt(fileName);
  if (IMAGE_EXTS.includes(ext)) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ backgroundColor: GD.blueBg, color: GD.blue }}
      >
        <FileImage className="w-3 h-3" />
        Image
      </span>
    );
  }
  if (VIDEO_EXTS.includes(ext)) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ backgroundColor: GD.greenBg, color: GD.green }}
      >
        <FileImage className="w-3 h-3" />
        Video
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: "#f1f3f4", color: GD.textSecondary }}
    >
      <File className="w-3 h-3" />
      File
    </span>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminPageProps {
  onNavigateHome: () => void;
}

interface PreviewEntry {
  blobId: string;
  fileName: string;
  uploaderName: string;
}

type FileTypeFilter = "all" | "images";

// ─── MediaThumbnail ──────────────────────────────────────────────────────────
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
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setError(false);
    setUrl(null);
    getDirectUrlFromBlobId(blobId)
      .then((resolved) => {
        if (!cancelled) setUrl(resolved);
      })
      .catch(() => {
        if (!cancelled) setError(true);
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
        className="relative flex-shrink-0 overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2"
        style={{
          width: 56,
          height: 40,
          borderRadius: 4,
          border: `1px solid ${GD.border}`,
          background: GD.bg,
        }}
        aria-label="Preview image"
      >
        {(!loaded || !url) && !error && (
          <Skeleton className="absolute inset-0" style={{ borderRadius: 4 }} />
        )}
        {error && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: GD.bg }}
          >
            <FileImage
              className="w-4 h-4"
              style={{ color: GD.textSecondary }}
            />
          </div>
        )}
        {url && !error && (
          <img
            src={url}
            alt={fileName}
            className="w-full h-full object-cover"
            style={{ display: loaded ? "block" : "none", borderRadius: 4 }}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setLoaded(true);
              setError(true);
            }}
          />
        )}
        {loaded && url && !error && (
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.25)", borderRadius: 4 }}
          >
            <Eye className="w-3 h-3 text-white" />
          </div>
        )}
      </button>
    );
  }

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center"
      style={{
        width: 40,
        height: 40,
        borderRadius: 4,
        border: `1px solid ${GD.border}`,
        background: GD.bg,
      }}
    >
      <File className="w-4 h-4" style={{ color: GD.textSecondary }} />
    </div>
  );
}

// ─── MediaPreviewModal ────────────────────────────────────────────────────────
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
        className="max-w-3xl w-full p-0 overflow-hidden"
        style={{ borderRadius: 8, border: `1px solid ${GD.border}` }}
      >
        <DialogHeader
          className="px-5 pt-4 pb-3"
          style={{ borderBottom: `1px solid ${GD.border}` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle
                className="text-base font-medium leading-tight"
                style={{ color: GD.textPrimary }}
              >
                {entry.fileName}
              </DialogTitle>
              <p className="text-xs mt-0.5" style={{ color: GD.textSecondary }}>
                Uploaded by{" "}
                <span style={{ color: GD.blue }}>{entry.uploaderName}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors gd-btn-hover"
              style={{ background: "transparent" }}
              aria-label="Close preview"
            >
              <X className="w-4 h-4" style={{ color: GD.textSecondary }} />
            </button>
          </div>
        </DialogHeader>
        <div
          className="flex items-center justify-center p-4"
          style={{ minHeight: 320, background: "#f1f3f4" }}
        >
          {!url ? (
            <Skeleton className="w-full h-64 rounded" />
          ) : isImage(entry.fileName) ? (
            <img
              src={url}
              alt={entry.fileName}
              className="max-w-full max-h-[65vh] object-contain rounded"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
            />
          ) : isVideo(entry.fileName) ? (
            <video
              src={url}
              controls
              autoPlay
              className="max-w-full max-h-[65vh] rounded"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
            >
              <track kind="captions" />
            </video>
          ) : (
            <div className="text-center py-12">
              <File
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: GD.textSecondary }}
              />
              <p className="text-sm" style={{ color: GD.textSecondary }}>
                Preview not available.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all"
      style={{
        borderRadius: 20,
        border: active ? `1px solid ${GD.blue}` : `1px solid ${GD.border}`,
        background: active ? GD.blueBg : GD.white,
        color: active ? GD.blue : GD.textSecondary,
        cursor: "pointer",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
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
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploads, setUploads] = useState<UploadEntry[] | null>(null);
  const [stats, setStats] = useState<[bigint, bigint] | null>(null);
  const [uploadsLoading, setUploadsLoading] = useState(false);
  const [autoRefreshActive, setAutoRefreshActive] = useState(false);

  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);

  const { actor } = useActor();
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  const totalUploads = stats ? Number(stats[0]) : 0;
  const uniqueUploaders = stats ? Number(stats[1]) : 0;

  const allSelected =
    uploads !== null &&
    uploads.length > 0 &&
    selectedIds.size === uploads.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  // Filter uploads by search + file type
  const filteredUploads = uploads
    ? uploads.filter((u) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          u.fileName.toLowerCase().includes(q) ||
          u.uploaderName.toLowerCase().includes(q);
        const matchesType =
          fileTypeFilter === "all" ||
          (fileTypeFilter === "images" && isImage(u.fileName));
        return matchesSearch && matchesType;
      })
    : null;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(uploads?.map((u) => u.blobId) ?? []));
    }
  };

  const toggleSelect = (blobId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(blobId)) next.delete(blobId);
      else next.add(blobId);
      return next;
    });
  };

  const fetchAdminData = useCallback(
    async (token: string, silent = false) => {
      if (!actor) return;
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      if (!silent) setUploadsLoading(true);
      try {
        const [fetchedUploads, fetchedStats] = await Promise.all([
          actor.getAllUploads(token),
          actor.getStats(token),
        ]);
        setUploads(fetchedUploads);
        setStats(fetchedStats);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Unauthorized")) {
          setIsLoggedIn(false);
          setSessionToken(null);
          setUploads(null);
          setStats(null);
          localStorage.removeItem(LS_TOKEN_KEY);
          toast.error("Session expired. Please log in again.");
        } else if (!silent) {
          toast.error("Failed to load uploads. Please refresh.");
        }
      } finally {
        isFetchingRef.current = false;
        if (!silent) setUploadsLoading(false);
      }
    },
    [actor],
  );

  useEffect(() => {
    if (isLoggedIn && actor !== null && sessionToken) {
      fetchAdminData(sessionToken);
    }
  }, [isLoggedIn, actor, sessionToken, fetchAdminData]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!isLoggedIn || !sessionToken || !actor) {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
        setAutoRefreshActive(false);
      }
      return;
    }
    setAutoRefreshActive(true);
    autoRefreshRef.current = setInterval(() => {
      fetchAdminData(sessionToken, true);
    }, AUTO_REFRESH_MS);
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
        setAutoRefreshActive(false);
      }
    };
  }, [isLoggedIn, sessionToken, actor, fetchAdminData]);

  const resetSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    sessionTimerRef.current = setTimeout(() => {
      setIsLoggedIn(false);
      setSessionToken(null);
      setEmail("");
      setPassword("");
      setUploads(null);
      setStats(null);
      localStorage.removeItem(LS_TOKEN_KEY);
      toast.error("Session expired. Please log in again.");
    }, SESSION_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(LS_TOKEN_KEY);
    if (saved) {
      setSessionToken(saved);
      setIsLoggedIn(true);
      resetSessionTimer();
    }
  }, [resetSessionTimer]);

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
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.blob();
      const objectUrl = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      toast.success(`Downloaded ${fileName}`);
    } catch {
      toast.error("Download failed. Please try again.");
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
        setSelectedIds((prev) => {
          const n = new Set(prev);
          n.delete(blobId);
          return n;
        });
        await fetchAdminData(sessionToken);
        toast.success("File deleted.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Unauthorized")) {
        setIsLoggedIn(false);
        setSessionToken(null);
        localStorage.removeItem(LS_TOKEN_KEY);
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Failed to delete file. Please try again.");
      }
    } finally {
      setDeletingIds((prev) => {
        const n = new Set(prev);
        n.delete(blobId);
        return n;
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (!sessionToken || !actor || selectedIds.size === 0) return;
    const count = selectedIds.size;
    setIsDeletingSelected(true);
    try {
      await actor.deleteSelectedUploads(Array.from(selectedIds), sessionToken);
      setSelectedIds(new Set());
      await fetchAdminData(sessionToken);
      toast.success(`${count} file(s) deleted.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Unauthorized")) {
        setIsLoggedIn(false);
        setSessionToken(null);
        localStorage.removeItem(LS_TOKEN_KEY);
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Failed to delete selected files.");
      }
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!sessionToken || !actor) return;
    setIsDeletingAll(true);
    try {
      await actor.deleteAllUploads(sessionToken);
      setSelectedIds(new Set());
      await fetchAdminData(sessionToken);
      toast.success("All files deleted.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Unauthorized")) {
        setIsLoggedIn(false);
        setSessionToken(null);
        localStorage.removeItem(LS_TOKEN_KEY);
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Failed to delete all files.");
      }
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil) return;

    setIsLoginLoading(true);
    setLoginError("");

    // If actor isn't ready yet, poll up to 10 seconds for it to become available
    let resolvedActor = actorRef.current;
    if (!resolvedActor) {
      const POLL_INTERVAL = 300;
      const MAX_WAIT = 10_000;
      let elapsed = 0;
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          elapsed += POLL_INTERVAL;
          if (actorRef.current) {
            resolvedActor = actorRef.current;
            clearInterval(interval);
            resolve();
          } else if (elapsed >= MAX_WAIT) {
            clearInterval(interval);
            resolve();
          }
        }, POLL_INTERVAL);
      });
    }

    if (!resolvedActor) {
      setLoginError(
        "Connection failed. Please refresh the page and try again.",
      );
      setIsLoginLoading(false);
      return;
    }

    try {
      const token = await resolvedActor.adminLogin(password);
      if (token !== null) {
        setSessionToken(token);
        setIsLoggedIn(true);
        setLoginError("");
        setFailedAttempts(0);
        resetSessionTimer();
        localStorage.setItem(LS_TOKEN_KEY, token as string);
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
    setSelectedIds(new Set());
    localStorage.removeItem(LS_TOKEN_KEY);
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
  };

  void lockoutSecondsLeft;

  // ─── Login Page — Luxury Dark Cinema Theme ────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: LX.bgGradient }}
      >
        {/* Decorative orbs */}
        <div
          className="fixed top-0 right-0 w-96 h-96 pointer-events-none z-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at top right, oklch(0.63 0.14 29 / 0.4), transparent 70%)",
          }}
        />
        <div
          className="fixed bottom-0 left-0 w-64 h-64 pointer-events-none z-0 opacity-15"
          style={{
            background:
              "radial-gradient(ellipse at bottom left, oklch(0.76 0.09 65 / 0.3), transparent 70%)",
          }}
        />

        {/* Top bar */}
        <header
          className="relative z-10 flex items-center px-6 py-4"
          style={{
            background: LX.headerBg,
            borderBottom: `1px solid ${LX.headerBorder}`,
          }}
        >
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-sm font-medium transition-colors lx-btn-hover"
            style={{ color: LX.textMuted }}
            data-ocid="admin.back.link"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div
            className="mx-4 w-px h-4"
            style={{ background: LX.headerBorder }}
          />
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.63 0.14 29), oklch(0.72 0.11 30))",
              }}
            >
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span
              className="font-display font-bold text-sm"
              style={{ color: LX.text }}
            >
              Kaushal Farewell
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: LX.coralBg, color: LX.coral }}
            >
              Admin
            </span>
          </div>
        </header>

        <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm"
          >
            {/* Luxury sign-in card */}
            <div
              className="p-8"
              style={{
                background: LX.card,
                border: `1px solid ${LX.cardBorder}`,
                borderRadius: 16,
                boxShadow:
                  "0 24px 64px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.2)",
              }}
            >
              {/* Logo / branding */}
              <div className="text-center mb-8">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.63 0.14 29), oklch(0.72 0.11 30))",
                    boxShadow: "0 8px 24px oklch(0.63 0.14 29 / 0.35)",
                  }}
                >
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2
                  className="font-display font-bold text-2xl mb-1"
                  style={{ color: LX.text }}
                >
                  Admin Access
                </h2>
                <p className="text-sm" style={{ color: LX.textMuted }}>
                  Sign in to manage uploads
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="admin-email"
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: LX.textMuted }}
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
                    className="h-11 text-sm border-0 focus-visible:ring-1"
                    style={{
                      background: "oklch(0.28 0.04 35)",
                      color: LX.text,
                      borderRadius: 8,
                      outline: "1px solid oklch(0.35 0.05 35)",
                    }}
                    data-ocid="admin.email.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="admin-password"
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: LX.textMuted }}
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
                    className="h-11 text-sm border-0 focus-visible:ring-1"
                    style={{
                      background: "oklch(0.28 0.04 35)",
                      color: LX.text,
                      borderRadius: 8,
                      outline: "1px solid oklch(0.35 0.05 35)",
                    }}
                    data-ocid="admin.password.input"
                  />
                </div>

                <AnimatePresence>
                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                      style={{
                        background: LX.errorBg,
                        color: LX.error,
                        border: "1px solid oklch(0.45 0.12 25 / 0.5)",
                        borderRadius: 8,
                      }}
                      data-ocid="admin.login.error_state"
                    >
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      {loginError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={!!lockoutUntil || isLoginLoading}
                  className="w-full h-12 text-sm font-bold text-white mt-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background:
                      isLoginLoading || lockoutUntil
                        ? "oklch(0.35 0.04 35)"
                        : "linear-gradient(135deg, oklch(0.63 0.14 29), oklch(0.7 0.12 30))",
                    borderRadius: 10,
                    border: "none",
                    boxShadow:
                      !isLoginLoading && !lockoutUntil
                        ? "0 4px 16px oklch(0.63 0.14 29 / 0.35)"
                        : "none",
                  }}
                  data-ocid="admin.login.submit_button"
                >
                  {isLoginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {actor ? "Signing in…" : "Connecting…"}
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Subtle hint */}
            <p
              className="text-center text-xs mt-4"
              style={{ color: LX.textDim }}
            >
              Authorised personnel only
            </p>
          </motion.div>
        </main>

        {/* Footer */}
        <footer
          className="relative z-10 py-5 px-6 text-center text-xs"
          style={{
            borderTop: `1px solid ${LX.headerBorder}`,
            color: LX.textDim,
          }}
        >
          <span>
            Created by{" "}
            <span className="font-semibold" style={{ color: LX.textMuted }}>
              Kuashal vidhyabhavan
            </span>
          </span>
          <span className="mx-2 opacity-40">·</span>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline transition-colors"
            style={{ color: LX.coral }}
          >
            © {new Date().getFullYear()}. Built with caffeine.ai
          </a>
        </footer>
      </div>
    );
  }

  // ─── Admin Dashboard — Google Drive Inner Theme ───────────────────────────
  const imageCount = uploads
    ? uploads.filter((u) => isImage(u.fileName)).length
    : 0;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: LX.bgGradient }}
    >
      {/* Outer luxury header — matches main site feel */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 h-14"
        style={{
          background: LX.headerBg,
          borderBottom: `1px solid ${LX.headerBorder}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors lx-btn-hover"
            style={{ color: LX.textMuted }}
            data-ocid="admin.back.link"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>
          <div className="w-px h-5" style={{ background: LX.headerBorder }} />
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4" style={{ color: LX.coral }} />
            <span
              className="font-display font-bold text-sm"
              style={{ color: LX.text }}
            >
              Kaushal Farewell
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: LX.coralBg, color: LX.coral }}
            >
              Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {autoRefreshActive && (
            <span
              className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
              style={{
                background: "oklch(0.2 0.06 155 / 0.4)",
                color: "oklch(0.7 0.14 155)",
                border: "1px solid oklch(0.3 0.1 155 / 0.4)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "oklch(0.65 0.18 155)" }}
              />
              Live
            </span>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors lx-btn-hover"
            style={{ color: LX.textMuted }}
            data-ocid="admin.signout.button"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* Main content — Drive-style white panel inside the dark luxury shell */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-5"
        >
          {/* Stats Row — white cards on dark background */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                icon: <Upload className="w-5 h-5" style={{ color: GD.blue }} />,
                value: totalUploads,
                label: "Total Files",
                bg: GD.blueBg,
                ocid: "admin.total.card",
              },
              {
                icon: (
                  <Users className="w-5 h-5" style={{ color: "#7b1fa2" }} />
                ),
                value: uniqueUploaders,
                label: "Contributors",
                bg: "#f3e5f5",
                ocid: "admin.contributors.card",
              },
              {
                icon: (
                  <FileImage className="w-5 h-5" style={{ color: GD.blue }} />
                ),
                value: imageCount,
                label: "Images",
                bg: GD.blueBg,
                ocid: "admin.images.card",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 flex items-center gap-3"
                style={{
                  background: GD.white,
                  border: `1px solid ${GD.border}`,
                  borderRadius: 8,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
                data-ocid={stat.ocid}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: stat.bg }}
                >
                  {stat.icon}
                </div>
                <div>
                  <p
                    className="text-xl font-semibold"
                    style={{ color: GD.textPrimary }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs" style={{ color: GD.textSecondary }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Files Panel — pure Google Drive white */}
          <div
            style={{
              background: GD.white,
              border: `1px solid ${GD.border}`,
              borderRadius: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
          >
            {/* Toolbar row 1 — title + bulk actions */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              style={{ borderBottom: `1px solid ${GD.border}` }}
            >
              <div className="flex items-center gap-2">
                <h3
                  className="font-medium text-base"
                  style={{ color: GD.textPrimary }}
                >
                  All Uploads
                </h3>
                {uploads && (
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      background: GD.bg,
                      color: GD.textSecondary,
                      border: `1px solid ${GD.border}`,
                    }}
                  >
                    {searchQuery || fileTypeFilter !== "all"
                      ? `${filteredUploads?.length ?? 0} / ${uploads.length}`
                      : uploads.length}
                  </Badge>
                )}
                {selectedIds.size > 0 && (
                  <Badge
                    className="text-xs text-white"
                    style={{ background: GD.blue }}
                  >
                    {selectedIds.size} selected
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => sessionToken && fetchAdminData(sessionToken)}
                  className="gap-1.5 text-xs h-8"
                  style={{ color: GD.textSecondary, borderRadius: 4 }}
                  data-ocid="admin.refresh.button"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </Button>

                {/* Delete Selected */}
                {selectedIds.size > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        disabled={isDeletingSelected}
                        className="gap-1.5 text-xs h-8 text-white"
                        style={{
                          background: GD.red,
                          borderRadius: 4,
                          border: "none",
                        }}
                        data-ocid="admin.delete_selected.button"
                      >
                        {isDeletingSelected ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Delete Selected ({selectedIds.size})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete {selectedIds.size} selected file(s)?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the selected{" "}
                          {selectedIds.size} file(s) and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-ocid="admin.delete_selected.cancel_button">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteSelected}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          data-ocid="admin.delete_selected.confirm_button"
                        >
                          Delete {selectedIds.size} File(s)
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {/* Delete All */}
                {uploads && uploads.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isDeletingAll}
                        className="gap-1.5 text-xs h-8"
                        style={{
                          color: GD.red,
                          borderColor: "#f5c6c4",
                          borderRadius: 4,
                        }}
                        data-ocid="admin.delete_all.button"
                      >
                        {isDeletingAll ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Delete All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete ALL uploads?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Delete all {uploads.length} files? This cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-ocid="admin.delete_all.cancel_button">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAll}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          data-ocid="admin.delete_all.confirm_button"
                        >
                          Delete All {uploads.length} Files
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Toolbar row 2 — search + filter chips */}
            <div
              className="flex flex-wrap items-center gap-3 px-5 py-3"
              style={{
                borderBottom: `1px solid ${GD.border}`,
                background: GD.bg,
              }}
            >
              {/* Search */}
              <div className="relative flex-1 min-w-48 max-w-xs">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: GD.textSecondary }}
                />
                <input
                  type="text"
                  placeholder="Search files or uploaders…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-sm outline-none"
                  style={{
                    borderRadius: 20,
                    border: `1px solid ${GD.border}`,
                    background: GD.white,
                    color: GD.textPrimary,
                  }}
                  data-ocid="admin.search.input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    aria-label="Clear search"
                  >
                    <XCircle
                      className="w-3.5 h-3.5"
                      style={{ color: GD.textSecondary }}
                    />
                  </button>
                )}
              </div>

              {/* Filter chips */}
              <div className="flex items-center gap-2">
                <FilterChip
                  label="All"
                  active={fileTypeFilter === "all"}
                  onClick={() => setFileTypeFilter("all")}
                  icon={<File className="w-3.5 h-3.5" />}
                />
                <FilterChip
                  label="Images"
                  active={fileTypeFilter === "images"}
                  onClick={() => setFileTypeFilter("images")}
                  icon={<FileImage className="w-3.5 h-3.5" />}
                />
              </div>
            </div>

            {/* Files list */}
            {uploadsLoading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-10 w-14 rounded" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : !uploads || uploads.length === 0 ? (
              <div
                className="py-16 text-center"
                data-ocid="admin.uploads.empty_state"
              >
                <Upload
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: GD.border }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: GD.textPrimary }}
                >
                  No uploads yet
                </p>
                <p className="text-xs mt-1" style={{ color: GD.textSecondary }}>
                  Share the upload link with guests to start collecting
                  memories.
                </p>
              </div>
            ) : filteredUploads && filteredUploads.length === 0 ? (
              <div
                className="py-16 text-center"
                data-ocid="admin.search.empty_state"
              >
                <Search
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: GD.border }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: GD.textPrimary }}
                >
                  No results found
                </p>
                <p className="text-xs mt-1" style={{ color: GD.textSecondary }}>
                  Try a different search term or filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Table header */}
                <div
                  className="flex items-center gap-3 px-4 py-2 text-xs font-medium"
                  style={{
                    color: GD.textSecondary,
                    borderBottom: `1px solid ${GD.border}`,
                    background: GD.bg,
                  }}
                >
                  <div className="w-8 flex-shrink-0">
                    <Checkbox
                      checked={allSelected}
                      ref={(el) => {
                        if (el)
                          (el as HTMLButtonElement).dataset.state = someSelected
                            ? "indeterminate"
                            : allSelected
                              ? "checked"
                              : "unchecked";
                      }}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                      data-ocid="admin.select_all.checkbox"
                    />
                  </div>
                  <div className="w-16 flex-shrink-0">Preview</div>
                  <div className="flex-1 min-w-0">File Name</div>
                  <div className="w-32 flex-shrink-0 hidden sm:block">
                    Uploader
                  </div>
                  <div className="w-24 flex-shrink-0 hidden md:block">Type</div>
                  <div className="w-36 flex-shrink-0 hidden lg:block">Date</div>
                  <div className="w-28 flex-shrink-0 text-right">Actions</div>
                </div>

                {/* Rows */}
                <AnimatePresence>
                  {(filteredUploads ?? []).map((entry, idx) => (
                    <motion.div
                      key={entry.blobId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03, duration: 0.2 }}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors cursor-default group"
                      style={{
                        borderBottom: `1px solid ${GD.border}`,
                        background: selectedIds.has(entry.blobId)
                          ? GD.selectedRow
                          : undefined,
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedIds.has(entry.blobId))
                          (e.currentTarget as HTMLDivElement).style.background =
                            GD.rowHover;
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedIds.has(entry.blobId))
                          (e.currentTarget as HTMLDivElement).style.background =
                            "";
                      }}
                      data-ocid={`admin.uploads.item.${idx + 1}`}
                    >
                      {/* Checkbox */}
                      <div className="w-8 flex-shrink-0">
                        <Checkbox
                          checked={selectedIds.has(entry.blobId)}
                          onCheckedChange={() => toggleSelect(entry.blobId)}
                          aria-label={`Select ${entry.fileName}`}
                          data-ocid={`admin.uploads.checkbox.${idx + 1}`}
                        />
                      </div>

                      {/* Thumbnail */}
                      <div className="w-16 flex-shrink-0">
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
                      </div>

                      {/* File name */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: GD.textPrimary }}
                          title={entry.fileName}
                        >
                          {entry.fileName}
                        </p>
                        <p
                          className="text-xs truncate sm:hidden"
                          style={{ color: GD.textSecondary }}
                        >
                          {entry.uploaderName}
                        </p>
                      </div>

                      {/* Uploader */}
                      <div className="w-32 flex-shrink-0 hidden sm:flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: GD.blue, fontSize: 10 }}
                        >
                          {entry.uploaderName.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className="text-xs truncate"
                          style={{ color: GD.textPrimary }}
                        >
                          {entry.uploaderName}
                        </span>
                      </div>

                      {/* Type chip */}
                      <div className="w-24 flex-shrink-0 hidden md:block">
                        {getFileTypeChip(entry.fileName)}
                      </div>

                      {/* Timestamp */}
                      <div
                        className="w-36 flex-shrink-0 hidden lg:block text-xs"
                        style={{ color: GD.textSecondary }}
                      >
                        {formatTimestamp(entry.timestamp)}
                      </div>

                      {/* Actions */}
                      <div className="w-28 flex-shrink-0 flex items-center justify-end gap-1">
                        {/* View */}
                        <button
                          type="button"
                          onClick={() => handleViewFile(entry.blobId)}
                          className="w-7 h-7 flex items-center justify-center rounded transition-colors gd-btn-hover"
                          style={{ color: GD.textSecondary }}
                          title="Open in new tab"
                          data-ocid={`admin.uploads.view_button.${idx + 1}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Download */}
                        <button
                          type="button"
                          onClick={() =>
                            handleDownload(entry.blobId, entry.fileName)
                          }
                          disabled={downloadingIds.has(entry.blobId)}
                          className="w-7 h-7 flex items-center justify-center rounded transition-colors disabled:opacity-30 gd-btn-blue-hover"
                          style={{ color: GD.blue }}
                          title="Download"
                          data-ocid={`admin.uploads.download_button.${idx + 1}`}
                        >
                          {downloadingIds.has(entry.blobId) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>

                        {/* Delete */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              disabled={deletingIds.has(entry.blobId)}
                              className="w-7 h-7 flex items-center justify-center rounded transition-colors disabled:opacity-30 gd-btn-red-hover"
                              style={{ color: GD.red }}
                              title="Delete"
                              data-ocid={`admin.uploads.delete_button.${idx + 1}`}
                            >
                              {deletingIds.has(entry.blobId) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete this upload?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove the file and cannot
                                be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                data-ocid={`admin.uploads.delete_cancel.${idx + 1}`}
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(entry.blobId)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-ocid={`admin.uploads.delete_confirm.${idx + 1}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer — luxury theme */}
      <footer
        className="py-4 px-6 text-center text-xs mt-auto"
        style={{
          color: LX.textDim,
          borderTop: `1px solid ${LX.headerBorder}`,
          background: LX.headerBg,
        }}
      >
        <span>
          Created by{" "}
          <span className="font-semibold" style={{ color: LX.textMuted }}>
            Kuashal vidhyabhavan
          </span>
        </span>
        <span className="mx-2 opacity-40">·</span>
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline transition-colors"
          style={{ color: LX.coral }}
        >
          © {new Date().getFullYear()}. Built with caffeine.ai
        </a>
      </footer>

      {/* Lightbox modal */}
      <MediaPreviewModal
        entry={previewEntry}
        onClose={() => setPreviewEntry(null)}
      />
    </div>
  );
}
