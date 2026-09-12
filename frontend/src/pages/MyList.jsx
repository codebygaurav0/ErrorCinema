import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Trash2,
  Play,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import MovieCard from "../components/MovieCard";
import { useAuth } from "../context/useAuth";

import {
  getMyList,
  removeFromMyList,
} from "../services/myListService";

function MyList() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] =
    useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !user) {
      return undefined;
    }

    let mounted = true;

    const loadMyList = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMyList();

        if (mounted) {
          setMovies(data?.movies || []);
        }
      } catch (err) {
        console.error(
          "My List error:",
          err
        );

        if (mounted) {
          setError(
            err.response?.data?.message ||
              "Unable to load your My List."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMyList();

    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  const handleRemove = async (movieId) => {
    try {
      setRemovingId(movieId);

      await removeFromMyList(movieId);

      setMovies((current) =>
        current.filter(
          (movie) =>
            movie._id !== movieId
        )
      );

      toast.success(
        "Removed from My List"
      );
    } catch (err) {
      console.error(
        "Remove My List error:",
        err
      );

      toast.error(
        err.response?.data?.message ||
          "Unable to remove from My List"
      );
    } finally {
      setRemovingId(null);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-black px-4 pb-24 pt-28 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2
            className="animate-spin text-red-500"
            size={36}
          />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black px-4 pb-24 pt-28 sm:px-6">
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
            <Heart
              size={38}
              className="text-red-500"
            />
          </div>

          <h1 className="text-2xl font-bold sm:text-3xl">
            Your My List
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400 sm:text-base">
            Sign in to save movies and
            series to your personal list.
          </p>

          <Link
            to="/login"
            className="mt-7 inline-flex items-center rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold transition hover:bg-red-500"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-4 pb-24 pt-28 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2
            className="animate-spin text-red-500"
            size={36}
          />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black px-4 pb-24 pt-28 sm:px-6">
        <div className="mx-auto max-w-xl py-24 text-center">
          <h1 className="text-xl font-bold">
            Something went wrong
          </h1>

          <p className="mt-3 text-sm text-zinc-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold hover:bg-red-500"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 pb-24 pt-28 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-3">
          <Heart
            className="fill-red-500 text-red-500"
            size={28}
          />

          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              My List
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              {movies.length}{" "}
              {movies.length === 1
                ? "title"
                : "titles"}{" "}
              saved
            </p>
          </div>
        </div>

        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-950 px-6 py-20 text-center">
            <Heart
              size={42}
              className="text-zinc-700"
            />

            <h2 className="mt-5 text-xl font-semibold">
              Your list is empty
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Add movies and series you
              want to watch later.
            </p>

            <Link
              to="/movies"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold hover:bg-red-500"
            >
              <Play size={17} />
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {movies.map((movie) => (
              <div
                key={movie._id}
                className="group relative"
              >
                <MovieCard movie={movie} />

                <button
                  type="button"
                  disabled={
                    removingId ===
                    movie._id
                  }
                  onClick={() =>
                    handleRemove(
                      movie._id
                    )
                  }
                  className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/80 text-white opacity-100 backdrop-blur transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Remove from My List"
                  aria-label="Remove from My List"
                >
                  {removingId ===
                  movie._id ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={17} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default MyList;
