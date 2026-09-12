import { Search as SearchIcon, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import SearchBar from "../components/SearchBar";
import { getMovies } from "../services/movieService";

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function searchableText(item) {
  return [
    item.title,
    item.description,
    ...(item.genres || []),
    item.language,
    item.country,
    ...(item.cast || []),
    item.director,
    item.type === "series" ? "series tv shows" : "movie movies",
    item.year,
  ].filter(Boolean).map(normalize);
}

function scoreResult(item, query) {
  const title = normalize(item.title);
  const fields = searchableText(item);
  if (title === query) return 100;
  if (title.startsWith(query)) return 80;
  if (title.includes(query)) return 60;
  if (fields.some((field) => field === query)) return 40;
  return 20;
}

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = normalize(searchParams.get("q"));
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [type, setType] = useState("all");
  const [genre, setGenre] = useState("all");
  const [language, setLanguage] = useState("all");
  const [sort, setSort] = useState("relevance");

  const loadContent = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await getMovies();
      setContent(Array.isArray(response?.movies) ? response.movies.filter((item) => item?.published === true) : []);
    } catch {
      setContent([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchContent = async () => {
      try {
        const response = await getMovies();
        if (active) setContent(Array.isArray(response?.movies) ? response.movies.filter((item) => item?.published === true) : []);
      } catch {
        if (active) {
          setContent([]);
          setError(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchContent();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.title = query ? `ErrorCinema — Search: ${query}` : "ErrorCinema — Search";
  }, [query]);

  const genres = useMemo(() => [...new Set(content.flatMap((item) => item.genres || []).filter(Boolean))].sort(), [content]);
  const languages = useMemo(() => [...new Set(content.map((item) => item.language).filter(Boolean))].sort(), [content]);
  const results = useMemo(() => {
    if (!query) return [];
    return content
      .filter((item) => {
        const matchesQuery = searchableText(item).some((field) => field.includes(query));
        const matchesType = type === "all" || item.type === type;
        const matchesGenre = genre === "all" || item.genres?.includes(genre);
        const matchesLanguage = language === "all" || item.language === language;
        return matchesQuery && matchesType && matchesGenre && matchesLanguage;
      })
      .sort((a, b) => {
        if (sort === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        if (sort === "rating") return Number(b.rating || 0) - Number(a.rating || 0);
        if (sort === "views") return Number(b.views || 0) - Number(a.views || 0);
        return scoreResult(b, query) - scoreResult(a, query) || Number(b.rating || 0) - Number(a.rating || 0);
      });
  }, [content, genre, language, query, sort, type]);

  const updateQuery = (value) => {
    const trimmed = value.trim();
    setSearchParams(trimmed ? { q: trimmed } : {});
  };

  const clearSearch = () => {
    setSearchParams({});
    setType("all");
    setGenre("all");
    setLanguage("all");
    setSort("relevance");
  };

  return <main className="min-h-screen bg-black px-5 pb-24 pt-28 text-white md:px-8"><div className="mx-auto max-w-7xl"><header className="mb-8"><p className="mb-2 text-sm font-semibold uppercase tracking-widest text-red-500">ErrorCinema</p><h1 className="text-3xl font-black sm:text-4xl">Search</h1><p className="mt-2 text-sm text-gray-500">Find movies, series, genres, and languages.</p></header>
    <section className="mb-8 rounded-xl border border-white/10 bg-zinc-950 p-4 sm:p-5"><SearchBar value={searchParams.get("q") || ""} onChange={(event) => updateQuery(event.target.value)} onSubmit={(event) => { event.preventDefault(); updateQuery(event.currentTarget.elements.search.value); }} /><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><FilterSelect label="Type" value={type} onChange={setType} options={[["all", "All content"], ["movie", "Movies"], ["series", "Series"]]} /><FilterSelect label="Genre" value={genre} onChange={setGenre} options={[["all", "All genres"], ...genres.map((item) => [item, item])]} /><FilterSelect label="Language" value={language} onChange={setLanguage} options={[["all", "All languages"], ...languages.map((item) => [item, item])]} /><FilterSelect label="Sort" value={sort} onChange={setSort} options={[["relevance", "Relevance"], ["newest", "Newest"], ["rating", "Highest Rated"], ["views", "Most Viewed"]]} /></div>{(query || type !== "all" || genre !== "all" || language !== "all") && <button type="button" onClick={clearSearch} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300"><X size={16} /> Clear Search</button>}</section>
    {!query ? <EmptyQuery /> : loading ? <LoadingState /> : error ? <ErrorState onRetry={loadContent} /> : results.length === 0 ? <NoResults query={query} onClear={clearSearch} /> : <><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Search results for <span className="text-red-400">“{query}”</span></h2><span className="shrink-0 text-sm text-gray-500">{results.length} {results.length === 1 ? "result" : "results"}</span></div><div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{results.map((item) => <MovieCard key={item._id} movie={item} />)}</div></>}
  </div></main>;
}

function FilterSelect({ label, value, onChange, options }) { return <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}<span className="sr-only"> filter</span><select value={value} onChange={(event) => onChange(event.target.value)} className="admin-input mt-1.5 min-h-11 text-sm normal-case tracking-normal">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>; }
function EmptyQuery() { return <div className="flex min-h-80 flex-col items-center justify-center text-center"><SearchIcon size={42} className="mb-5 text-gray-600" /><h2 className="text-xl font-bold">Search for movies and series</h2><p className="mt-2 text-sm text-gray-500">Try a title, genre, language, or actor.</p></div>; }
function LoadingState() { return <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{Array.from({ length: 8 }).map((_, index) => <div key={index}><div className="aspect-2/3 animate-pulse rounded-xl bg-zinc-900" /><div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-zinc-900" /><div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-zinc-900" /></div>)}</div>; }
function ErrorState({ onRetry }) { return <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-white/10 text-center"><SearchIcon size={38} className="mb-4 text-gray-600" /><h2 className="text-xl font-bold">Unable to search content.</h2><p className="mt-2 text-sm text-gray-500">Check your connection and try again.</p><button type="button" onClick={onRetry} className="mt-5 min-h-11 rounded-lg bg-red-600 px-5 text-sm font-bold hover:bg-red-700">Retry</button></div>; }
function NoResults({ query, onClear }) { return <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-white/10 text-center"><SearchIcon size={38} className="mb-4 text-gray-600" /><h2 className="text-xl font-bold">No results found</h2><p className="mt-2 text-sm text-gray-500">No movies or series found for “{query}”.</p><button type="button" onClick={onClear} className="mt-5 min-h-11 rounded-lg border border-white/10 px-5 text-sm font-semibold hover:bg-white/5">Clear Search</button></div>; }

export default Search;