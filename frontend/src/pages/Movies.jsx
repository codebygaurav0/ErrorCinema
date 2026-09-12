
import { useEffect, useMemo, useState } from "react";
import { Filter, LoaderCircle } from "lucide-react";
import MovieCard from "../components/MovieCard";
import { getMovies } from "../services/movieService";

function Movies() {
  const [movies, setMovies] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [sortBy, setSortBy] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMovies();

        setMovies(data.movies || []);
      } catch (err) {
        console.error("Failed to load movies:", err);
        setError("Unable to load movies. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  const genres = useMemo(() => {
    const allGenres = movies.flatMap((movie) => movie.genres || []);

    return ["All", ...new Set(allGenres)];
  }, [movies]);

  const languages = useMemo(() => {
    const allLanguages = movies
      .map((movie) => movie.language)
      .filter(Boolean);

    return ["All", ...new Set(allLanguages)];
  }, [movies]);

  const filteredMovies = useMemo(() => {
    const filtered = movies.filter((movie) => {
      const genreMatch =
        selectedGenre === "All" ||
        movie.genres?.includes(selectedGenre);

      const languageMatch =
        selectedLanguage === "All" ||
        movie.language === selectedLanguage;

      return genreMatch && languageMatch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "rating") {
        return Number(b.rating || 0) - Number(a.rating || 0);
      }

      if (sortBy === "az") {
        return a.title.localeCompare(b.title);
      }

      return Number(b.year || 0) - Number(a.year || 0);
    });
  }, [movies, selectedGenre, selectedLanguage, sortBy]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-5 pb-24 pt-28 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-red-500">
              ErrorCinema
            </p>

            <h1 className="text-3xl font-black sm:text-4xl">
              Movies
            </h1>
          </div>

          <div className="flex min-h-[350px] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <LoaderCircle
                size={35}
                className="animate-spin text-red-500"
              />

              <p className="text-sm">
                Loading movies...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black px-5 pb-24 pt-28 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-white/10 text-center">
            <Filter size={40} className="mb-4 text-gray-600" />

            <h2 className="text-xl font-bold">
              Unable to load movies
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 pb-24 pt-28 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-red-500">
            ErrorCinema
          </p>

          <h1 className="text-3xl font-black sm:text-4xl">
            Movies
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Browse our collection of movies.
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Genre
            </p>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {genres.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setSelectedGenre(genre)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedGenre === genre
                      ? "bg-red-600 text-white"
                      : "bg-zinc-900 text-gray-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Language
            </p>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {languages.map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => setSelectedLanguage(language)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedLanguage === language
                      ? "bg-red-600 text-white"
                      : "bg-zinc-900 text-gray-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500">
              {filteredMovies.length} movies
            </span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-white outline-none"
            >
              <option value="latest">Latest</option>
              <option value="rating">Top Rated</option>
              <option value="az">A-Z</option>
            </select>
          </div>
        </div>

        {filteredMovies.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-white/10 text-center">
            <Filter size={40} className="mb-4 text-gray-600" />

            <h2 className="text-xl font-bold">
              No movies found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Try changing your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie._id}
                movie={{
                  ...movie,
                  id: movie._id,
                  genre: movie.genres || [],
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default Movies;