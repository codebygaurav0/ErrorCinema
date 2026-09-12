import {
  CheckCircle2,
  Edit,
  Eye,
  Film,
  Loader2,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../services/api";

function AdminMovies() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [deleteMovie, setDeleteMovie] = useState(null);

  const navigate = useNavigate();

  const getToken = () =>
    localStorage.getItem("errorcinema_admin_token");

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const token = getToken();

        if (!token) {
          navigate("/admin/login");
          return;
        }

        const response = await api.get("/movies/admin/all", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMovies(response.data.movies || []);
      } catch (error) {
        console.error("Failed to load movies:", error);

        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          localStorage.removeItem("errorcinema_admin_token");
          localStorage.removeItem("errorcinema_admin_user");
          navigate("/admin/login");
          return;
        }

        toast.error(
          error.response?.data?.message ||
            "Failed to load movies"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [navigate]);

  const handleToggle = async (movie, field) => {
    try {
      const token = getToken();

      if (!token) {
        navigate("/admin/login");
        return;
      }

      setActionId(`${field}-${movie._id}`);

      const newValue = !movie[field];

      const response = await api.put(
        `/movies/${movie._id}`,
        {
          [field]: newValue,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedMovie =
        response.data.movie || response.data;

      setMovies((prev) =>
        prev.map((item) =>
          item._id === movie._id
            ? {
                ...item,
                [field]:
                  updatedMovie[field] ?? newValue,
              }
            : item
        )
      );

      if (field === "published") {
        toast.success(
          newValue
            ? `"${movie.title}" published`
            : `"${movie.title}" moved to draft`
        );
      }

      if (field === "featured") {
        toast.success(
          newValue
            ? `"${movie.title}" added to Featured`
            : `"${movie.title}" removed from Featured`
        );
      }
    } catch (error) {
      console.error(
        `Failed to update ${field}:`,
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.removeItem(
          "errorcinema_admin_token"
        );
        localStorage.removeItem(
          "errorcinema_admin_user"
        );
        navigate("/admin/login");
        return;
      }

      toast.error(
        error.response?.data?.message ||
          `Failed to update ${field}`
      );
    } finally {
      setActionId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteMovie) return;

    try {
      const token = getToken();

      if (!token) {
        navigate("/admin/login");
        return;
      }

      setActionId(`delete-${deleteMovie._id}`);

      await api.delete(
        `/movies/${deleteMovie._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMovies((prev) =>
        prev.filter(
          (item) => item._id !== deleteMovie._id
        )
      );

      toast.success(
        `"${deleteMovie.title}" deleted successfully`
      );

      setDeleteMovie(null);
    } catch (error) {
      console.error("Delete movie error:", error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.removeItem(
          "errorcinema_admin_token"
        );
        localStorage.removeItem(
          "errorcinema_admin_user"
        );
        navigate("/admin/login");
        return;
      }

      toast.error(
        error.response?.data?.message ||
          "Failed to delete movie"
      );
    } finally {
      setActionId(null);
    }
  };

  const filteredMovies = movies.filter((movie) => {
    const searchValue = search
      .trim()
      .toLowerCase();

    const searchMatch =
      !searchValue ||
      movie.title
        ?.toLowerCase()
        .includes(searchValue) ||
      movie.language
        ?.toLowerCase()
        .includes(searchValue) ||
      movie.country
        ?.toLowerCase()
        .includes(searchValue);

    if (filter === "published") {
      return searchMatch && movie.published;
    }

    if (filter === "draft") {
      return searchMatch && !movie.published;
    }

    if (filter === "featured") {
      return searchMatch && movie.featured;
    }

    return searchMatch;
  });

  const publishedCount = movies.filter(
    (movie) => movie.published
  ).length;

  const draftCount = movies.filter(
    (movie) => !movie.published
  ).length;

  const featuredCount = movies.filter(
    (movie) => movie.featured
  ).length;

  return (
    <>
      <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">
                Movies
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your movie catalog.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/movies/add")
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold transition hover:bg-red-700"
            >
              <Plus size={18} />
              Add Movie
            </button>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Total
              </p>
              <p className="mt-1 text-2xl font-black">
                {movies.length}
              </p>
            </div>

            <div className="rounded-xl border border-green-500/10 bg-zinc-950 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Published
              </p>
              <p className="mt-1 text-2xl font-black text-green-400">
                {publishedCount}
              </p>
            </div>

            <div className="rounded-xl border border-yellow-500/10 bg-zinc-950 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Drafts
              </p>
              <p className="mt-1 text-2xl font-black text-yellow-400">
                {draftCount}
              </p>
            </div>

            <div className="rounded-xl border border-red-500/10 bg-zinc-950 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Featured
              </p>
              <p className="mt-1 text-2xl font-black text-red-400">
                {featuredCount}
              </p>
            </div>
          </div>

          {/* Search / Filter */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search title, language or country..."
                className="admin-input pl-10"
              />
            </div>

            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value)
              }
              className="admin-input sm:w-48"
            >
              <option value="all">
                All Movies
              </option>
              <option value="published">
                Published
              </option>
              <option value="draft">
                Drafts
              </option>
              <option value="featured">
                Featured
              </option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
            {loading ? (
              <div className="flex min-h-60 items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Loading movies...
              </div>
            ) : filteredMovies.length === 0 ? (
              <div className="flex min-h-60 flex-col items-center justify-center px-5 text-center">
                <Film
                  size={40}
                  className="mb-3 text-gray-700"
                />

                <p className="font-semibold text-gray-400">
                  No movies found
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Try another search or add a new movie.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px] text-left">
                  <thead className="border-b border-white/10 bg-zinc-900/70">
                    <tr>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Movie
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Year
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Rating
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Featured
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Views
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {filteredMovies.map((movie) => {
                      const publishing =
                        actionId ===
                        `published-${movie._id}`;

                      const featuring =
                        actionId ===
                        `featured-${movie._id}`;

                      const deleting =
                        actionId ===
                        `delete-${movie._id}`;

                      return (
                        <tr
                          key={movie._id}
                          className="transition hover:bg-white/[0.02]"
                        >
                          {/* Movie */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {movie.poster ? (
                                <img
                                  src={movie.poster}
                                  alt={movie.title}
                                  className="h-16 w-11 rounded-md object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display =
                                      "none";
                                  }}
                                />
                              ) : (
                                <div className="flex h-16 w-11 items-center justify-center rounded-md bg-zinc-900 text-gray-700">
                                  <Film size={18} />
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="max-w-[240px] truncate font-semibold text-white">
                                  {movie.title}
                                </p>

                                <p className="mt-1 text-xs text-gray-600">
                                  {movie.type === "series"
                                    ? "Series"
                                    : "Movie"}{" "}
                                  â€¢{" "}
                                  {movie.language ||
                                    "Unknown"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Year */}
                          <td className="px-5 py-4 text-sm text-gray-400">
                            {movie.year || "â€”"}
                          </td>

                          {/* Rating */}
                          <td className="px-5 py-4 text-sm text-gray-400">
                            {movie.rating ?? "â€”"}
                          </td>

                          {/* Publish */}
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              disabled={publishing}
                              onClick={() =>
                                handleToggle(
                                  movie,
                                  "published"
                                )
                              }
                              className={`inline-flex min-w-[105px] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                movie.published
                                  ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                  : "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                              }`}
                            >
                              {publishing ? (
                                <Loader2
                                  size={13}
                                  className="animate-spin"
                                />
                              ) : movie.published ? (
                                <CheckCircle2 size={13} />
                              ) : null}

                              {movie.published
                                ? "Published"
                                : "Draft"}
                            </button>
                          </td>

                          {/* Featured */}
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              disabled={featuring}
                              onClick={() =>
                                handleToggle(
                                  movie,
                                  "featured"
                                )
                              }
                              className={`inline-flex min-w-[100px] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                movie.featured
                                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                  : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                              }`}
                            >
                              {featuring ? (
                                <Loader2
                                  size={13}
                                  className="animate-spin"
                                />
                              ) : (
                                <Star
                                  size={13}
                                  fill={
                                    movie.featured
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              )}

                              {movie.featured
                                ? "Featured"
                                : "Feature"}
                            </button>
                          </td>

                          {/* Views */}
                          <td className="px-5 py-4 text-sm text-gray-400">
                            {movie.views || 0}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/movie/${movie._id}`
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-green-500/30 hover:bg-green-500/10 hover:text-green-400"
                                aria-label={`View ${movie.title}`}
                                title="View movie"
                              >
                                <Eye size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/admin/movies/${movie._id}/edit`
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
                                aria-label={`Edit ${movie.title}`}
                                title="Edit movie"
                              >
                                <Edit size={16} />
                              </button>

                              <button
                                type="button"
                                disabled={deleting}
                                onClick={() =>
                                  setDeleteMovie(movie)
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                                aria-label={`Delete ${movie.title}`}
                                title="Delete movie"
                              >
                                {deleting ? (
                                  <Loader2
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-gray-600">
            Showing {filteredMovies.length} of{" "}
            {movies.length} movies
          </p>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteMovie && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteMovie(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                  <Trash2 size={21} />
                </div>

                <h2 className="text-xl font-black">
                  Delete Movie?
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-300">
                    "{deleteMovie.title}"
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDeleteMovie(null)
                }
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setDeleteMovie(null)
                }
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={
                  actionId ===
                  `delete-${deleteMovie._id}`
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionId ===
                `delete-${deleteMovie._id}` ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 size={16} />
                )}

                Delete Movie
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminMovies;
