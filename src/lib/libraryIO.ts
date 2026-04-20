import { Book, getBooks, saveBooks } from "./books";

export function exportLibrary() {
  const books = getBooks();
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    books,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `library-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type ImportMode = "merge" | "replace";

export interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
}

function isValidBook(b: unknown): b is Book {
  if (!b || typeof b !== "object") return false;
  const x = b as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    typeof x.title === "string" &&
    typeof x.author === "string" &&
    typeof x.status === "string" &&
    ["reading", "finished", "to-read"].includes(x.status as string)
  );
}

export async function importLibraryFromFile(
  file: File,
  mode: ImportMode = "merge"
): Promise<ImportResult> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const incoming: unknown[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.books)
    ? parsed.books
    : [];

  const valid = incoming.filter(isValidBook) as Book[];

  if (mode === "replace") {
    saveBooks(valid);
    return { imported: valid.length, skipped: incoming.length - valid.length, total: valid.length };
  }

  const existing = getBooks();
  const existingIds = new Set(existing.map((b) => b.id));
  const merged = [...existing];
  let imported = 0;
  for (const b of valid) {
    if (existingIds.has(b.id)) continue;
    merged.unshift(b);
    imported++;
  }
  saveBooks(merged);
  return {
    imported,
    skipped: incoming.length - imported,
    total: merged.length,
  };
}
