import { Book, STATUS_LABELS } from "@/lib/books";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./StarRating";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCoverSourceInfo } from "@/lib/coverSource";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (book: Book) => void;
}

const COVER_GRADIENTS: Record<string, string> = {
  reading: "from-primary/20 via-primary/10 to-secondary",
  finished: "from-status-finished/20 via-status-finished/10 to-secondary",
  "to-read": "from-accent/20 via-accent/10 to-secondary",
};

export function BookCard({
  book,
  onClick,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: BookCardProps) {
  const handleClick = () => {
    if (selectionMode) {
      onToggleSelect?.(book);
    } else {
      onClick(book);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-pressed={selectionMode ? selected : undefined}
      className={cn(
        "group relative w-full text-left rounded-xl bg-card overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex flex-col h-full",
        selected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Cover */}
      <div className={`relative aspect-[2/3] w-full shrink-0 ${book.coverUrl ? 'bg-secondary' : `bg-gradient-to-br ${COVER_GRADIENTS[book.status] ?? COVER_GRADIENTS.reading}`} flex items-center justify-center overflow-hidden`}>
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
              selected && "opacity-80"
            )}
          />
        ) : (
          <BookOpen className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
        )}

        {/* Cover source indicator */}
        {book.coverUrl && !selectionMode && (() => {
          const info = getCoverSourceInfo(book.coverUrl);
          if (info.source === "none") return null;
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "absolute bottom-2 left-2 z-10 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm",
                    info.className
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {info.shortLabel}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {info.label}
              </TooltipContent>
            </Tooltip>
          );
        })()}

        {/* Selection checkbox */}
        {selectionMode && (
          <div className="absolute top-2.5 left-2.5 z-10 h-6 w-6 rounded-md bg-card/95 backdrop-blur-sm shadow-md flex items-center justify-center">
            <Checkbox
              checked={selected}
              tabIndex={-1}
              className="pointer-events-none h-4 w-4"
            />
          </div>
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

      {/* Info area — fixed layout for visual uniformity */}
      <div className="p-3.5 flex flex-col gap-1 flex-1 min-h-[96px]">
        <h3 className="font-serif font-semibold text-sm leading-snug text-card-foreground line-clamp-2 min-h-[2.5rem]">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {book.author}
        </p>
        <div className="mt-auto pt-1 min-h-[18px]">
          {book.rating > 0 && <StarRating rating={book.rating} />}
        </div>
      </div>
    </button>
  );
}
