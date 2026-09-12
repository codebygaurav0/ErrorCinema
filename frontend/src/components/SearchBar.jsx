import { Search as SearchIcon } from "lucide-react";

function SearchBar({ value = "", onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="flex w-full items-center gap-2">
      <div className="flex min-h-12 min-w-0 flex-1 items-center rounded-lg border border-white/10 bg-zinc-900 px-3 focus-within:border-red-500">
        <SearchIcon size={19} className="mr-3 shrink-0 text-gray-500" />
        <label htmlFor="search-query" className="sr-only">Search content</label>
        <input
          id="search-query"
          name="search"
          type="search"
          value={value}
          onChange={onChange}
          placeholder="Search movies, series, genres..."
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
        />
      </div>
      <button type="submit" className="flex min-h-12 shrink-0 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400" aria-label="Submit search">
        <SearchIcon size={18} />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}

export default SearchBar;