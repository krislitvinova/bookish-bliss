import { useState } from "react";
import { Book, getBooksReadThisYear } from "@/lib/books";
import { BookOpen, CheckCircle2, Clock, Pencil, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

const GOAL_KEY = "book-tracker-yearly-goal";

function getStoredGoal(): number {
  try {
    const v = localStorage.getItem(GOAL_KEY);
    return v ? parseInt(v, 10) : 12;
  } catch {
    return 12;
  }
}

function saveGoal(goal: number) {
  localStorage.setItem(GOAL_KEY, String(goal));
}

interface StatsBarProps {
  books: Book[];
}

export function StatsBar({ books }: StatsBarProps) {
  const [yearlyGoal, setYearlyGoal] = useState(getStoredGoal);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const booksRead = getBooksReadThisYear(books);
  const reading = books.filter((b) => b.status === "reading").length;
  const toRead = books.filter((b) => b.status === "to-read").length;
  const progress = yearlyGoal > 0 ? Math.min((booksRead / yearlyGoal) * 100, 100) : 0;

  const startEditing = () => {
    setDraft(String(yearlyGoal));
    setEditing(true);
  };

  const commitGoal = () => {
    const val = parseInt(draft, 10);
    if (!isNaN(val) && val > 0) {
      setYearlyGoal(val);
      saveGoal(val);
    }
    setEditing(false);
  };

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
      <div className="flex items-center gap-2 min-w-0 sm:w-56">
        <Progress value={progress} className="h-1.5 flex-1" />
        {editing ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{booksRead}/</span>
            <Input
              type="number"
              min="1"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commitGoal()}
              autoFocus
              className="h-6 w-12 text-xs px-1 text-center"
            />
            <button onClick={commitGoal} className="text-primary hover:text-primary/80 transition-colors">
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={startEditing}
            className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap hover:text-foreground transition-colors group"
          >
            {booksRead}/{yearlyGoal}
            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>
    </div>
  );
}
