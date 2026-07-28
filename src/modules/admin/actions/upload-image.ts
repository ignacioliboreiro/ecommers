"use server";

import { cloudinary } from "@/lib/cloudinary";

import { requireAdmin } from "./require-admin";

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export interface UploadImageResult {
  status: "success" | "error";
  url?: string;
  publicId?: string;
  message?: string;
}

export async function uploadProductImage(formData: FormData): Promise<UploadImageResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { status: "error", message: "No se recibió ningún archivo." };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { status: "error", message: "Formato no soportado. Usá JPG, PNG, WEBP o AVIF." };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { status: "error", message: "La imagen no puede superar los 8MB." };
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "products",
      resource_type: "image",
    });
    return { status: "success", url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    console.error("Error subiendo imagen a Cloudinary:", err);
    return { status: "error", message: "No se pudo subir la imagen. Intentá de nuevo." };
  }
}
