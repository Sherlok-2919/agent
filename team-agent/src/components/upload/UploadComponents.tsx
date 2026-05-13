"use client";
import { useState, useRef } from "react";
import { getGameById, GENERAL_GAME } from "@/data/games";
import { driveConfig } from "@/lib/drive";

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

export function LoginCard({ onLogin }: { onLogin: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Enter the squad password");
      return;
    }
    setError("");
    setChecking(true);

    try {
      const res = await fetch(driveConfig.authEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.error || "Wrong password — access denied");
        setChecking(false);
        return;
      }

      onLogin(password);
    } catch {
      setError("Connection error — try again");
      setChecking(false);
    }
  };

  return (
    <div className="mt-16 bg-dark-card border border-glass-border rounded-2xl p-14 text-center max-w-[440px] w-[90%] relative overflow-hidden">
      <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(255,70,85,0.06),transparent_60%)] pointer-events-none" />
      <span className="text-5xl block mb-5 relative">🔒</span>
      <h1 className="font-heading text-2xl font-extrabold tracking-[0.1em] mb-3 relative">AUTHENTICATE</h1>
      <p className="text-gray-500 text-sm leading-relaxed mb-6 relative">
        Enter the squad upload password to access the vault.
      </p>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Squad password..."
          disabled={checking}
          className="w-full px-5 py-3 mb-4 bg-dark-bg border border-glass-border rounded-lg text-val-cream font-body text-sm outline-none focus:border-val-red/50 focus:shadow-[0_0_20px_rgba(255,70,85,0.1)] transition-all duration-300 disabled:opacity-50"
        />
        {error && (
          <p className="text-val-red text-xs mb-3 font-mono">{error}</p>
        )}
        <button type="submit" className="btn-val-primary w-full justify-center py-3.5 text-xs" disabled={checking}>
          {checking ? (
            <><span className="animate-spin inline-block mr-1.5">↻</span> VERIFYING...</>
          ) : (
            "UNLOCK VAULT"
          )}
        </button>
      </form>
      <p className="mt-5 font-mono text-[0.7rem] text-gray-600 flex items-center justify-center gap-1.5 relative">
        <span className="w-1.5 h-1.5 rounded-full bg-val-teal shadow-[0_0_8px_rgba(23,222,166,0.6)]" />
        Google Drive upload enabled
      </p>
    </div>
  );
}

export function DropZone({
  onFiles,
  selectedGame,
}: {
  onFiles: (files: FileList) => void;
  selectedGame: string;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const gameInfo = getGameById(selectedGame) || GENERAL_GAME;

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
          {/* Game tag badge */}
          <span
            className="px-3.5 py-1 rounded-full font-mono text-[0.7rem] border flex items-center gap-1.5"
            style={{
              background: `${gameInfo.color}12`,
              borderColor: `${gameInfo.color}30`,
              color: gameInfo.color,
            }}
          >
            {gameInfo.icon} {gameInfo.name}
          </span>
          <span className="px-3.5 py-1 bg-val-red/[0.08] border border-val-red/15 rounded-full font-mono text-[0.7rem] text-gray-500">
            📸 Photos → {gameInfo.name} Folder
          </span>
          <span className="px-3.5 py-1 bg-val-red/[0.08] border border-val-red/15 rounded-full font-mono text-[0.7rem] text-gray-500">
            🎬 Videos → {gameInfo.name} Folder
          </span>
        </div>
      </div>
    </div>
  );
}

