"use client";

import { useState, type ChangeEvent } from "react";
import { ImageWithFallback } from "@/components/storefront/image-with-fallback";
import { parseProductImageUrls } from "@/lib/product-image-urls";

export function ProductImageInput({
  initialUrls = [],
  name = "imageUrls",
  required = false,
}: {
  initialUrls?: string[];
  name?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(() => initialUrls.join("\n"));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    if (parseProductImageUrls(value).length >= 30) {
      setUploadError("A product can have up to 30 images. Remove an image URL before uploading another.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/admin/product-images", {
        method: "POST",
        body,
      });
      if (!response.ok) {
        const result: unknown = await response.json().catch(() => null);
        const message = result && typeof result === "object" && "error" in result &&
          typeof result.error === "string"
          ? result.error
          : "The image could not be uploaded.";
        throw new Error(message);
      }

      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("url" in result) || typeof result.url !== "string") {
        throw new Error("The upload service returned an invalid image URL.");
      }
      const uploadedUrl = result.url;
      setValue((current) => {
        const urls = parseProductImageUrls(current);
        return [...urls, uploadedUrl].join("\n");
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "The image could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  const firstUrl = parseProductImageUrls(value)[0] ?? null;

  return (
    <div className="space-y-3 sm:col-span-2">
      <label className="block space-y-1 text-sm text-plum">
        Product image URLs (one per line)
        <textarea
          className="min-h-24 w-full rounded-control border border-border p-3 text-sm"
          name={name}
          onChange={(event) => setValue(event.target.value)}
          placeholder={"https://example.com/front.jpg\nhttps://example.com/detail.jpg"}
          required={required}
          value={value}
        />
      </label>
      <p className="text-xs text-muted">
        Paste site-relative or HTTP(S) image URLs, or upload a JPG, PNG, or WebP image. The first image is shown first in the gallery; add up to 30.
      </p>
      <label className="inline-flex min-h-10 cursor-pointer items-center rounded-control border border-border px-4 text-sm font-medium text-plum hover:bg-ivory">
        {uploading ? "Uploading image…" : "Upload image"}
        <input
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => void uploadImage(event)}
          type="file"
        />
      </label>
      {uploadError && <p className="text-sm text-error" role="alert">{uploadError}</p>}
      {firstUrl && (
        <div className="flex items-center gap-3">
          <div className="relative size-20 overflow-hidden rounded-control border border-border bg-ivory">
            <ImageWithFallback
              alt="Preview of the main product image"
              className="object-contain"
              sizes="80px"
              src={firstUrl}
            />
          </div>
          <span className="text-xs text-muted">Main gallery image preview</span>
        </div>
      )}
    </div>
  );
}
