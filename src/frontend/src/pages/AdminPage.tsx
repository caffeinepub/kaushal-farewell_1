import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  File,
  FileImage,
  FileVideo,
  Heart,
  Lock,
  LogIn,
  LogOut,
  RefreshCw,
  Shield,
  Upload,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { ExternalBlob } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAllUploads,
  useGetStats,
  useIsCallerAdmin,
} from "../hooks/useQueries";

interface AdminPageProps {
  onNavigateHome: () => void;
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
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "heic", "avif"];
  const videoExts = ["mp4", "mov", "avi", "mkv", "webm", "m4v"];
  if (imageExts.includes(ext))
    return <FileImage className="w-4 h-4 text-coral" />;
  if (videoExts.includes(ext))
    return <FileVideo className="w-4 h-4 text-coral" />;
  return (
    <File
      className="w-4 h-4"
      style={{ color: "oklch(var(--muted-foreground))" }}
    />
  );
}

function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error("Login error:", error);
        if (error?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={isLoggingIn}
      className="rounded-full font-semibold px-6 text-white"
      style={{
        background: isAuthenticated
          ? "oklch(0.55 0.06 40)"
          : "linear-gradient(135deg, oklch(0.63 0.14 29), oklch(0.72 0.11 28))",
      }}
      data-ocid="admin.auth.button"
    >
      {isLoggingIn ? (
        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
      ) : isAuthenticated ? (
        <LogOut className="w-4 h-4 mr-2" />
      ) : (
        <LogIn className="w-4 h-4 mr-2" />
      )}
      {isLoggingIn ? "Signing in…" : isAuthenticated ? "Sign Out" : "Sign In"}
    </Button>
  );
}

export default function AdminPage({ onNavigateHome }: AdminPageProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const {
    data: uploads,
    isLoading: uploadsLoading,
    refetch,
  } = useGetAllUploads();
  const { data: stats } = useGetStats();

  const totalUploads = stats ? Number(stats[0]) : 0;
  const uniqueUploaders = stats ? Number(stats[1]) : 0;

  const handleViewFile = (blobId: string) => {
    const blob = ExternalBlob.fromURL(blobId);
    window.open(blob.getDirectURL(), "_blank");
  };

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
            <LoginButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {!isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
            data-ocid="admin.login.panel"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: "oklch(1 0 0 / 0.7)" }}
            >
              <Lock
                className="w-8 h-8"
                style={{ color: "oklch(var(--coral-primary))" }}
              />
            </div>
            <h2
              className="font-display font-bold text-3xl mb-3"
              style={{ color: "oklch(var(--hero-brown))" }}
            >
              Admin Access Required
            </h2>
            <p
              className="text-sm max-w-sm mb-8"
              style={{ color: "oklch(0.45 0.06 40)" }}
            >
              Sign in with Internet Identity to access the admin panel and view
              all uploaded memories.
            </p>
            <LoginButton />
          </motion.div>
        ) : adminLoading ? (
          <div
            className="py-16 flex flex-col items-center gap-4"
            data-ocid="admin.loading_state"
          >
            <RefreshCw
              className="w-8 h-8 animate-spin"
              style={{ color: "oklch(var(--coral-primary))" }}
            />
            <p className="text-sm" style={{ color: "oklch(0.45 0.06 40)" }}>
              Checking permissions…
            </p>
          </div>
        ) : !isAdmin ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
            data-ocid="admin.access_denied.panel"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: "oklch(0.95 0.04 25)" }}
            >
              <Shield
                className="w-8 h-8"
                style={{ color: "oklch(0.55 0.15 25)" }}
              />
            </div>
            <h2
              className="font-display font-bold text-3xl mb-3"
              style={{ color: "oklch(var(--hero-brown))" }}
            >
              Access Denied
            </h2>
            <p
              className="text-sm max-w-sm"
              style={{ color: "oklch(0.45 0.06 40)" }}
            >
              Your account does not have admin privileges. Please contact the
              site administrator.
            </p>
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
                  onClick={() => refetch()}
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
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-16" />
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
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: "oklch(var(--hero-brown))" }}
                        >
                          #
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
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: "oklch(var(--hero-brown))" }}
                        >
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploads.map((entry, idx) => (
                        <TableRow
                          key={entry.blobId}
                          className="border-border/30 hover:bg-accent/30 transition-colors"
                          data-ocid={`admin.uploads.row.${idx + 1}`}
                        >
                          <TableCell
                            className="text-xs"
                            style={{ color: "oklch(var(--muted-foreground))" }}
                          >
                            {idx + 1}
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
                                className="text-sm max-w-[200px] truncate block"
                                style={{ color: "oklch(var(--foreground))" }}
                                title={entry.fileName}
                              >
                                {entry.fileName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell
                            className="text-xs"
                            style={{ color: "oklch(var(--muted-foreground))" }}
                          >
                            {formatTimestamp(entry.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewFile(entry.blobId)}
                              className="text-xs h-7 rounded-full border-border/60 hover:border-coral/50"
                              data-ocid={`admin.uploads.view_button.${idx + 1}`}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
        <div className="max-w-6xl mx-auto text-center">
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
    </div>
  );
}
