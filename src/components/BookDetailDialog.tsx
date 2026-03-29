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
import { Trash2 } from "lucide-react";

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

  useEffect(() => {
    if (book) {
      setTitle(book.title);
      setAuthor(book.author);
      setStatus(book.status);
      setRating(book.rating);
      setNotes(book.notes);
    }
  }, [book]);

  if (!book) return null;

  const handleSave = () => {
    onUpdate(book.id, { title, author, status, rating, notes });
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(book.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit book</DialogTitle>
          <DialogDescription>Update the details for this book.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
