import { useState, useCallback, useRef } from "react";
import { Plus, Library, Search, ArrowUpDown, BookOpen, Armchair, Download, Upload, MoreHorizontal, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { exportLibrary, exportLibraryCSV, importLibraryFromFile, ImportMode } from "@/lib/libraryIO";
import { toast } from "@/hooks/use-toast";
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
  const [sort, setSort] = useState<SortOption>("date");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const refresh = useCallback(() => setBooks(getBooks()), []);

  const handleExport = () => {
    try {
      exportLibrary();
      toast({ title: "Library exported", description: "Your backup file has been downloaded." });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const runImport = async (file: File, mode: ImportMode) => {
    try {
      const result = await importLibraryFromFile(file, mode);
      refresh();
      toast({
        title: mode === "replace" ? "Library replaced" : "Import complete",
        description: `${result.imported} book${result.imported === 1 ? "" : "s"} imported${
          result.skipped > 0 ? `, ${result.skipped} skipped` : ""
        }.`,
      });
    } catch {
      toast({ title: "Import failed", description: "Invalid backup file.", variant: "destructive" });
    } finally {
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (books.length === 0) {
      runImport(file, "merge");
    } else {
      setPendingFile(file);
    }
  };

  const handleAdd = (data: Omit<Book, "id" | "createdAt">) => {
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

  const filtered = books
    .filter((b) => {
      if (filter !== "all" && b.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "rating") return b.rating - a.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const filters: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "Reading", value: "reading" },
    { label: "Finished", value: "finished" },
    { label: "To Read", value: "to-read" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* Elevated container */}
        <div className="bg-card rounded-2xl shadow-lg shadow-foreground/[0.04] border border-border/60 p-6 sm:p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Library className="h-5 w-5 text-primary" />
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">Library</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="rounded-lg h-9 w-9 p-0" aria-label="Library options">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" /> Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      try {
                        exportLibraryCSV();
                        toast({ title: "CSV exported", description: "Open it in Excel or Google Sheets." });
                      } catch {
                        toast({ title: "Export failed", variant: "destructive" });
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" /> Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" /> Import library
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" className="rounded-lg shadow-sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Add book
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleFileSelected}
              />
            </div>
          </div>

          {/* Stats */}
          <StatsBar books={books} />

          {/* Filters + Search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-7 mb-6">
            <div className="flex gap-1.5">
              {filters.map((f) => (
                <Button
                  key={f.value}
                  variant={filter === f.value ? "default" : "ghost"}
                  size="sm"
                  className={`text-xs h-8 rounded-full px-4 transition-all duration-200 ${
                    filter === f.value
                      ? "shadow-sm"
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 h-8 text-xs rounded-lg"
                />
              </div>
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="h-8 w-[130px] text-xs rounded-lg">
                  <ArrowUpDown className="h-3 w-3 mr-1 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date added</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Book Grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="relative mb-6">
                <div className="h-24 w-24 rounded-2xl bg-secondary flex items-center justify-center">
                  <Armchair className="h-12 w-12 text-muted-foreground/40" strokeWidth={1.2} />
                </div>
                <div className="absolute -top-2 -right-3 h-10 w-8 rounded-md bg-accent/15 border border-accent/20 rotate-12 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-accent/50" />
                </div>
                <div className="absolute -bottom-1 -left-3 h-8 w-6 rounded-sm bg-primary/10 border border-primary/15 -rotate-12" />
              </div>
              <p className="text-sm font-serif font-medium text-foreground mb-1">
                {books.length === 0 ? "Your reading nook awaits" : "No books match your filters"}
              </p>
              <p className="text-xs text-muted-foreground max-w-[240px]">
                {books.length === 0
                  ? "Add your first book and start building your personal library."
                  : "Try adjusting your search or filter to find what you're looking for."}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((book) => (
                <BookCard key={book.id} book={book} onClick={handleBookClick} />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddBookDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />
      <BookDetailDialog
        book={selectedBook}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      <AlertDialog open={!!pendingFile} onOpenChange={(o) => !o && setPendingFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import library</AlertDialogTitle>
            <AlertDialogDescription>
              You already have {books.length} book{books.length === 1 ? "" : "s"}. Merge will add new books and skip duplicates. Replace will overwrite your library and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => pendingFile && runImport(pendingFile, "replace")}
            >
              Replace
            </Button>
            <AlertDialogAction onClick={() => pendingFile && runImport(pendingFile, "merge")}>
              Merge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
