import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "./StarRating";
import { BookStatus, STATUS_LABELS } from "@/lib/books";
import { searchGoogleBooks, GoogleBookResult } from "@/lib/googleBooks";
import { Search, Loader2 } from "lucide-react";

interface AddBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (book: {
    title: string;
    author: string;
    status: BookStatus;
    rating: number;
    notes: string;
    currentPage?: number;
    totalPages?: number;
    coverUrl?: string;
  }) => void;
}

export function AddBookDialog({ open, onOpenChange, onAdd }: AddBookDialogProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<BookStatus>("to-read");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [currentPage, setCurrentPage] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = async () => {
    if (!title.trim()) return;
    setSearching(true);
    setShowResults(true);
    try {
      const books = await searchGoogleBooks(title);
      setResults(books);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result: GoogleBookResult) => {
    setTitle(result.title);
    setAuthor(result.authors.join(", "));
    setCoverUrl(result.coverUrl || "");
    if (result.pageCount) {
      setTotalPages(String(result.pageCount));
    }
    setShowResults(false);
    setResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    onAdd({
      title: title.trim(),
      author: author.trim(),
      status,
      rating,
      notes: notes.trim(),
      currentPage: currentPage ? parseInt(currentPage) : undefined,
      totalPages: totalPages ? parseInt(totalPages) : undefined,
      coverUrl: coverUrl || undefined,
    });
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setStatus("to-read");
    setRating(0);
    setNotes("");
    setCurrentPage("");
    setTotalPages("");
    setCoverUrl("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a book</DialogTitle>
          <DialogDescription>Search by title to auto-fill details, or enter manually.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title with search */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <div className="relative">
              <div className="flex gap-1.5">
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !author) {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="Book title"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-9 w-9"
                  onClick={handleSearch}
                  disabled={!title.trim() || searching}
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Search className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>

              {/* Search results dropdown */}
              {showResults && (
                <div
                  ref={resultsRef}
                  className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border bg-popover shadow-lg max-h-64 overflow-y-auto"
                >
                  {searching ? (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching…
                    </div>
                  ) : results.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No results found
                    </div>
                  ) : (
                    results.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className="w-full flex items-start gap-3 p-3 text-left hover:bg-secondary/60 transition-colors border-b border-border/40 last:border-b-0"
                        onClick={() => handleSelectResult(r)}
                      >
                        {r.coverUrl ? (
                          <img
                            src={r.coverUrl}
                            alt={r.title}
                            className="h-14 w-10 rounded object-cover shrink-0 bg-muted"
                          />
                        ) : (
                          <div className="h-14 w-10 rounded bg-secondary shrink-0 flex items-center justify-center">
                            <Search className="h-3.5 w-3.5 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium font-serif leading-snug line-clamp-1">{r.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {r.authors.join(", ") || "Unknown author"}
                          </p>
                          {r.pageCount && (
                            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{r.pageCount} pages</p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cover preview */}
          {coverUrl && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border/40">
              <img src={coverUrl} alt="Cover" className="h-16 w-11 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Cover fetched from Google Books</p>
                <button
                  type="button"
                  className="text-xs text-destructive hover:underline mt-0.5"
                  onClick={() => setCoverUrl("")}
                >
                  Remove cover
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" required />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as BookStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS) as BookStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {status === "reading" && (
            <div className="space-y-2">
              <Label>Reading progress</Label>
              <div className="flex items-center gap-2">
                <Input type="number" min="0" value={currentPage} onChange={(e) => setCurrentPage(e.target.value)} placeholder="Current page" className="flex-1" />
                <span className="text-muted-foreground text-sm">/</span>
                <Input type="number" min="1" value={totalPages} onChange={(e) => setTotalPages(e.target.value)} placeholder="Total pages" className="flex-1" />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating rating={rating} onChange={setRating} size="md" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Quotes, thoughts..." rows={3} className="resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
            <Button type="submit">Add book</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
