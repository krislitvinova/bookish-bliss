import { supabase } from "@/integrations/supabase/client";

export type BookStatus = "reading" | "finished" | "to-read";

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  rating: number;
  notes: string;
  createdAt: string;
  finishedAt?: string;
  currentPage?: number;
  totalPages?: number;
  coverUrl?: string;
}

const STORAGE_KEY = "book-tracker-library";

// ----- Local storage layer (used when not signed in) -----

export function getLocalBooks(): Book[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalBooks(books: Book[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export function clearLocalBooks() {
  localStorage.removeItem(STORAGE_KEY);
}

// ----- Cloud mapping helpers -----

interface DbRow {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  rating: number;
  notes: string;
  created_at: string;
  finished_at: string | null;
  current_page: number | null;
  total_pages: number | null;
  cover_url: string | null;
}

function rowToBook(r: DbRow): Book {
  return {
    id: r.id,
    title: r.title,
    author: r.author,
    status: r.status,
    rating: r.rating,
    notes: r.notes,
    createdAt: r.created_at,
    finishedAt: r.finished_at ?? undefined,
    currentPage: r.current_page ?? undefined,
    totalPages: r.total_pages ?? undefined,
    coverUrl: r.cover_url ?? undefined,
  };
}

function bookToInsert(b: Omit<Book, "id" | "createdAt">, userId: string) {
  return {
    user_id: userId,
    title: b.title,
    author: b.author,
    status: b.status,
    rating: b.rating,
    notes: b.notes,
    finished_at: b.finishedAt ?? null,
    current_page: b.currentPage ?? null,
    total_pages: b.totalPages ?? null,
    cover_url: b.coverUrl ?? null,
  };
}

function updatesToDb(u: Partial<Book>) {
  const out: Record<string, unknown> = {};
  if (u.title !== undefined) out.title = u.title;
  if (u.author !== undefined) out.author = u.author;
  if (u.status !== undefined) out.status = u.status;
  if (u.rating !== undefined) out.rating = u.rating;
  if (u.notes !== undefined) out.notes = u.notes;
  if (u.finishedAt !== undefined) out.finished_at = u.finishedAt ?? null;
  if (u.currentPage !== undefined) out.current_page = u.currentPage ?? null;
  if (u.totalPages !== undefined) out.total_pages = u.totalPages ?? null;
  if (u.coverUrl !== undefined) out.cover_url = u.coverUrl ?? null;
  return out;
}

// ----- Unified API (cloud when userId provided, otherwise local) -----

export async function fetchBooks(userId: string | null): Promise<Book[]> {
  if (!userId) return getLocalBooks();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DbRow[]).map(rowToBook);
}

export async function addBook(
  userId: string | null,
  book: Omit<Book, "id" | "createdAt">
): Promise<Book> {
  if (!userId) {
    const books = getLocalBooks();
    const newBook: Book = {
      ...book,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    books.unshift(newBook);
    saveLocalBooks(books);
    return newBook;
  }
  const { data, error } = await supabase
    .from("books")
    .insert(bookToInsert(book, userId))
    .select("*")
    .single();
  if (error) throw error;
  return rowToBook(data as DbRow);
}

export async function updateBook(
  userId: string | null,
  id: string,
  updates: Partial<Book>
): Promise<Book | null> {
  // auto-set finishedAt when transitioning to finished
  const finalUpdates = { ...updates };
  if (updates.status === "finished" && !updates.finishedAt) {
    finalUpdates.finishedAt = new Date().toISOString();
  }

  if (!userId) {
    const books = getLocalBooks();
    const idx = books.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    if (finalUpdates.status === "finished" && !books[idx].finishedAt && !finalUpdates.finishedAt) {
      finalUpdates.finishedAt = new Date().toISOString();
    }
    books[idx] = { ...books[idx], ...finalUpdates };
    saveLocalBooks(books);
    return books[idx];
  }

  const { data, error } = await supabase
    .from("books")
    .update(updatesToDb(finalUpdates))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return rowToBook(data as DbRow);
}

export async function deleteBook(userId: string | null, id: string): Promise<void> {
  if (!userId) {
    const books = getLocalBooks().filter((b) => b.id !== id);
    saveLocalBooks(books);
    return;
  }
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw error;
}

export async function clearAllBooks(userId: string | null): Promise<void> {
  if (!userId) {
    clearLocalBooks();
    return;
  }
  const { error } = await supabase.from("books").delete().eq("user_id", userId);
  if (error) throw error;
}

/**
 * Upload all local books to cloud for a freshly signed-in user, then clear local.
 * Returns number of books uploaded.
 */
export async function uploadLocalBooksToCloud(userId: string): Promise<number> {
  const local = getLocalBooks();
  if (local.length === 0) return 0;
  const rows = local.map((b) => bookToInsert(b, userId));
  const { error } = await supabase.from("books").insert(rows);
  if (error) throw error;
  clearLocalBooks();
  return local.length;
}

export function getBooksReadThisYear(books: Book[]): number {
  const year = new Date().getFullYear();
  return books.filter(
    (b) => b.status === "finished" && b.finishedAt && new Date(b.finishedAt).getFullYear() === year
  ).length;
}

export const STATUS_LABELS: Record<BookStatus, string> = {
  reading: "Reading",
  finished: "Finished",
  "to-read": "To Read",
};
