import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { assertCloudinaryConfigured, cloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    assertCloudinaryConfigured();
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  const folderRaw = form.get("folder");
  const folder =
    typeof folderRaw === "string" && folderRaw.trim()
      ? folderRaw.trim().replace(/[^a-zA-Z0-9/_-]/g, "")
      : "uploads";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 5 Mo)" },
      { status: 400 }
    );
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Type de fichier non supporté (PDF/JPG/PNG/WEBP)" },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadFolder = `fluvex/${session.companyId}/${folder}`;

  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: uploadFolder,
        resource_type: "auto",
        filename_override: file.name,
        use_filename: true,
        unique_filename: true,
      },
      (error, res) => {
        if (error) return reject(error);
        resolve(res);
      }
    );
    stream.end(buffer);
  });

  return NextResponse.json({
    url: result.secure_url,
    publicId: result.public_id,
    bytes: result.bytes,
    format: result.format,
    resourceType: result.resource_type,
    originalFilename: file.name,
    mimeType: file.type,
  });
}
