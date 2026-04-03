import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  File,
  FileImage,
  FileVideo,
  Heart,
  LogOut,
  RefreshCw,
  Shield,
  Upload,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { ExternalBlob } from "../backend";
import { useGetAllUploads, useGetStats } from "../hooks/useQueries";

const ADMIN_EMAIL = "kaushalfarewell@gmail.com";
const ADMIN_PASSWORD = "Kaushal@123";

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

export default function AdminPage({ onNavigateHome }: AdminPageProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Invalid email or password.");
    }
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
    setLoginError("");
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
              {/* Shield icon */}
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
                    required
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
                  className="w-full rounded-xl font-semibold text-white mt-2"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.63 0.14 29), oklch(0.72 0.11 28))",
                  }}
                  data-ocid="admin.login.submit_button"
                >
                  Sign In
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
