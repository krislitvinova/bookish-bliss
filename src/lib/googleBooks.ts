export interface GoogleBookResult {
  id: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  pageCount?: number;
  description?: string;
  isbn?: string;
}

function pickIsbn(identifiers: any[] | undefined): string | undefined {
  if (!identifiers || !Array.isArray(identifiers)) return undefined;
  const isbn13 = identifiers.find((i) => i.type === "ISBN_13");
  if (isbn13?.identifier) return isbn13.identifier;
  const isbn10 = identifiers.find((i) => i.type === "ISBN_10");
  if (isbn10?.identifier) return isbn10.identifier;
  return undefined;
}

function extractCover(info: any): string | undefined {
  return (
    info.imageLinks?.extraLarge?.replace("http://", "https://") ??
    info.imageLinks?.large?.replace("http://", "https://") ??
    info.imageLinks?.medium?.replace("http://", "https://") ??
    info.imageLinks?.thumbnail?.replace("http://", "https://") ??
    info.imageLinks?.smallThumbnail?.replace("http://", "https://")
  );
}

async function searchGoogleBooksRaw(query: string): Promise<GoogleBookResult[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&printType=books`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  if (!data.items) return [];

  return data.items.map((item: any) => {
    const info = item.volumeInfo || {};
    return {
      id: item.id,
      title: info.title || "Unknown Title",
      authors: info.authors || [],
      coverUrl: extractCover(info),
      pageCount: info.pageCount,
      description: info.description,
      isbn: pickIsbn(info.industryIdentifiers),
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
        isbn: d.isbn?.[0],
      };
    })
    .filter((r) => r.coverUrl);
}

/**
 * Try Open Library Covers API by ISBN. Uses ?default=false so a missing
 * cover returns 404 instead of a blank placeholder image.
 */
async function tryOpenLibraryCoverByIsbn(isbn: string): Promise<string | undefined> {
  const url = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg?default=false`;
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (res.ok) return url;
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Try Google Books volumes lookup by ISBN. Some editions of the same book
 * carry imageLinks even when the original search hit didn't.
 */
async function tryGoogleCoverByIsbn(isbn: string): Promise<string | undefined> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = await res.json();
    if (!data.items) return undefined;
    for (const item of data.items) {
      const cover = extractCover(item.volumeInfo || {});
      if (cover) return cover;
    }
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * For results that still lack a cover but have an ISBN, attempt
 * Open Library Covers API first (cheap HEAD), then a Google Books
 * ISBN lookup as a last resort.
 */
async function fillMissingCoversByIsbn(results: GoogleBookResult[]): Promise<GoogleBookResult[]> {
  return Promise.all(
    results.map(async (r) => {
      if (r.coverUrl || !r.isbn) return r;
      const olCover = await tryOpenLibraryCoverByIsbn(r.isbn);
      if (olCover) return { ...r, coverUrl: olCover };
      const gCover = await tryGoogleCoverByIsbn(r.isbn);
      if (gCover) return { ...r, coverUrl: gCover };
      return r;
    })
  );
}

/**
 * Search for books across Google Books and Open Library, with ISBN-based
 * fallbacks for covers. Especially helpful for Czech and other non-English
 * titles where Google often lacks `imageLinks`.
 */
export async function searchGoogleBooks(query: string): Promise<GoogleBookResult[]> {
  if (!query.trim()) return [];

  const [google, openLib] = await Promise.all([
    searchGoogleBooksRaw(query).catch(() => []),
    searchOpenLibrary(query).catch(() => []),
  ]);

  // Try to fill in covers for Google results that lack one but have an ISBN.
  const googleFilled = await fillMissingCoversByIsbn(google);

  // Prefer entries that actually have a cover URL.
  const withCovers = [...googleFilled.filter((g) => g.coverUrl), ...openLib];
  const withoutCovers = googleFilled.filter((g) => !g.coverUrl);

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
