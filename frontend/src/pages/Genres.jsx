import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  LoaderCircle,
  RotateCcw,
  X,
} from "lucide-react";
import MovieCard from "../components/MovieCard";
import { getMovies } from "../services/movieService";

function Genres() {
  const [movies, setMovies] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(
    () =>
      new URLSearchParams(window.location.search).get("genre") || ""
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMovies = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMovies();

      const publishedMovies = Array.isArray(data?.movies)
        ? data.movies.filter(
            (movie) => movie?.published === true
          )
        : [];

      setMovies(publishedMovies);
    } catch (err) {
      console.error("Failed to load genres:", err);
      setError("Unable to load genres. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMovies();

        const publishedMovies = Array.isArray(data?.movies)
          ? data.movies.filter(
              (movie) => movie?.published === true
            )
          : [];

        if (!cancelled) {
          setMovies(publishedMovies);
        }
      } catch (err) {
        console.error("Failed to load genres:", err);

        if (!cancelled) {
          setError(
            "Unable to load genres. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMovies();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(
        window.location.search
      );

      setSelectedGenre(params.get("genre") || "");
    };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  const genres = useMemo(() => {
    const genreMap = new Map();

    movies.forEach((movie) => {
      if (!Array.isArray(movie?.genres)) {
        return;
      }

      movie.genres.forEach((genre) => {
        if (typeof genre !== "string") {
          return;
        }

        const cleanGenre = genre.trim();

        if (!cleanGenre) {
          return;
        }

        const key = cleanGenre.toLowerCase();

        if (!genreMap.has(key)) {
          genreMap.set(key, cleanGenre);
        }
      });
    });

    return [...genreMap.values()].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [movies]);

  const normalizedSelectedGenre =
    selectedGenre.trim().toLowerCase();

  const filteredMovies = useMemo(() => {
    if (!normalizedSelectedGenre) {
      return [];
    }

    return movies.filter((movie) =>
      Array.isArray(movie?.genres)
        ? movie.genres.some(
            (genre) =>
              typeof genre === "string" &&
              genre.trim().toLowerCase() ===
                normalizedSelectedGenre
          )
        : false
    );
  }, [movies, normalizedSelectedGenre]);

  const updateGenre = (genre) => {
    const nextGenre =
      selectedGenre.toLowerCase() ===
      genre.toLowerCase()
        ? ""
        : genre;

    setSelectedGenre(nextGenre);

    const params = new URLSearchParams(
      window.location.search
    );

    if (nextGenre) {
      params.set("genre", nextGenre);
    } else {
      params.delete("genre");
    }

    const query = params.toString();

    const nextUrl = query
      ? `/genres?${query}`
      : "/genres";

    window.history.pushState(
      {},
      "",
      nextUrl
    );
  };

  const clearGenre = () => {
    setSelectedGenre("");

    const params = new URLSearchParams(
      window.location.search
    );

    params.delete("genre");

    const query = params.toString();

    window.history.pushState(
      {},
      "",
      query ? `/genres?${query}` : "/genres"
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-5 pb-24 pt-28 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-red-500">
              ErrorCinema
            </p>

            <h1 className="text-3xl font-black sm:text-4xl">
              Genres
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Explore movies and shows by genre.
            </p>
          </div>

          <div className="flex min-h-87.5 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <LoaderCircle
                size={35}
                className="animate-spin text-red-500"
              />

              <p className="text-sm">
                Loading genres...
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
          <div className="flex min-h-87.5 flex-col items-center justify-center rounded-xl border border-white/10 px-5 text-center">
            <Filter
              size={40}
              className="mb-4 text-gray-600"
            />

            <h2 className="text-xl font-bold">
              Unable to load genres
            </h2>

            <p className="mt-2 max-w-md text-sm text-gray-500">
              {error}
            </p>

            <button
              type="button"
              onClick={loadMovies}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
            >
              <RotateCcw size={16} />
              Retry
            </button>
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
            Genres
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Explore movies and shows by genre.
          </p>
        </div>

        {genres.length === 0 ? (
          <div className="flex min-h-75 flex-col items-center justify-center rounded-xl border border-white/10 px-5 text-center">
            <Filter
              size={40}
              className="mb-4 text-gray-600"
            />

            <h2 className="text-xl font-bold">
              No genres available
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Genres will appear when published content
              is added.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-10 flex flex-wrap gap-3">
              {genres.map((genre) => {
                const active =
                  selectedGenre.toLowerCase() ===
                  genre.toLowerCase();

                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() =>
                      updateGenre(genre)
                    }
                    aria-pressed={active}
                    className={`rounded-full px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black ${
                      active
                        ? "bg-red-600 text-white"
                        : "bg-zinc-900 text-gray-400 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>

            {selectedGenre ? (
              <section>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
                      Genre
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      {selectedGenre}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Movies and shows available in this
                      genre.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {filteredMovies.length}{" "}
                      {filteredMovies.length === 1
                        ? "result"
                        : "results"}
                    </span>

                    <button
                      type="button"
                      onClick={clearGenre}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <X size={14} />
                      Clear
                    </button>
                  </div>
                </div>

                {filteredMovies.length === 0 ? (
                  <div className="flex min-h-62.5 flex-col items-center justify-center rounded-xl border border-white/10 px-5 text-center">
                    <Filter
                      size={36}
                      className="mb-3 text-gray-600"
                    />

                    <h3 className="text-lg font-bold">
                      No content found
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      There is no published content available
                      in this genre.
                    </p>

                    <button
                      type="button"
                      onClick={clearGenre}
                      className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
                    >
                      View All Genres
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {filteredMovies.map((movie) => (
                      <MovieCard
                        key={movie._id}
                        movie={{
                          ...movie,
                          id: movie._id,
                          genre: Array.isArray(
                            movie.genres
                          )
                            ? movie.genres
                            : [],
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <div className="rounded-xl border border-white/10 bg-zinc-950 px-5 py-10 text-center">
                <Filter
                  size={36}
                  className="mx-auto mb-3 text-gray-600"
                />

                <h2 className="text-xl font-bold">
                  Select a genre
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Choose a genre above to explore matching
                  movies and series.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default Genres;