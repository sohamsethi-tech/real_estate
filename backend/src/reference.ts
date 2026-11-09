import { randomBytes } from "node:crypto";

export function makeReference(kind: "E" | "B" | "P") {
  return `VG-${kind}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function slugify(value: string) {
  const base = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return base || "property";
}
