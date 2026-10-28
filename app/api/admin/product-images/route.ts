import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  FirebaseAdminConfigurationError,
  getFirebaseAdminStorageBucket,
} from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxRequestBytes = 4_500_000;
const maxImageBytes = 4_000_000;
const imageTypes = {
  "image/jpeg": { extension: "jpg", signature: (bytes: Buffer) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", signature: (bytes: Buffer) => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { extension: "webp", signature: (bytes: Buffer) => bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" },
} as const;

function isValidImageType(
  contentType: string,
): contentType is keyof typeof imageTypes {
  return Object.hasOwn(imageTypes, contentType);
}

export async function POST(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
    return NextResponse.json({ error: "Image upload must be 4 MB or smaller." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload an image using a multipart form." }, { status: 400 });
  }
  const image = form.get("image");
  if (!image || typeof image === "string" || image.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (image.size > maxImageBytes) {
    return NextResponse.json({ error: "Image upload must be 4 MB or smaller." }, { status: 413 });
  }
  if (!isValidImageType(image.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP image." }, { status: 415 });
  }

  const bytes = Buffer.from(await image.arrayBuffer());
  const type = imageTypes[image.type];
  if (!type.signature(bytes)) {
    return NextResponse.json({ error: "The selected file does not match its image format." }, { status: 415 });
  }

  const objectPath = `products/${randomUUID()}.${type.extension}`;
  const downloadToken = randomUUID();
  try {
    const bucket = getFirebaseAdminStorageBucket();
    await bucket.file(objectPath).save(bytes, {
      resumable: false,
      validation: "crc32c",
      metadata: {
        contentType: image.type,
        cacheControl: "public, max-age=31536000, immutable",
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      },
    });

    const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST?.trim();
    const baseUrl = emulatorHost
      ? `http://${emulatorHost}`
      : "https://firebasestorage.googleapis.com";
    const url = `${baseUrl}/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(objectPath)}?alt=media&token=${downloadToken}`;
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    if (error instanceof FirebaseAdminConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Admin product image upload failed:", error);
    return NextResponse.json(
      { error: "Image upload failed. Check Firebase Storage setup and try again." },
      { status: 503 },
    );
  }
}
