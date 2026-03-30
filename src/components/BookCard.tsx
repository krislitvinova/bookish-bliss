import { Book, STATUS_LABELS } from "@/lib/books";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./StarRating";
import { Progress } from "@/components/ui/progress";
import { BookOpen } from "lucide-react";

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
}

const COVER_GRADIENTS: Record<string, string> = {
  reading: "from-primary/20 via-primary/10 to-secondary",
  finished: "from-status-finished/20 via-status-finished/10 to-secondary",
  "to-read": "from-accent/20 via-accent/10 to-secondary",
};

export function BookCard({ book, onClick }: BookCardProps) {
  return (
    <button
      onClick={() => onClick(book)}
      className="group w-full text-left rounded-xl bg-card overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {/* Cover */}
      <div className={`relative aspect-[2/3] w-full ${book.coverUrl ? '' : `bg-gradient-to-br ${COVER_GRADIENTS[book.status] ?? COVER_GRADIENTS.reading}`} flex items-center justify-center overflow-hidden`}>
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <BookOpen className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
        )}
        <div className="absolute top-2.5 right-2.5">
          <Badge variant={book.status === "reading" ? "reading" : book.status === "finished" ? "finished" : "to-read"} className="text-[10px] px-2 py-0.5 shadow-sm">
            {STATUS_LABELS[book.status]}
          </Badge>
        </div>
        {book.status === "reading" && book.totalPages && book.totalPages > 0 && (
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
            <div className="flex items-center gap-2">
              <Progress value={((book.currentPage || 0) / book.totalPages) * 100} className="h-1 flex-1" />
              <span className="text-[10px] text-muted-foreground/70 font-medium whitespace-nowrap">
                {book.currentPage || 0}/{book.totalPages}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="p-3.5">
        <h3 className="font-serif font-semibold text-sm leading-snug text-card-foreground line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {book.author}
        </p>
        {book.rating > 0 && (
          <div className="mt-2">
            <StarRating rating={book.rating} />
          </div>
        )}
        {book.notes && (
          <p className="mt-2 text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed">
            {book.notes}
          </p>
        )}
      </div>
    </button>
  );
}
