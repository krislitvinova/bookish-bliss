export interface GoogleBookResult {
  id: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  pageCount?: number;
  description?: string;
}

export async function searchGoogleBooks(query: string): Promise<GoogleBookResult[]> {
  if (!query.trim()) return [];

  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&printType=books`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  if (!data.items) return [];

  return data.items.map((item: any) => {
    const info = item.volumeInfo || {};
    // Prefer high-res thumbnail
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
