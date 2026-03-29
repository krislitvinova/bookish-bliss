import { Book, STATUS_LABELS } from "@/lib/books";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./StarRating";
import { Progress } from "@/components/ui/progress";

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
}

export function BookCard({ book, onClick }: BookCardProps) {
  return (
    <button
      onClick={() => onClick(book)}
      className="group w-full text-left rounded-lg border bg-card p-4 transition-all hover:shadow-sm hover:border-primary/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm leading-snug truncate text-card-foreground">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {book.author}
          </p>
        </div>
        <Badge variant={book.status === "reading" ? "reading" : book.status === "finished" ? "finished" : "to-read"}>
          {STATUS_LABELS[book.status]}
        </Badge>
      </div>
      {book.rating > 0 && (
        <div className="mt-3">
          <StarRating rating={book.rating} />
        </div>
      )}
      {book.status === "reading" && book.totalPages && book.totalPages > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <Progress value={((book.currentPage || 0) / book.totalPages) * 100} className="h-1 flex-1" />
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {book.currentPage || 0}/{book.totalPages}
          </span>
        </div>
      )}
      {book.notes && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {book.notes}
        </p>
      )}
    </button>
  );
}
