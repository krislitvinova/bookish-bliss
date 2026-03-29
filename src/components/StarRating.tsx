import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md";
}

export function StarRating({ rating, onChange, size = "sm" }: StarRatingProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star === rating ? 0 : star)}
          className={cn(
            "transition-colors",
            onChange ? "cursor-pointer hover:text-primary" : "cursor-default"
          )}
        >
          <Star
            className={cn(
              iconSize,
              star <= rating
                ? "fill-primary text-primary"
                : "text-border"
            )}
          />
        </button>
      ))}
    </div>
  );
}
