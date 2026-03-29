import { useState, useCallback } from "react";
import { Plus, Library, Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatsBar } from "@/components/StatsBar";
import { BookCard } from "@/components/BookCard";
import { AddBookDialog } from "@/components/AddBookDialog";
import { BookDetailDialog } from "@/components/BookDetailDialog";
import {
  Book,
  BookStatus,
  getBooks,
  addBook,
  updateBook,
  deleteBook,
} from "@/lib/books";

type FilterStatus = BookStatus | "all";
type SortOption = "date" | "title" | "rating";

export default function Index() {
  const [books, setBooks] = useState<Book[]>(getBooks);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  const refresh = useCallback(() => setBooks(getBooks()), []);

  const handleAdd = (data: { title: string; author: string; status: BookStatus; rating: number; notes: string }) => {
    addBook(data);
    refresh();
  };

  const handleUpdate = (id: string, updates: Partial<Book>) => {
    updateBook(id, updates);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteBook(id);
    refresh();
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setDetailOpen(true);
  };

  const filtered = books.filter((b) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    }
    return true;
  });

  const filters: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "Reading", value: "reading" },
    { label: "Finished", value: "finished" },
    { label: "To Read", value: "to-read" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <Library className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Library</h1>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add book
          </Button>
        </div>

        {/* Stats */}
        <StatsBar books={books} />

        {/* Filters + Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-6 mb-5">
          <div className="flex gap-1">
            {filters.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "secondary" : "ghost"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        {/* Book Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Library className="h-10 w-10 text-border mb-3" />
            <p className="text-sm text-muted-foreground">
              {books.length === 0 ? "Your library is empty. Add your first book!" : "No books match your filters."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} onClick={handleBookClick} />
            ))}
          </div>
        )}
      </div>

      <AddBookDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />
      <BookDetailDialog
        book={selectedBook}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
