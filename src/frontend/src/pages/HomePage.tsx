import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  CloudUpload,
  Download,
  Film,
  Heart,
  ImageIcon,
  Info,
  Loader2,
  QrCode,
  Star,
  Upload,
  Video,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { QRCodeCanvas } from "qrcode.react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useUploadMemory } from "../hooks/useQueries";

interface FileItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

interface HomePageProps {
  onNavigateAdmin: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(file: File) {
  if (file.type.startsWith("image/"))
    return <ImageIcon className="w-4 h-4 text-coral" />;
  if (file.type.startsWith("video/"))
    return <Video className="w-4 h-4 text-coral" />;
  return <Upload className="w-4 h-4 text-coral" />;
}

export default function HomePage({ onNavigateAdmin }: HomePageProps) {
  const [activeSection, setActiveSection] = useState<string>("upload");
  const [uploaderName, setUploaderName] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrCanvasRef = useRef<HTMLDivElement>(null);
  const uploadMutation = useUploadMemory();

  const addFiles = useCallback((newFiles: File[]) => {
    const items: FileItem[] = newFiles.map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
      file: f,
      progress: 0,
      status: "pending",
    }));
    setFiles((prev) => {
      const existingNames = new Set(prev.map((p) => p.file.name));
      return [
        ...prev,
        ...items.filter((item) => !existingNames.has(item.file.name)),
      ];
    });
    setUploadSuccess(false);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      const valid = dropped.filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
      );
      if (valid.length !== dropped.length) {
        toast.error("Only images and videos are supported");
      }
      if (valid.length > 0) addFiles(valid);
    },
    [addFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length > 0) addFiles(selected);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [addFiles],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploaderName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (files.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    setIsUploading(true);
    let allSuccess = true;

    for (const fileItem of files) {
      if (fileItem.status === "done") continue;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: "uploading", progress: 0 } : f,
        ),
      );

      try {
        await uploadMutation.mutateAsync({
          uploaderName: uploaderName.trim(),
          file: fileItem.file,
          fileName: fileItem.file.name,
          onProgress: (pct) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileItem.id ? { ...f, progress: pct } : f,
              ),
            );
          },
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: "done", progress: 100 } : f,
          ),
        );
      } catch (err) {
        allSuccess = false;
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: "error", error: errorMsg }
              : f,
          ),
        );
        toast.error(`Failed to upload ${fileItem.file.name}`);
      }
    }

    setIsUploading(false);
    if (allSuccess) {
      setUploadSuccess(true);
      toast.success("All memories uploaded successfully!");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setUploaderName("");
    setMessage("");
    setUploadSuccess(false);
  };

  const handleDownloadQR = () => {
    const canvas = qrCanvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "kaushal-farewell-qr.png";
    a.click();
  };

  const overallProgress =
    files.length === 0
      ? 0
      : Math.round(
          files.reduce((sum, f) => sum + f.progress, 0) / files.length,
        );

  const allDone = files.length > 0 && files.every((f) => f.status === "done");

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.93 0.04 55) 0%, oklch(0.88 0.07 35) 50%, oklch(0.82 0.1 25) 100%)",
      }}
    >
      {/* Botanical decorations */}
      <div
        className="fixed top-0 right-0 w-64 h-64 opacity-20 pointer-events-none z-0"
        style={{
          backgroundImage:
            "url('/assets/generated/botanical-accent-transparent.dim_400x400.png')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top right",
        }}
      />
      <div
        className="fixed bottom-0 left-0 w-48 h-48 opacity-15 pointer-events-none z-0"
        style={{
          backgroundImage:
            "url('/assets/generated/botanical-accent-transparent.dim_400x400.png')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom left",
          transform: "rotate(180deg)",
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-50 shadow-header"
        style={{ backgroundColor: "oklch(var(--header-bg))" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.72 0.12 28), oklch(0.63 0.14 29))",
                }}
              >
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-hero-brown text-lg tracking-tight">
                Kaushal Farewell
              </span>
            </div>

            <nav
              className="hidden md:flex items-center gap-1"
              aria-label="Main navigation"
            >
              {["Home", "Upload", "Gallery", "Stories", "FAQ"].map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setActiveSection(item.toLowerCase())}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeSection === item.toLowerCase()
                      ? "text-coral bg-coral/10"
                      : "text-foreground/70 hover:text-hero-brown hover:bg-accent"
                  }`}
                  data-ocid={`nav.${item.toLowerCase()}.link`}
                >
                  {item}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setActiveSection("upload")}
                size="sm"
                className="rounded-full text-white font-semibold px-5 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.63 0.14 29), oklch(0.72 0.11 30))",
                }}
                data-ocid="nav.share_memory.button"
              >
                <Heart className="w-3.5 h-3.5 mr-1.5" />
                Share Memory
              </Button>
              <button
                type="button"
                onClick={onNavigateAdmin}
                className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
                data-ocid="nav.admin.link"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-14 pb-8 text-center px-4"
        >
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
              style={{
                backgroundColor: "oklch(1 0 0 / 0.7)",
                color: "oklch(var(--hero-brown))",
                border: "1px solid oklch(var(--coral-light) / 0.3)",
              }}
            >
              <Star
                className="w-3.5 h-3.5"
                style={{ color: "oklch(var(--coral-primary))" }}
              />
              A special celebration
              <Star
                className="w-3.5 h-3.5"
                style={{ color: "oklch(var(--coral-primary))" }}
              />
            </motion.div>

            <h1
              className="font-display font-bold text-4xl sm:text-5xl md:text-6xl leading-tight mb-4"
              style={{ color: "oklch(var(--hero-brown))" }}
            >
              A Farewell to Remember:
              <br />
              <span
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, oklch(0.63 0.14 29), oklch(0.72 0.11 28))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Celebrate Kaushal's Journey
              </span>
            </h1>

            <p
              className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
              style={{ color: "oklch(0.45 0.06 40)" }}
            >
              Share your favourite photos and videos from Kaushal's time with
              us. Together, let's create a lasting memory.
            </p>
          </div>
        </motion.section>

        {/* Upload Form Card */}
        <section className="px-4 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div
              className="rounded-3xl shadow-card p-6 sm:p-8"
              style={{ backgroundColor: "oklch(1 0 0)" }}
            >
              {/* Card header */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.63 0.14 29), oklch(0.72 0.11 28))",
                  }}
                >
                  <CloudUpload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2
                    className="font-display font-bold text-xl"
                    style={{ color: "oklch(var(--hero-brown))" }}
                  >
                    Share Your Memory
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Upload photos and videos for Kaushal
                  </p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {uploadSuccess && allDone ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center py-10"
                    data-ocid="upload.success_state"
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: "oklch(var(--success-bg))" }}
                    >
                      <CheckCircle2
                        className="w-10 h-10"
                        style={{ color: "oklch(var(--success-text))" }}
                      />
                    </div>
                    <h3
                      className="font-display font-bold text-2xl mb-2"
                      style={{ color: "oklch(var(--hero-brown))" }}
                    >
                      Memories Uploaded!
                    </h3>
                    <p
                      className="text-sm mb-6"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Thank you, {uploaderName}! Your {files.length} file
                      {files.length !== 1 ? "s have" : " has"} been saved
                      securely.
                    </p>
                    <Button
                      onClick={handleReset}
                      className="rounded-full text-white font-semibold px-6"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.63 0.14 29), oklch(0.72 0.11 28))",
                      }}
                      data-ocid="upload.share_more.button"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Share More Memories
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Step 1: Name */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="uploader-name"
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: "oklch(var(--hero-brown))" }}
                      >
                        Step 1 — Your Name
                      </Label>
                      <Input
                        id="uploader-name"
                        placeholder="Enter your full name"
                        value={uploaderName}
                        onChange={(e) => setUploaderName(e.target.value)}
                        disabled={isUploading}
                        className="h-11 rounded-xl border-border/60 focus-visible:ring-coral/50 text-sm"
                        style={{ backgroundColor: "oklch(0.985 0.005 55)" }}
                        autoComplete="name"
                        required
                        data-ocid="upload.name.input"
                      />
                    </div>

                    {/* Step 2: Drop zone */}
                    <div className="space-y-1.5">
                      <Label
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: "oklch(var(--hero-brown))" }}
                      >
                        Step 2 — Add Photos & Videos
                      </Label>

                      <div
                        className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                          isDragging
                            ? "border-coral bg-coral/5 scale-[1.01]"
                            : "border-dropzone-border bg-dropzone-bg hover:border-coral/50 hover:bg-coral/5"
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() =>
                          !isUploading && fileInputRef.current?.click()
                        }
                        aria-label="Drop files here or click to browse"
                        onKeyDown={(e) =>
                          e.key === "Enter" && fileInputRef.current?.click()
                        }
                        data-ocid="upload.dropzone"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={handleFileInput}
                          className="hidden"
                          disabled={isUploading}
                          data-ocid="upload.upload_button"
                        />
                        <div className="p-8 text-center">
                          <div className="flex justify-center gap-3 mb-4">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center"
                              style={{ backgroundColor: "oklch(0.93 0.04 55)" }}
                            >
                              <Camera
                                className="w-5 h-5"
                                style={{ color: "oklch(var(--coral-primary))" }}
                              />
                            </div>
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center"
                              style={{ backgroundColor: "oklch(0.93 0.04 55)" }}
                            >
                              <Film
                                className="w-5 h-5"
                                style={{ color: "oklch(var(--coral-primary))" }}
                              />
                            </div>
                          </div>
                          <p
                            className="font-semibold text-sm mb-1"
                            style={{ color: "oklch(var(--hero-brown))" }}
                          >
                            {isDragging
                              ? "Drop your files here!"
                              : "Drag & drop photos/videos here"}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "oklch(var(--muted-foreground))" }}
                          >
                            or{" "}
                            <span
                              className="font-semibold underline"
                              style={{ color: "oklch(var(--coral-primary))" }}
                            >
                              browse files
                            </span>{" "}
                            — JPG, PNG, MP4, MOV and more
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* File chips */}
                    <AnimatePresence>
                      {files.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                          data-ocid="upload.file.list"
                        >
                          {/* Overall progress bar */}
                          {isUploading && (
                            <div className="mb-3">
                              <div
                                className="flex items-center justify-between text-xs font-medium mb-1.5"
                                style={{ color: "oklch(var(--hero-brown))" }}
                              >
                                <span>Uploading memories…</span>
                                <span>{overallProgress}%</span>
                              </div>
                              <Progress
                                value={overallProgress}
                                className="h-2 rounded-full"
                              />
                            </div>
                          )}

                          {files.map((fileItem, idx) => (
                            <motion.div
                              key={fileItem.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-center gap-3 p-3 rounded-xl"
                              style={{
                                backgroundColor:
                                  fileItem.status === "done"
                                    ? "oklch(var(--success-bg))"
                                    : fileItem.status === "error"
                                      ? "oklch(0.95 0.04 25)"
                                      : "oklch(0.97 0.01 55)",
                                border:
                                  fileItem.status === "done"
                                    ? "1px solid oklch(var(--success-border))"
                                    : fileItem.status === "error"
                                      ? "1px solid oklch(0.72 0.12 25)"
                                      : "1px solid oklch(var(--border))",
                              }}
                              data-ocid={`upload.file.item.${idx + 1}`}
                            >
                              <div className="flex-shrink-0">
                                {fileItem.status === "done" ? (
                                  <CheckCircle2
                                    className="w-4 h-4"
                                    style={{
                                      color: "oklch(var(--success-text))",
                                    }}
                                  />
                                ) : fileItem.status === "uploading" ? (
                                  <Loader2
                                    className="w-4 h-4 animate-spin"
                                    style={{
                                      color: "oklch(var(--coral-primary))",
                                    }}
                                  />
                                ) : fileItem.status === "error" ? (
                                  <X
                                    className="w-4 h-4"
                                    style={{ color: "oklch(0.55 0.15 25)" }}
                                  />
                                ) : (
                                  getFileIcon(fileItem.file)
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-xs font-medium truncate"
                                  style={{ color: "oklch(var(--hero-brown))" }}
                                >
                                  {fileItem.file.name}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-xs"
                                    style={{
                                      color: "oklch(var(--muted-foreground))",
                                    }}
                                  >
                                    {formatFileSize(fileItem.file.size)}
                                  </span>
                                  {fileItem.status === "uploading" && (
                                    <span
                                      className="text-xs font-medium"
                                      style={{
                                        color: "oklch(var(--coral-primary))",
                                      }}
                                    >
                                      {fileItem.progress}%
                                    </span>
                                  )}
                                  {fileItem.error && (
                                    <span
                                      className="text-xs"
                                      style={{ color: "oklch(0.55 0.15 25)" }}
                                    >
                                      {fileItem.error}
                                    </span>
                                  )}
                                </div>
                                {fileItem.status === "uploading" && (
                                  <Progress
                                    value={fileItem.progress}
                                    className="h-1 mt-1 rounded-full"
                                  />
                                )}
                              </div>

                              {!isUploading && fileItem.status !== "done" && (
                                <button
                                  type="button"
                                  onClick={() => removeFile(fileItem.id)}
                                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-border"
                                  aria-label={`Remove ${fileItem.file.name}`}
                                  data-ocid={`upload.file.delete_button.${idx + 1}`}
                                >
                                  <X
                                    className="w-3 h-3"
                                    style={{
                                      color: "oklch(var(--muted-foreground))",
                                    }}
                                  />
                                </button>
                              )}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Optional message */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="upload-message"
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: "oklch(var(--hero-brown))" }}
                      >
                        Personal Message
                        <span
                          className="ml-1 font-normal normal-case tracking-normal"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          (optional)
                        </span>
                      </Label>
                      <Textarea
                        id="upload-message"
                        placeholder="Write a heartfelt message for Kaushal…"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isUploading}
                        rows={3}
                        className="rounded-xl resize-none border-border/60 focus-visible:ring-coral/50 text-sm"
                        style={{ backgroundColor: "oklch(0.985 0.005 55)" }}
                        data-ocid="upload.message.textarea"
                      />
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={
                        isUploading ||
                        files.length === 0 ||
                        !uploaderName.trim()
                      }
                      className="w-full h-12 rounded-full text-white font-bold text-sm tracking-wide shadow-md transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.63 0.14 29) 0%, oklch(0.7 0.12 30) 100%)",
                      }}
                      data-ocid="upload.submit_button"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading Memories…
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 mr-2" />
                          Share {files.length > 0 ? `${files.length} ` : ""}
                          Memory
                          {files.length > 1 ? "ies" : ""}
                        </>
                      )}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        {/* Info Section */}
        <section className="px-4 pb-14">
          <div className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="rounded-2xl p-5"
              style={{ backgroundColor: "oklch(1 0 0 / 0.65)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Star
                  className="w-4 h-4"
                  style={{ color: "oklch(var(--coral-primary))" }}
                />
                <h3
                  className="font-display font-bold text-sm"
                  style={{ color: "oklch(var(--hero-brown))" }}
                >
                  Tips for a Great Tribute
                </h3>
              </div>
              <ul className="space-y-2">
                {[
                  "Choose clear, well-lit photos",
                  "Short clips under 2 mins work best",
                  "Include candid moments — they're priceless",
                  "Group photos with Kaushal are perfect",
                  "Add a heartfelt message to go along",
                ].map((tip) => (
                  <li
                    key={tip}
                    className="flex items-start gap-2 text-xs"
                    style={{ color: "oklch(0.45 0.06 40)" }}
                  >
                    <ChevronRight
                      className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                      style={{ color: "oklch(var(--coral-light))" }}
                    />
                    {tip}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="rounded-2xl p-5"
              style={{ backgroundColor: "oklch(1 0 0 / 0.65)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Info
                  className="w-4 h-4"
                  style={{ color: "oklch(var(--coral-primary))" }}
                />
                <h3
                  className="font-display font-bold text-sm"
                  style={{ color: "oklch(var(--hero-brown))" }}
                >
                  How It Works
                </h3>
              </div>
              <ul className="space-y-2">
                {[
                  "Enter your name so we know who sent it",
                  "Select or drag-drop photos and videos",
                  "Add an optional personal message",
                  "Hit 'Share Memory' — we'll handle the rest",
                  "Only Kaushal's team can access uploads",
                ].map((step, stepIdx) => (
                  <li
                    key={step}
                    className="flex items-start gap-2 text-xs"
                    style={{ color: "oklch(0.45 0.06 40)" }}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5 font-bold"
                      style={{
                        backgroundColor: "oklch(var(--coral-primary))",
                        fontSize: "9px",
                      }}
                    >
                      {stepIdx + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* QR Code Section */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="px-4 pb-10"
        >
          <div className="max-w-2xl mx-auto">
            <div
              className="rounded-3xl shadow-card p-6 sm:p-8"
              style={{ backgroundColor: "oklch(1 0 0)" }}
            >
              {/* Card header */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.63 0.14 29), oklch(0.72 0.11 28))",
                  }}
                >
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2
                    className="font-display font-bold text-xl"
                    style={{ color: "oklch(var(--hero-brown))" }}
                  >
                    Scan to Share
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Share this page with friends via QR code
                  </p>
                </div>
              </div>

              {/* QR code centered */}
              <div className="flex flex-col items-center gap-4">
                <div
                  ref={qrCanvasRef}
                  className="inline-block rounded-2xl p-4"
                  style={{
                    border: "2px dashed oklch(0.88 0.03 55)",
                  }}
                >
                  <QRCodeCanvas
                    value={window.location.origin}
                    size={200}
                    level="H"
                    includeMargin
                    fgColor="oklch(0.38 0.09 35)"
                    bgColor="#ffffff"
                  />
                </div>

                <p
                  className="text-xs"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Point your camera at this code to open the page
                </p>

                <Button
                  type="button"
                  onClick={handleDownloadQR}
                  className="rounded-full text-white font-semibold px-6 shadow-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.63 0.14 29), oklch(0.72 0.11 28))",
                  }}
                  data-ocid="qr.download.button"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer
        className="py-6 px-4 border-t"
        style={{
          borderColor: "oklch(1 0 0 / 0.2)",
          backgroundColor: "oklch(0.38 0.09 35 / 0.15)",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Heart
                className="w-3.5 h-3.5"
                style={{ color: "oklch(var(--coral-primary))" }}
              />
              <span
                className="text-xs"
                style={{ color: "oklch(0.45 0.06 40)" }}
              >
                Made with love for Kaushal's farewell celebration
              </span>
            </div>
            <div
              className="flex flex-col sm:flex-row items-center gap-3 text-xs"
              style={{ color: "oklch(0.55 0.05 40)" }}
            >
              <span style={{ color: "oklch(0.45 0.06 40)" }}>
                Created by{" "}
                <span
                  className="font-semibold"
                  style={{ color: "oklch(var(--hero-brown))" }}
                >
                  Dhruv Dhameliya
                </span>
              </span>
              <span
                className="hidden sm:inline"
                style={{ color: "oklch(0.7 0.04 40)" }}
              >
                ·
              </span>
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                © {new Date().getFullYear()}. Built with love using caffeine.ai
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
