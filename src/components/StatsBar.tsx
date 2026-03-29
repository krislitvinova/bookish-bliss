import { Book, getBooksReadThisYear } from "@/lib/books";
import { BookOpen, CheckCircle2, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StatsBarProps {
  books: Book[];
  yearlyGoal?: number;
}

export function StatsBar({ books, yearlyGoal = 12 }: StatsBarProps) {
  const booksRead = getBooksReadThisYear(books);
  const reading = books.filter((b) => b.status === "reading").length;
  const toRead = books.filter((b) => b.status === "to-read").length;
  const progress = Math.min((booksRead / yearlyGoal) * 100, 100);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-status-reading">
          <BookOpen className="h-4 w-4" />
          <span className="font-medium">{reading}</span>
          <span className="text-muted-foreground">reading</span>
        </div>
        <div className="flex items-center gap-2 text-status-finished">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">{booksRead}</span>
          <span className="text-muted-foreground">this year</span>
        </div>
        <div className="flex items-center gap-2 text-status-to-read">
          <Clock className="h-4 w-4" />
          <span className="font-medium">{toRead}</span>
          <span className="text-muted-foreground">queued</span>
        </div>
      </div>
      <div className="flex items-center gap-3 min-w-0 sm:w-48">
        <Progress value={progress} className="h-1.5" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {booksRead}/{yearlyGoal}
        </span>
      </div>
    </div>
  );
}
