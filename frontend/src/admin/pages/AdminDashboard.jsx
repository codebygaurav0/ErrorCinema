import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  Film,
  FolderOpen,
  Plus,
  RefreshCw,
  Settings,
  Star,
  Users,
  Video,
  Eye,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../services/api";

function AdminDashboard() {
  const [movies, setMovies] = useState([]);
  const [usersCount, setUsersCount] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const getToken = () =>
    localStorage.getItem("errorcinema_admin_token");


  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const token = getToken();

        if (!token) {
          navigate("/admin/login");
          return;
        }

        const movieResponse = await api.get(
          "/movies/admin/all",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMovies(movieResponse.data.movies || []);

        try {
          const userResponse = await api.get(
            "/users",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const users =
            userResponse.data?.users ||
            userResponse.data?.data ||
            [];

          setUsersCount(
            Array.isArray(users)
              ? users.length
              : null
          );
        } catch {
          setUsersCount(null);
        }
      } catch (error) {
        console.error(
          "Dashboard loading error:",
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
            "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const stats = useMemo(() => {
    const movieItems = movies.filter(
      (item) => item.type !== "series"
    );

    const seriesItems = movies.filter(
      (item) => item.type === "series"
    );

    const published = movies.filter(
      (item) => item.published
    ).length;

    const drafts = movies.filter(
      (item) => !item.published
    ).length;

    const featured = movies.filter(
      (item) => item.featured
    ).length;

    const views = movies.reduce(
      (total, item) =>
        total + Number(item.views || 0),
      0
    );

    return {
      total: movies.length,
      movies: movieItems.length,
      series: seriesItems.length,
      published,
      drafts,
      featured,
      views,
    };
  }, [movies]);

  const recentContent = useMemo(() => {
    return [...movies]
      .sort((a, b) => {
        const dateA = new Date(
          a.createdAt || 0
        ).getTime();

        const dateB = new Date(
          b.createdAt || 0
        ).getTime();

        return (
          dateB - dateA ||
          Number(b.year || 0) -
            Number(a.year || 0)
        );
      })
      .slice(0, 6);
  }, [movies]);

  const topContent = useMemo(() => {
    return [...movies]
      .sort(
        (a, b) =>
          Number(b.views || 0) -
          Number(a.views || 0)
      )
      .slice(0, 5);
  }, [movies]);

  const formatViews = (views) => {
    const value = Number(views || 0);

    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }

    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }

    return value.toString();
  };

  const formatDate = (date) => {
    if (!date) return "Ã¢â‚¬â€";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Ã¢â‚¬â€";
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const statCards = [
    {
      title: "Total Content",
      value: stats.total,
      icon: Video,
      description: "Movies & series",
    },
    {
      title: "Movies",
      value: stats.movies,
      icon: Film,
      description: "Movie catalog",
    },
    {
      title: "Series",
      value: stats.series,
      icon: FolderOpen,
      description: "TV series",
    },
    {
      title: "Published",
      value: stats.published,
      icon: CheckCircle2,
      description: "Live content",
    },
    {
      title: "Drafts",
      value: stats.drafts,
      icon: Clock3,
      description: "Not published",
    },
    {
      title: "Featured",
      value: stats.featured,
      icon: Star,
      description: "Homepage featured",
    },
    {
      title: "Total Views",
      value: formatViews(stats.views),
      icon: Eye,
      description: "Across all content",
    },
    {
      title: "Users",
      value:
        usersCount === null
          ? "Ã¢â‚¬â€"
          : usersCount,
      icon: Users,
      description:
        usersCount === null
          ? "User API not connected"
          : "Registered users",
    },
  ];

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity
                size={20}
                className="text-red-500"
              />

              <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
                ErrorCinema Admin
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage your streaming
              platform.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/movies/add")
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold transition hover:bg-red-700"
            >
              <Plus size={17} />
              Add Movie
            </button>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-xl border border-white/10 bg-zinc-950 p-4 transition hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {card.title}
                    </p>

                    <p className="mt-2 text-2xl font-black sm:text-3xl">
                      {loading ? "Ã¢â‚¬â€" : card.value}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                    <Icon size={19} />
                  </div>
                </div>

                <p className="mt-2 text-xs text-gray-600">
                  {card.description}
                </p>
              </div>
            );
          })}
        </section>

        {/* Main Grid */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          {/* Recent Content */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="font-bold">
                  Recent Content
                </h2>

                <p className="mt-1 text-xs text-gray-600">
                  Latest additions to the catalog
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/movies")
                }
                className="text-xs font-semibold text-red-400 transition hover:text-red-300"
              >
                View All
              </button>
            </div>

            {loading ? (
              <div className="flex min-h-72 items-center justify-center text-sm text-gray-600">
                Loading content...
              </div>
            ) : recentContent.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
                <Film
                  size={40}
                  className="mb-3 text-gray-700"
                />

                <p className="font-semibold text-gray-500">
                  No content yet
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/admin/movies/add"
                    )
                  }
                  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold hover:bg-red-700"
                >
                  Add First Movie
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentContent.map((movie) => (
                  <div
                    key={movie._id}
                    className="flex items-center gap-3 px-5 py-4 transition hover:bg-white/[0.02]"
                  >
                    {movie.poster ? (
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="h-16 w-11 shrink-0 rounded-md object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-gray-700">
                        <Film size={18} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">
                          {movie.title}
                        </p>

                        {movie.featured && (
                          <Star
                            size={13}
                            className="shrink-0 text-yellow-400"
                            fill="currentColor"
                          />
                        )}
                      </div>

                      <p className="mt-1 text-xs text-gray-600">
                        {movie.type === "series"
                          ? "Series"
                          : "Movie"}{" "}
                        Ã¢â‚¬Â¢ {movie.year || "Ã¢â‚¬â€"} Ã¢â‚¬Â¢{" "}
                        {movie.language ||
                          "Unknown"}
                      </p>

                      <p className="mt-1 text-xs text-gray-700">
                        Added{" "}
                        {formatDate(
                          movie.createdAt
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          movie.published
                            ? "bg-green-500/10 text-green-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {movie.published
                          ? "Published"
                          : "Draft"}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/admin/movies/${movie._id}/edit`
                          )
                        }
                        className="text-xs text-gray-600 hover:text-white"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Content */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="font-bold">
                Top Content
              </h2>

              <p className="mt-1 text-xs text-gray-600">
                Most viewed movies and series
              </p>
            </div>

            {loading ? (
              <div className="flex min-h-72 items-center justify-center text-sm text-gray-600">
                Loading analytics...
              </div>
            ) : topContent.length === 0 ? (
              <div className="flex min-h-72 items-center justify-center px-5 text-sm text-gray-600">
                No viewing data available yet.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {topContent.map(
                  (movie, index) => (
                    <button
                      type="button"
                      key={movie._id}
                      onClick={() =>
                        navigate(
                          `/movie/${movie._id}`
                        )
                      }
                      className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-white/[0.02]"
                    >
                      <span className="w-5 text-sm font-black text-gray-700">
                        {index + 1}
                      </span>

                      {movie.poster ? (
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="h-12 w-9 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded bg-zinc-900 text-gray-700">
                          <Film size={15} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {movie.title}
                        </p>

                        <p className="mt-1 text-xs text-gray-600">
                          {movie.type === "series"
                            ? "Series"
                            : "Movie"}{" "}
                          Ã¢â‚¬Â¢{" "}
                          {movie.rating || "N/A"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Eye size={13} />
                        {formatViews(
                          movie.views
                        )}
                      </div>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-6">
          <div className="mb-4">
            <h2 className="font-bold">
              Quick Actions
            </h2>

            <p className="mt-1 text-xs text-gray-600">
              Common administration tasks
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() =>
                navigate("/admin/movies/add")
              }
              className="group rounded-xl border border-white/10 bg-zinc-950 p-5 text-left transition hover:border-red-500/30 hover:bg-red-500/[0.03]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition group-hover:bg-red-500/20">
                <Plus size={19} />
              </div>

              <p className="font-bold">
                Add Movie
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Add a new movie to your catalog.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/movies")
              }
              className="group rounded-xl border border-white/10 bg-zinc-950 p-5 text-left transition hover:border-blue-500/30 hover:bg-blue-500/[0.03]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Film size={19} />
              </div>

              <p className="font-bold">
                Manage Movies
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Edit, publish or delete content.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/series/add")
              }
              className="group rounded-xl border border-white/10 bg-zinc-950 p-5 text-left transition hover:border-purple-500/30 hover:bg-purple-500/[0.03]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                <Video size={19} />
              </div>

              <p className="font-bold">
                Add Series
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Create seasons and episodes.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                toast("Settings module coming next")
              }
              className="group rounded-xl border border-white/10 bg-zinc-950 p-5 text-left transition hover:border-white/20 hover:bg-white/[0.02]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-gray-400">
                <Settings size={19} />
              </div>

              <p className="font-bold">
                Settings
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Platform configuration.
              </p>
            </button>
          </div>
        </section>

        {/* Footer analytics summary */}
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <BarChart3 size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Catalog
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-400">
              {stats.movies} movies and{" "}
              {stats.series} series
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <CheckCircle2 size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Publishing
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-400">
              {stats.published} live Ã¢â‚¬Â¢{" "}
              {stats.drafts} drafts
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Eye size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Engagement
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-400">
              {formatViews(stats.views)} total
              views
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AdminDashboard;