export function FileQueue({
  files,
  onUpdate,
  onRemove,
  onUploadAll,
  uploading,
  selectedGame,
}: {
  files: FileItem[];
  onUpdate: (id: string, updates: Partial<FileItem>) => void;
  onRemove: (id: string) => void;
  onUploadAll: () => void;
  uploading: boolean;
  selectedGame: string;
}) {
  const getIcon = (type: string) => type === "video" ? "🎬" : "📸";
  const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
  const gameInfo = getGameById(selectedGame) || GENERAL_GAME;

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="max-w-[700px] w-[90%] pb-20">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-heading text-base font-bold tracking-wider">Upload Queue ({files.length})</h2>
          <div className="flex gap-3 mt-1 flex-wrap">
            {pendingCount > 0 && (
              <span className="font-mono text-[0.65rem] text-gray-500">{pendingCount} pending</span>
            )}
            {doneCount > 0 && (
              <span className="font-mono text-[0.65rem] text-val-teal">{doneCount} done</span>
            )}
            {errorCount > 0 && (
              <span className="font-mono text-[0.65rem] text-val-red">{errorCount} failed</span>
            )}
            {/* Game badge */}
            <span
              className="font-mono text-[0.65rem] px-2 py-0.5 rounded-full border flex items-center gap-1"
              style={{
                background: `${gameInfo.color}10`,
                borderColor: `${gameInfo.color}25`,
                color: gameInfo.color,
              }}
            >
              {gameInfo.icon} {gameInfo.name}
            </span>
          </div>
        </div>
        <button
          className="btn-val-primary text-[0.7rem] px-5 py-2 disabled:opacity-50"
          onClick={onUploadAll}
          disabled={uploading || pendingCount === 0}
        >
          {uploading ? (
            <>
              <span className="animate-spin inline-block mr-1">↻</span> UPLOADING...
            </>
          ) : (
            <>⬆ UPLOAD TO DRIVE</>
          )}
        </button>
      </div>
      <div className="flex flex-col gap-2.5">
        {files.map((item) => (
          <div key={item.id} className={`flex items-center gap-3.5 px-4 py-3.5 bg-dark-card border rounded-lg transition-all duration-300 ${
            item.status === "done"
              ? "border-val-teal/30"
              : item.status === "error"
              ? "border-val-red/30"
              : "border-glass-border hover:border-val-red/30"
          }`}>
            <span className="text-xl flex-shrink-0">{getIcon(item.type)}</span>
            <div className="flex-1 flex flex-col gap-0.5 min-w-0">
              <input
                className="bg-transparent border-none outline-none text-val-cream font-body text-sm font-medium w-full"
                value={item.title}
                onChange={(e) => onUpdate(item.id, { title: e.target.value })}
                placeholder="Title..."
                disabled={item.status !== "pending"}
              />
              <div className="flex gap-2 items-center flex-wrap">
                <span className="font-mono text-[0.68rem] text-gray-600">{formatSize(item.file.size)}</span>
                <span className={`px-1.5 py-0.5 rounded text-[0.6rem] font-mono tracking-wider ${
                  item.type === "video"
                    ? "bg-val-red/10 text-val-red"
                    : "bg-val-teal/10 text-val-teal"
                }`}>
                  {item.type === "video" ? "VIDEO" : "PHOTO"}
                </span>
                {/* Game tag badge */}
                <span
                  className="px-1.5 py-0.5 rounded text-[0.6rem] font-mono tracking-wider"
                  style={{
                    background: `${gameInfo.color}15`,
                    color: gameInfo.color,
                  }}
                >
                  {gameInfo.icon} {gameInfo.name.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="min-w-[120px] text-right">
              {item.status === "uploading" && (
                <div className="flex items-center gap-2">
                  <span className="animate-spin text-val-red text-sm">↻</span>
                  <span className="font-mono text-[0.7rem] text-gray-400 tracking-wider">UPLOADING</span>
                </div>
              )}
              {item.status === "done" && (
                <span className="font-mono text-[0.7rem] text-val-teal tracking-wider">✓ UPLOADED</span>
              )}
              {item.status === "error" && (
                <span className="font-mono text-[0.7rem] text-val-red tracking-wider" title={item.error}>✗ FAILED</span>
              )}
              {item.status === "pending" && (
                <span className="font-mono text-[0.7rem] text-gray-600 tracking-wider">READY</span>
              )}
            </div>
            <button
              className="bg-none border-none text-gray-600 cursor-pointer text-sm p-1 hover:text-val-red transition-colors duration-300 flex-shrink-0"
              onClick={() => onRemove(item.id)}
              disabled={item.status === "uploading"}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UploadSuccess({
  count,
  onReset,
  gameName,
}: {
  count: number;
  onReset: () => void;
  gameName?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-20 h-20 rounded-full bg-val-teal/10 border border-val-teal/30 flex items-center justify-center">
        <span className="text-4xl text-val-teal">✓</span>
      </div>
      <h2 className="font-heading text-xl tracking-wider text-val-teal">UPLOAD COMPLETE</h2>
      <p className="text-gray-500 text-sm">
        {count} file{count !== 1 ? "s" : ""} uploaded to Google Drive successfully.
      </p>
      {gameName && gameName !== "general" && (
        <p className="text-gray-500 text-xs font-mono flex items-center gap-1.5">
          Stored in the <span className="text-val-teal font-semibold">{gameName}</span> folder
        </p>
      )}
      <p className="text-gray-600 text-xs font-mono">
        Files will appear in Photo Arena / Video Vault automatically.
      </p>
      <button onClick={onReset} className="btn-val-primary text-[0.7rem] px-6 py-2 mt-2">
        UPLOAD MORE
      </button>
    </div>
  );
}
