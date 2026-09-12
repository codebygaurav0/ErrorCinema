import {
  ArrowLeft,
  Clock3,
  Play,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  clearWatchHistory,
  getWatchHistory,
  removeWatchHistory,
} from "../services/watchHistoryService";

const formatTime = (time) => {
  const seconds = Math.max(0, Math.floor(Number(time) || 0));

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

const getResumeUrl = (item) => {
  const baseUrl = `/watch/${item.movieId}`;

  if (
    item.seasonNumber !== null &&
    item.seasonNumber !== undefined &&
    item.episodeNumber !== null &&
    item.episodeNumber !== undefined
  ) {
    return `${baseUrl}?season=${item.seasonNumber}&episode=${item.episodeNumber}`;
  }

  return baseUrl;
};

function History() {
  const navigate = useNavigate();

  const [history, setHistory] = useState(() => {
    try {
      const savedHistory = getWatchHistory();

      return Array.isArray(savedHistory)
        ? savedHistory.filter(
            (item) =>
              item &&
              item.movieId &&
              item.title
          )
        : [];
    } catch (error) {
      console.error("History initial load error:", error);
      return [];
    }
  });

  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(() => {
    try {
      const savedHistory = getWatchHistory();

      const safeHistory = Array.isArray(savedHistory)
        ? savedHistory.filter(
            (item) =>
              item &&
              item.movieId &&
              item.title
          )
        : [];

      setHistory(safeHistory);
    } catch (error) {
      console.error("History load error:", error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleHistoryUpdate = () => {
      loadHistory();
    };

    const handleStorage = (event) => {
      if (event.key === "errorcinema_watch_history") {
        loadHistory();
      }
    };

    window.addEventListener(
      "errorcinema-history-updated",
      handleHistoryUpdate
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "errorcinema-history-updated",
        handleHistoryUpdate
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [loadHistory]);

  const handleRemove = (item) => {
    const updatedHistory = removeWatchHistory({
      movieId: item.movieId,
      seasonNumber: item.seasonNumber,
      episodeNumber: item.episodeNumber,
    });

    setHistory(
      Array.isArray(updatedHistory)
        ? updatedHistory
        : []
    );
  };

  const handleClearAll = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear your complete watch history?"
    );

    if (!confirmed) {
      return;
    }

    clearWatchHistory();
    setHistory([]);
  };

  const getProgress = (item) => {
    const progress = Number(item.progress);

    if (!Number.isFinite(progress)) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(0, progress)
    );
  };

  return (
    <main className="min-h-screen bg-black px-4 pb-28 pt-24 text-white sm:px-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <h1 className="text-3xl font-black sm:text-4xl">
              Watch History
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Continue watching from where you left off.
            </p>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              <Trash2 size={16} />
              Clear History
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
          </div>
        )}

        {/* Empty */}
        {!loading && history.length === 0 && (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-950 px-6 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900">
              <Clock3
                size={28}
                className="text-gray-500"
              />
            </div>

            <h2 className="text-xl font-bold">
              No Watch History
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
              Movies and episodes you start watching will
              appear here automatically.
            </p>

            <Link
              to="/movies"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-bold transition hover:bg-red-500"
            >
              <Play size={17} fill="currentColor" />
              Browse Movies
            </Link>
          </div>
        )}

        {/* History List */}
        {!loading && history.length > 0 && (
          <div className="space-y-4">
            {history.map((item, index) => {
              const progress = getProgress(item);
              const resumeUrl = getResumeUrl(item);

              return (
                <article
                  key={`${item.movieId}-${item.seasonNumber ?? "movie"}-${
                    item.episodeNumber ?? "movie"
                  }-${index}`}
                  className="group overflow-hidden rounded-xl border border-white/10 bg-zinc-950 transition hover:border-white/20"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Poster */}
                    <div className="relative h-52 w-full shrink-0 overflow-hidden bg-zinc-900 sm:h-36 sm:w-64">
                      {item.backdrop || item.poster ? (
                        <img
                          src={
                            item.backdrop ||
                            item.poster
                          }
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-600">
                          <Play size={30} />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                      <div className="absolute bottom-3 left-3 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold">
                        {progress}%
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-bold sm:text-xl">
                              {item.title}
                            </h2>

                            {item.seasonNumber !== null &&
                              item.seasonNumber !== undefined &&
                              item.episodeNumber !== null &&
                              item.episodeNumber !== undefined && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Season{" "}
                                  {item.seasonNumber}{" "}
                                  Â· Episode{" "}
                                  {item.episodeNumber}
                                </p>
                              )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleRemove(item)
                            }
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-white/10 hover:text-white"
                            aria-label={`Remove ${item.title} from history`}
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span>
                            Watched{" "}
                            {formatTime(
                              item.currentTime
                            )}
                          </span>

                          <span>â€¢</span>

                          <span>
                            Total{" "}
                            {formatTime(
                              item.duration
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Bottom */}
                      <div className="mt-5">
                        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-red-600 transition-all"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={resumeUrl}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold transition hover:bg-red-500"
                          >
                            <Play
                              size={16}
                              fill="currentColor"
                            />
                            Continue
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              handleRemove(item)
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white"
                          >
                            <Trash2 size={16} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default History;
