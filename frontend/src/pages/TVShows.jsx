import { useEffect, useMemo, useState } from "react";
import { Filter, LoaderCircle, RefreshCw, Tv } from "lucide-react";
import MovieCard from "../components/MovieCard";
import { getMovies } from "../services/movieService";

function TVShows() {
  const [shows, setShows] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [sortBy, setSortBy] = useState("rating");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchShows = async () => {
      try {
        const data = await getMovies();

        if (!active) return;

        const series = (data.movies || []).filter(
          (item) => item.type === "series"
        );

        setShows(series);
      } catch (err) {
        console.error("Failed to load TV shows:", err);

        if (active) {
          setError("Unable to load TV shows. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchShows();

    return () => {
      active = false;
    };
  }, []);

  const refreshShows = async () => {
    try {
      setRefreshing(true);
      setError("");

      const data = await getMovies();

      const series = (data.movies || []).filter(
        (item) => item.type === "series"
      );

      setShows(series);
    } catch (err) {
      console.error("Failed to refresh TV shows:", err);
      setError("Unable to refresh TV shows. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const genres = useMemo(() => {
    const allGenres = shows.flatMap((show) => show.genres || []);

    return ["All", ...new Set(allGenres)];
  }, [shows]);

  const filteredShows = useMemo(() => {
    const filtered = shows.filter((show) => {
      return (
        selectedGenre === "All" ||
        show.genres?.includes(selectedGenre)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "latest") {
        return Number(b.year || 0) - Number(a.year || 0);
      }

      if (sortBy === "az") {
        return (a.title || "").localeCompare(b.title || "");
      }

      return Number(b.rating || 0) - Number(a.rating || 0);
    });
  }, [shows, selectedGenre, sortBy]);

  const totalEpisodes = useMemo(() => {
    return shows.reduce((total, show) => {
      const seasons = show.seasons || [];

      return (
        total +
        seasons.reduce(
          (seasonTotal, season) =>
            seasonTotal + (season.episodes?.length || 0),
          0
        )
      );
    }, 0);
  }, [shows]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-5 pb-24 pt-28 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-red-500">
              ErrorCinema
            </p>

            <h1 className="text-3xl font-black sm:text-4xl">
              TV Shows
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Browse our collection of TV shows and series.
            </p>
          </div>

          <div className="flex min-h-[350px] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <LoaderCircle
                size={35}
                className="animate-spin text-red-500"
              />

              <p className="text-sm">Loading TV shows...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && shows.length === 0) {
    return (
      <main className="min-h-screen bg-black px-5 pb-24 pt-28 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-white/10 px-5 text-center">
            <Filter size={40} className="mb-4 text-gray-600" />

            <h2 className="text-xl font-bold">
              Unable to load TV shows
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {error}
            </p>

            <button
              type="button"
              onClick={refreshShows}
              disabled={refreshing}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 pb-24 pt-28 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-red-500">
              ErrorCinema
            </p>

            <h1 className="text-3xl font-black sm:text-4xl">
              TV Shows
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Browse our collection of TV shows and series.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshShows}
            disabled={refreshing}
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-white/10 bg-zinc-900 px-4 text-sm font-semibold text-gray-300 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-300">
            {error}
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Tv size={17} />
              <span className="text-xs uppercase tracking-wide">
                Series
              </span>
            </div>

            <p className="mt-2 text-2xl font-black">
              {shows.length}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Episodes
            </p>

            <p className="mt-2 text-2xl font-black">
              {totalEpisodes}
            </p>
          </div>

          <div className="hidden rounded-xl border border-white/10 bg-zinc-900 p-4 sm:block">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Showing
            </p>

            <p className="mt-2 text-2xl font-black">
              {filteredShows.length}
            </p>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-5">
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

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500">
              {filteredShows.length}{" "}
              {filteredShows.length === 1 ? "show" : "shows"}
            </span>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-white outline-none focus:border-red-500"
              aria-label="Sort TV shows"
            >
              <option value="rating">Top Rated</option>
              <option value="latest">Latest</option>
              <option value="az">A-Z</option>
            </select>
          </div>
        </div>

        {filteredShows.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-white/10 px-5 text-center">
            <Filter size={40} className="mb-4 text-gray-600" />

            <h2 className="text-xl font-bold">
              No TV shows available
            </h2>

            <p className="mt-2 max-w-md text-sm text-gray-500">
              Published TV series added from the admin panel will
              appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredShows.map((show) => (
              <MovieCard
                key={show._id}
                movie={{
                  ...show,
                  id: show._id,
                  genre: show.genres || [],
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default TVShows;
