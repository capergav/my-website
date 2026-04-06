"use client";

import { useRef, useState } from "react";
import { createSupabaseClient } from "@/app/lib/supabase";

type Props = {
  currentUrl: string;
  onUploaded: (url: string) => void;
  folder?: string;
  aspectRatio?: "video" | "square";
};

export function ImageUploader({
  currentUrl,
  onUploaded,
  folder = "general",
  aspectRatio = "video",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createSupabaseClient();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    setUploading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not logged in."); setUploading(false); return; }

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${folder}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    onUploaded(data.publicUrl);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const aspectClass = aspectRatio === "square" ? "aspect-square" : "aspect-video";

  return (
    <div className="space-y-2">
      {/* Preview */}
      {currentUrl && (
        <div className={`relative w-full ${aspectClass} rounded-xl overflow-hidden bg-gray-100`}>
          <img src={currentUrl} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onUploaded("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80 transition-colors"
            title="Remove image"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />

      {/* Upload button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-medium"
      >
        {uploading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Uploading…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {currentUrl ? "Replace image" : "Upload image"}
          </>
        )}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-gray-400 text-center">JPEG, PNG or WebP · Max 5 MB</p>
    </div>
  );
}
