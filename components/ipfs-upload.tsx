"use client";

import { useRef, useState } from "react";
import { Check, LoaderCircle, UploadCloud } from "lucide-react";

export default function IpfsUpload({
  disabled,
  onUploaded,
}: {
  disabled: boolean;
  onUploaded: (uri: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading" | "done">("idle");
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    if (file.size > 4 * 1024 * 1024) {
      setError("Choose a file no larger than 4 MB.");
      return;
    }
    setState("uploading");
    try {
      const data = new FormData();
      data.set("file", file);
      const result = await fetch("/api/ipfs", { method: "POST", body: data });
      const payload = (await result.json()) as { uri?: string; error?: string };
      if (!result.ok || !payload.uri)
        throw new Error(payload.error || "Upload failed.");
      onUploaded(payload.uri);
      setState("done");
    } catch (cause) {
      setState("idle");
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="ipfs-upload">
      <input
        ref={input}
        className="sr-only"
        type="file"
        disabled={disabled || state === "uploading"}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <button
        type="button"
        className="secondary"
        disabled={disabled || state === "uploading"}
        onClick={() => input.current?.click()}
      >
        {state === "uploading" ? (
          <LoaderCircle className="spin" size={14} />
        ) : state === "done" ? (
          <Check size={14} />
        ) : (
          <UploadCloud size={14} />
        )}
        {state === "uploading"
          ? "Pinning to IPFS…"
          : state === "done"
            ? "Pinned — CID added"
            : "Upload & pin a file"}
      </button>
      <span>or paste a direct HTTPS / ipfs:// reference</span>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
