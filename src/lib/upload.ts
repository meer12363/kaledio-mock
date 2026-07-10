// Client-side media handling. Everything is stored as a data URL directly in
// Postgres (no Storage bucket) — see kaledio-project memory for that tradeoff.

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // pre-downscale source cap
export const MAX_VIDEO_BYTES = 12 * 1024 * 1024; // videos aren't transcoded client-side

/** Downscale + re-encode an image so the stored data URL stays reasonably small. */
export function readImageDownscaled(file: File, maxEdge = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error("That image is too large — try one under 4MB."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

/** Read a video file directly as a data URL — no client-side transcoding, so size-capped. */
export function readVideoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_VIDEO_BYTES) {
      reject(new Error("That video is too large — try a clip under 12MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read video"));
    reader.readAsDataURL(file);
  });
}

export type AttachmentKind = "image" | "video";

export interface Attachment {
  url: string;
  kind: AttachmentKind;
}

/** Read a file picked for a post/portfolio attachment, dispatching by mime type. */
export async function readAttachment(file: File): Promise<Attachment> {
  if (file.type.startsWith("video/")) {
    return { url: await readVideoDataUrl(file), kind: "video" };
  }
  return { url: await readImageDownscaled(file, 1400), kind: "image" };
}
