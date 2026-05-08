"use client";
import { useState, useCallback } from "react";
import Navbar from "@/components/ui/Navbar";
import { LoginCard, DropZone, FileQueue, UploadSuccess } from "@/components/upload/UploadComponents";
import { uploadFiles } from "@/lib/drive";

interface FileItem {
  file: File;
  id: string;
  title: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  type: "photo" | "video";
  error?: string;
  driveId?: string;
}

export default function UploadPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const handleLogin = (pw: string) => {
    setPassword(pw);
  };

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: FileItem[] = Array.from(fileList).map((file) => ({
      file,
      id: crypto.randomUUID(),
      title: file.name.replace(/\.[^/.]+$/, ""),
      progress: 0,
      status: "pending" as const,
      type: file.type.startsWith("video/") ? "video" as const : "photo" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const updateFile = (id: string, updates: Partial<FileItem>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const uploadAll = async () => {
    if (!password) return;

    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setUploading(true);

    // Mark all pending as uploading
    pendingFiles.forEach((f) => {
      updateFile(f.id, { status: "uploading" });
    });

    try {
      const result = await uploadFiles(
        pendingFiles.map((f) => f.file),
        password
      );

      if (result.success && result.results) {
        result.results.forEach((r, i) => {
          if (i < pendingFiles.length) {
            if (r.success) {
              updateFile(pendingFiles[i].id, {
                status: "done",
                progress: 100,
                driveId: r.driveId,
              });
            } else {
              updateFile(pendingFiles[i].id, {
                status: "error",
                error: r.error || "Upload failed",
              });
            }
          }
        });

        const successCount = result.results.filter((r) => r.success).length;
        if (successCount === pendingFiles.length) {
          setCompletedCount(successCount);
          setTimeout(() => setUploadComplete(true), 1500);
        }
      } else {
        // All failed
        pendingFiles.forEach((f) => {
          updateFile(f.id, {
            status: "error",
            error: result.results?.[0]?.error || "Upload failed",
          });
        });
      }
    } catch (err) {
      pendingFiles.forEach((f) => {
        updateFile(f.id, {
          status: "error",
          error: String(err),
        });
      });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setUploadComplete(false);
    setCompletedCount(0);
  };

  if (!password) {
    return (
      <>
        <Navbar />
        <main className="pt-24 min-h-screen flex flex-col items-center">
          <LoginCard onLogin={handleLogin} />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen flex flex-col items-center">
        <section className="text-center px-5 pb-10">
          <h1 className="text-neon-red text-[clamp(2rem,5vw,3.5rem)] mb-3">UPLOAD HUB</h1>
          <p className="text-gray-500 text-base">Drop your clips and photos into the vault.</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="w-2 h-2 rounded-full bg-val-teal shadow-[0_0_8px_rgba(23,222,166,0.6)]" />
            <span className="font-mono text-[0.7rem] text-val-teal tracking-wider">CONNECTED TO GOOGLE DRIVE</span>
          </div>
        </section>

        {uploadComplete ? (
          <UploadSuccess count={completedCount} onReset={handleReset} />
        ) : (
          <>
            <DropZone onFiles={handleFiles} />
            {files.length > 0 && (
              <FileQueue
                files={files}
                onUpdate={updateFile}
                onRemove={removeFile}
                onUploadAll={uploadAll}
                uploading={uploading}
              />
            )}
          </>
        )}
      </main>
    </>
  );
}
