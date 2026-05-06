"use client";
import { useState, useRef, useCallback } from "react";

interface FileItem {
  file: File;
  id: string;
  title: string;
  progress: number;
  status: "pending" | "uploading" | "done";
}

export function LoginCard({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="mt-16 bg-dark-card border border-glass-border rounded-2xl p-14 text-center max-w-[440px] w-[90%] relative overflow-hidden">
      <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(255,70,85,0.06),transparent_60%)] pointer-events-none" />
      <span className="text-5xl block mb-5 relative">🔒</span>
      <h1 className="font-heading text-2xl font-extrabold tracking-[0.1em] mb-3 relative">AUTHENTICATE</h1>
      <p className="text-gray-500 text-sm leading-relaxed mb-8 relative">
        Sign in with Google to upload to the Team Agent vault. Only whitelisted squad members can upload.
      </p>
      <button className="btn-val-primary w-full justify-center py-3.5 text-xs relative" onClick={onLogin}>
        SIGN IN WITH GOOGLE
      </button>
      <p className="mt-5 font-mono text-[0.7rem] text-gray-600 flex items-center justify-center gap-1.5 relative">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#F59E0B]" />
        Google Drive API integration required
      </p>
    </div>
  );
}

export function DropZone({ onFiles }: { onFiles: (files: FileList) => void }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-[700px] w-[90%] mb-10">
      <div
        className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer bg-dark-card relative overflow-hidden transition-all duration-300 ${
          dragActive
            ? "border-val-red bg-val-red/[0.04] shadow-[0_0_40px_rgba(255,70,85,0.1)] scale-[1.01]"
            : "border-val-red/25 hover:border-val-red hover:bg-val-red/[0.04] hover:shadow-[0_0_40px_rgba(255,70,85,0.1)]"
        }`}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" multiple accept="video/*,image/*" className="hidden" onChange={(e) => e.target.files && onFiles(e.target.files)} />
        <span className="text-5xl block mb-4 animate-float">⬆</span>
        <h3 className="font-heading text-lg font-bold tracking-wider mb-2">
          {dragActive ? "DROP FILES HERE" : "DRAG & DROP FILES"}
        </h3>
        <p className="text-gray-600 text-sm mb-5">or click to browse — MP4, WEBM, MOV, JPG, PNG, WEBP</p>
        <div className="flex gap-2.5 justify-center flex-wrap">
          {["🎬 Videos", "📸 Photos", "☁️ 3TB+ Storage"].map((b) => (
            <span key={b} className="px-3.5 py-1 bg-val-red/[0.08] border border-val-red/15 rounded-full font-mono text-[0.7rem] text-gray-500">{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FileQueue({ files, onUpdate, onRemove, onUploadAll }: {
  files: FileItem[];
  onUpdate: (id: string, updates: Partial<FileItem>) => void;
  onRemove: (id: string) => void;
  onUploadAll: () => void;
}) {
  const getIcon = (type: string) => type.startsWith("video/") ? "🎬" : type.startsWith("image/") ? "📸" : "📁";
  const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="max-w-[700px] w-[90%] pb-20">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-base font-bold tracking-wider">Upload Queue ({files.length})</h2>
        <button className="btn-val-primary text-[0.7rem] px-5 py-2" onClick={onUploadAll}>⬆ UPLOAD ALL</button>
      </div>
      <div className="flex flex-col gap-2.5">
        {files.map((item) => (
          <div key={item.id} className="flex items-center gap-3.5 px-4 py-3.5 bg-dark-card border border-glass-border rounded-lg hover:border-val-red/30 transition-all duration-300">
            <span className="text-xl flex-shrink-0">{getIcon(item.file.type)}</span>
            <div className="flex-1 flex flex-col gap-0.5 min-w-0">
              <input
                className="bg-transparent border-none outline-none text-val-cream font-body text-sm font-medium w-full"
                value={item.title}
                onChange={(e) => onUpdate(item.id, { title: e.target.value })}
                placeholder="Title..."
              />
              <span className="font-mono text-[0.68rem] text-gray-600">{formatSize(item.file.size)}</span>
            </div>
            <div className="min-w-[120px] text-right">
              {item.status === "uploading" && (
                <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-val-red to-val-teal rounded-full transition-[width] duration-300" style={{ width: `${item.progress}%` }} />
                </div>
              )}
              {item.status === "done" && <span className="font-mono text-[0.7rem] text-val-teal tracking-wider">✓ UPLOADED</span>}
              {item.status === "pending" && <span className="font-mono text-[0.7rem] text-gray-600 tracking-wider">READY</span>}
            </div>
            <button className="bg-none border-none text-gray-600 cursor-pointer text-sm p-1 hover:text-val-red transition-colors duration-300 flex-shrink-0" onClick={() => onRemove(item.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
