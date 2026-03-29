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
}

const STORAGE_KEY = "book-tracker-library";

export function getBooks(): Book[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveBooks(books: Book[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export function addBook(book: Omit<Book, "id" | "createdAt">): Book {
  const books = getBooks();
  const newBook: Book = {
    ...book,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  books.unshift(newBook);
  saveBooks(books);
  return newBook;
}

export function updateBook(id: string, updates: Partial<Book>): Book | null {
  const books = getBooks();
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) return null;
  books[index] = { ...books[index], ...updates };
  if (updates.status === "finished" && !books[index].finishedAt) {
    books[index].finishedAt = new Date().toISOString();
  }
  saveBooks(books);
  return books[index];
}

export function deleteBook(id: string) {
  const books = getBooks().filter((b) => b.id !== id);
  saveBooks(books);
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
