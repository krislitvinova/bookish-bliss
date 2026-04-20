import { useState, useEffect } from "react";
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
import { Book, BookStatus, STATUS_LABELS } from "@/lib/books";
import { Trash2, Search, Loader2, BookOpen, X } from "lucide-react";
import { searchGoogleBooks, GoogleBookResult } from "@/lib/googleBooks";
import { toast } from "@/hooks/use-toast";

interface BookDetailDialogProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Book>) => void;
  onDelete: (id: string) => void;
}

export function BookDetailDialog({ book, open, onOpenChange, onUpdate, onDelete }: BookDetailDialogProps) {
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

  useEffect(() => {
    if (book) {
      setTitle(book.title);
      setAuthor(book.author);
      setStatus(book.status);
      setRating(book.rating);
      setNotes(book.notes);
      setCurrentPage(book.currentPage?.toString() || "");
      setTotalPages(book.totalPages?.toString() || "");
      setCoverUrl(book.coverUrl || "");
      setResults([]);
      setShowResults(false);
    }
  }, [book]);

  if (!book) return null;

  const handleSearchCover = async () => {
    const query = `${title} ${author}`.trim();
    if (!query) {
      toast({ title: "Add a title or author to search" });
      return;
    }
    setSearching(true);
    try {
      const found = await searchGoogleBooks(query);
      setResults(found);
      setShowResults(true);
      if (found.length === 0) toast({ title: "No matches found" });
    } catch {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handlePickResult = (r: GoogleBookResult) => {
    if (r.coverUrl) setCoverUrl(r.coverUrl);
    setShowResults(false);
  };

  const handleSave = () => {
    onUpdate(book.id, {
      title, author, status, rating, notes,
      currentPage: currentPage ? parseInt(currentPage) : undefined,
      totalPages: totalPages ? parseInt(totalPages) : undefined,
      coverUrl: coverUrl || undefined,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(book.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit book</DialogTitle>
          <DialogDescription>Update the details for this book.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Cover editor */}
          <div className="space-y-2">
            <Label>Cover</Label>
            <div className="flex gap-3">
              <div className="h-24 w-16 shrink-0 rounded-md border border-border bg-secondary overflow-hidden flex items-center justify-center">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                    onError={() => setCoverUrl("")}
                  />
                ) : (
                  <BookOpen className="h-5 w-5 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="Paste image URL..."
                    className="flex-1 text-xs"
                  />
                  {coverUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setCoverUrl("")}
                      title="Remove cover"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleSearchCover}
                  disabled={searching}
                >
                  {searching ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Search className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Search cover online
                </Button>
              </div>
            </div>
            {showResults && results.length > 0 && (
              <div className="border border-border rounded-md divide-y divide-border max-h-48 overflow-y-auto">
                {results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handlePickResult(r)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-secondary text-left"
                  >
                    {r.coverUrl ? (
                      <img src={r.coverUrl} alt="" className="h-10 w-7 object-cover rounded-sm" />
                    ) : (
                      <div className="h-10 w-7 bg-muted rounded-sm" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{r.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {r.authors.join(", ")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="detail-title">Title</Label>
            <Input id="detail-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="detail-author">Author</Label>
            <Input id="detail-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
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
            <Label htmlFor="detail-notes">Notes</Label>
            <Textarea id="detail-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Quotes, thoughts..." rows={4} className="resize-none" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
