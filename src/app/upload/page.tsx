"use client";
import { useState, useCallback } from "react";
import Navbar from "@/components/ui/Navbar";
import { LoginCard, DropZone, FileQueue } from "@/components/upload/UploadComponents";

interface FileItem {
  file: File;
  id: string;
  title: string;
  progress: number;
  status: "pending" | "uploading" | "done";
}

export default function UploadPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: FileItem[] = Array.from(fileList).map((file) => ({
      file,
      id: crypto.randomUUID(),
      title: file.name.replace(/\.[^/.]+$/, ""),
      progress: 0,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const updateFile = (id: string, updates: Partial<FileItem>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const uploadAll = () => {
    files.forEach((f) => {
      if (f.status !== "pending") return;
      updateFile(f.id, { status: "uploading" });
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          clearInterval(interval);
          updateFile(f.id, { progress: 100, status: "done" });
        } else {
          updateFile(f.id, { progress });
        }
      }, 400);
    });
  };

  if (!isLoggedIn) {
    return (
      <>
        <Navbar />
        <main className="pt-24 min-h-screen flex flex-col items-center">
          <LoginCard onLogin={() => setIsLoggedIn(true)} />
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
        </section>
        <DropZone onFiles={handleFiles} />
        {files.length > 0 && (
          <FileQueue files={files} onUpdate={updateFile} onRemove={removeFile} onUploadAll={uploadAll} />
        )}
      </main>
    </>
  );
}
