"use client";

import { useRef, useState } from "react";
import { createSupabaseClient } from "@/app/lib/supabase";

type Props = {
  currentUrl: string;
  onUploaded: (url: string) => void;
  folder?: string;
  aspectRatio?: "video" | "square";
  existingImageUrl?: string;
};

const MAX_PX = 1920;
const WEBP_QUALITY = 0.88;

/** Resize to MAX_PX on the longest side and convert to WebP via canvas. */
async function toWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_PX);
          width = MAX_PX;
        } else {
          width = Math.round((width / height) * MAX_PX);
          height = MAX_PX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not available")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Conversion failed"));
        },
        "image/webp",
        WEBP_QUALITY,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
    img.src = objectUrl;
  });
}

export function ImageUploader({
  currentUrl,
  onUploaded,
  folder = "general",
  aspectRatio = "video",
  existingImageUrl,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createSupabaseClient();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError("Image must be under 20 MB.");
      return;
    }

    setUploading(true);
    setError(null);

    let blob: Blob;
    try {
      blob = await toWebP(file);
    } catch {
      setError("Could not process image. Please try a JPEG or PNG.");
      setUploading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not logged in."); setUploading(false); return; }

    const path = `${user.id}/${folder}/${Date.now()}.webp`;

    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(path, blob, { upsert: true, contentType: "image/webp" });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    if (existingImageUrl && existingImageUrl.includes('supabase.co/storage')) {
      const existingPath = existingImageUrl.split('/menu-images/')[1];
      if (existingPath) await supabase.storage.from('menu-images').remove([existingPath]);
    }
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

      {/* Upload button — only shown when no image is set */}
      {currentUrl ? (
        <div className="flex items-center gap-2 py-1">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs text-green-600 font-medium">Image uploaded</span>
        </div>
      ) : (
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
              Processing & uploading…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload image
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-gray-400 text-center">JPEG, PNG or WebP · Auto-converted to WebP</p>
    </div>
  );
}
