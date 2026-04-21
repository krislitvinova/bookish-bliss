export interface GoogleBookResult {
  id: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  pageCount?: number;
  description?: string;
}

async function searchGoogleBooksRaw(query: string): Promise<GoogleBookResult[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&printType=books`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  if (!data.items) return [];

  return data.items.map((item: any) => {
    const info = item.volumeInfo || {};
    const coverUrl = info.imageLinks?.thumbnail?.replace("http://", "https://")
      ?? info.imageLinks?.smallThumbnail?.replace("http://", "https://");

    return {
      id: item.id,
      title: info.title || "Unknown Title",
      authors: info.authors || [],
      coverUrl,
      pageCount: info.pageCount,
      description: info.description,
    };
  });
}

interface OpenLibraryDoc {
  key: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  isbn?: string[];
}

async function searchOpenLibrary(query: string): Promise<GoogleBookResult[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  const docs: OpenLibraryDoc[] = data.docs || [];

  return docs
    .map((d) => {
      let coverUrl: string | undefined;
      if (d.cover_i) {
        coverUrl = `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`;
      } else if (d.isbn && d.isbn.length > 0) {
        coverUrl = `https://covers.openlibrary.org/b/isbn/${d.isbn[0]}-L.jpg`;
      }
      return {
        id: `ol-${d.key}`,
        title: d.title || "Unknown Title",
        authors: d.author_name || [],
        coverUrl,
        pageCount: d.number_of_pages_median,
      };
    })
    .filter((r) => r.coverUrl); // only keep results that actually have a cover
}

/**
 * Search for books across Google Books and Open Library.
 * Google Books results come first; Open Library acts as a fallback,
 * which is especially helpful for Czech and other non-English titles
 * where Google often lacks `imageLinks`.
 */
export async function searchGoogleBooks(query: string): Promise<GoogleBookResult[]> {
  if (!query.trim()) return [];

  const [google, openLib] = await Promise.all([
    searchGoogleBooksRaw(query).catch(() => []),
    searchOpenLibrary(query).catch(() => []),
  ]);

  // Merge: Google first, then any Open Library results not already covered.
  // Prefer entries that actually have a cover URL.
  const withCovers = [...google.filter((g) => g.coverUrl), ...openLib];
  const withoutCovers = google.filter((g) => !g.coverUrl);

  // Deduplicate loosely by title+first author
  const seen = new Set<string>();
  const dedup = (arr: GoogleBookResult[]) =>
    arr.filter((r) => {
      const key = `${r.title.toLowerCase()}|${(r.authors[0] || "").toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return [...dedup(withCovers), ...dedup(withoutCovers)].slice(0, 8);
}
