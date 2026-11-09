import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("uploads");

function sniff(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return "webp";
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString() === "ftyp") return "avif";
  return null;
}

export async function storeImage(buffer: Buffer, folder: string) {
  if (buffer.length > 8 * 1024 * 1024) throw new Error("Images must be 8 MB or smaller");
  if (!sniff(buffer)) throw new Error("Use a JPEG, PNG or WebP image");
  const image = sharp(buffer, { failOn: "error" }).rotate();
  const meta = await image.metadata();
  if (!meta.width || !meta.height) throw new Error("Could not read that image");
  const output = await image.resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const name = `${randomUUID()}.webp`;
  const dir = path.join(root, folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), output);
  return `/uploads/${folder}/${name}`;
}

export async function removeStored(storageKey: string | null | undefined) {
  if (!storageKey?.startsWith("/uploads/")) return;
  const relative = storageKey.slice("/uploads/".length);
  if (relative.includes("..")) return;
  await unlink(path.join(root, relative)).catch(() => undefined);
}
