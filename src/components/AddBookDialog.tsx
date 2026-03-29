import { useState } from "react";
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

interface AddBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (book: { title: string; author: string; status: BookStatus; rating: number; notes: string; currentPage?: number; totalPages?: number }) => void;
}

export function AddBookDialog({ open, onOpenChange, onAdd }: AddBookDialogProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<BookStatus>("to-read");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [currentPage, setCurrentPage] = useState("");
  const [totalPages, setTotalPages] = useState("");

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
    });
    setTitle("");
    setAuthor("");
    setStatus("to-read");
    setRating(0);
    setNotes("");
    setCurrentPage("");
    setTotalPages("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a book</DialogTitle>
          <DialogDescription>Add a new book to your library.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title" required />
          </div>
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
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add book</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
