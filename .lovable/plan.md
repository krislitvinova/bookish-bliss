

## Cíl
Najít obálky i pro české knihy, které Google Books a Open Library Search nepokrývají (jako "15 roků lásky"), s využitím ISBN.

## Co změníme

### `src/lib/googleBooks.ts`

**1. Přidat ISBN do interních dat**
- Rozšířit `GoogleBookResult` o volitelné `isbn?: string`
- V `searchGoogleBooksRaw` extrahovat ISBN z `volumeInfo.industryIdentifiers` (preferovat ISBN_13, jinak ISBN_10)

**2. ISBN fallback přes Open Library Covers**
- Pro každý Google Books výsledek bez `coverUrl`, ale s ISBN, zkusit URL:
  `https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg?default=false`
- Parametr `?default=false` vrací **404 místo prázdného obrázku**, takže můžeme detekovat, jestli cover existuje
- Provést paralelně přes `Promise.all` s `HEAD` requestem (rychlé, bez stahování obrázku)
- Pokud existuje, doplnit do výsledku

**3. Druhý fallback: Google Books přes ISBN dotaz**
- Některé edice mají obálku v jiné `volumeId`. Pokud po výše uvedeném stále chybí cover a máme ISBN, zavolat ještě:
  `https://www.googleapis.com/books/v1/volumes?q=isbn:{ISBN}` 
- Vzít `imageLinks` z první položky, která ji má

**4. Pořadí pokusů (od nejlevnějšího po nejdražší)**
```text
1. Google Books search (title+author) → cover?
2. Open Library search → cover?
3. Pro výsledky bez coveru, které mají ISBN:
   a) Open Library Covers podle ISBN (HEAD check)
   b) Google Books volumes?q=isbn:XXX
4. Vrátit výsledky, preferovat ty s coverem
```

## Proč by to mělo fungovat pro "15 roků lásky"
- Google Books vrací ISBN `9788076110434`
- I když OL search knihu nezná, OL Covers API podle ISBN obvykle pokrývá širší databázi (sdílí data s knihovnami)
- Pokud ne, druhý dotaz na Google Books `q=isbn:9788076110434` může vrátit jinou edici se zachovaným `imageLinks`

## Poznámky / limity
- HEAD requesty na `covers.openlibrary.org` jsou rychlé, ale přidávají ~200-500 ms při 5 výsledcích bez coveru (paralelně)
- Pro knihy bez ISBN i v Google Books (vzácné) zůstane placeholder — uživatel může pořád vložit URL ručně
- Žádné API klíče, žádné CORS problémy (oba endpointy podporují CORS)

## Soubory ke změně
- `src/lib/googleBooks.ts` — jediný soubor, plně zpětně kompatibilní (UI v `BookDetailDialog.tsx` a `AddBookDialog.tsx` se nemění)

