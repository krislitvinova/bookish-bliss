export type CoverSource = "google" | "openlibrary" | "isbn" | "custom" | "none";

export interface CoverSourceInfo {
  source: CoverSource;
  label: string;
  shortLabel: string;
  className: string;
}

/**
 * Detect where a cover image came from based on its URL.
 * - Google Books: books.google.com / books.googleusercontent.com
 * - Open Library (search result, by cover_i): covers.openlibrary.org/b/id/
 * - ISBN fallback (Open Library Covers by ISBN): covers.openlibrary.org/b/isbn/
 * - Anything else is treated as a custom URL pasted by the user.
 */
export function detectCoverSource(coverUrl?: string | null): CoverSource {
  if (!coverUrl) return "none";
  try {
    const url = new URL(coverUrl);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();

    if (host.includes("books.google.") || host.includes("googleusercontent.com")) {
      return "google";
    }
    if (host.includes("covers.openlibrary.org")) {
      if (path.startsWith("/b/isbn/")) return "isbn";
      return "openlibrary";
    }
    return "custom";
  } catch {
    return "custom";
  }
}

export function getCoverSourceInfo(coverUrl?: string | null): CoverSourceInfo {
  const source = detectCoverSource(coverUrl);
  switch (source) {
    case "google":
      return {
        source,
        label: "Cover from Google Books",
        shortLabel: "Google",
        // blue-ish using existing token
        className: "bg-primary/90 text-primary-foreground",
      };
    case "openlibrary":
      return {
        source,
        label: "Cover from Open Library",
        shortLabel: "OL",
        className: "bg-status-finished/90 text-primary-foreground",
      };
    case "isbn":
      return {
        source,
        label: "Cover via ISBN fallback (Open Library)",
        shortLabel: "ISBN",
        className: "bg-accent text-accent-foreground",
      };
    case "custom":
      return {
        source,
        label: "Custom cover URL",
        shortLabel: "URL",
        className: "bg-muted text-muted-foreground",
      };
    default:
      return {
        source,
        label: "No cover",
        shortLabel: "",
        className: "bg-muted text-muted-foreground",
      };
  }
}
