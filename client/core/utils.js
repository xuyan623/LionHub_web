import { uid } from "./security.js";

export function createComment(title, content, member) {
  return {
    id: uid("comment"),
    title,
    content,
    authorId: member.id,
    authorName: member.name,
    createdAt: new Date().toISOString(),
  };
}

export function truncate(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...`;
}

export function getInitials(name) {
  return String(name || "?").trim().slice(0, 1).toUpperCase();
}

export function getDownloadUrl(storagePath) {
  return `/api/uploads/download?path=${encodeURIComponent(storagePath)}`;
}

export function parseList(value = "") {
  return String(value).split(/[,，、\s]+/).map((item) => item.trim()).filter(Boolean);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function roundPoint(value, precision) {
  if (precision === undefined) {
    precision = 1;
  }
  return parseFloat(value.toFixed(precision));
}

export function roundPointFromSettings(value) {
  const precision = state?.database?.settings?.pointPrecision ?? 1;
  return parseFloat(value.toFixed(precision));
}
