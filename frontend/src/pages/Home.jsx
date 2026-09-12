import { RefreshCw, Play, AlertCircle, Clapperboard } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Hero from "../components/Hero";
import MovieRow from "../components/MovieRow";
import { getMovies } from "../services/movieService";
import {
  getContinueWatching,
} from "../services/watchHistoryService";

function createdTime(item) {
  const time = new Date(
    item.createdAt || 0
  ).getTime();

  return Number.isFinite(time)
    ? time
    : 0;
}

function popularity(a, b) {
  return (
    Number(b.views || 0) -
      Number(a.views || 0) ||
    Number(b.rating || 0) -
      Number(a.rating || 0) ||
    createdTime(b) -
      createdTime(a)
  );
}

function Home() {
  const [content, setContent] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  const [continueWatching, setContinueWatching] =
    useState(() =>
      getContinueWatching()
    );

  const loadContent = async () => {
    setLoading(true);
    setError(false);

    try {
      const response =
        await getMovies();

      setContent(
        Array.isArray(
          response?.movies
        )
          ? response.movies.filter(
              (item) =>
                item?.published === true
            )
          : []
      );
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
        const response =
          await getMovies();

        if (active) {
          setContent(
            Array.isArray(
              response?.movies
            )
              ? response.movies.filter(
                  (item) =>
                    item?.published === true
                )
              : []
          );
        }
      } catch {
        if (active) {
          setContent([]);
          setError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchContent();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const syncContinueWatching = () => {
      try {
        const history = getContinueWatching();

        setContinueWatching(
          Array.isArray(history)
            ? history
            : []
        );
      } catch (error) {
        console.error(
          "Continue Watching sync error:",
          error
        );

        setContinueWatching([]);
      }
    };

    const handleHistoryUpdate = () => {
      syncContinueWatching();
    };

    const handleStorage = (event) => {
      if (
        event.key ===
        "errorcinema_watch_history"
      ) {
        syncContinueWatching();
      }
    };

    const handleFocus = () => {
      syncContinueWatching();
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        syncContinueWatching();
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

    window.addEventListener(
      "focus",
      handleFocus
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
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

      window.removeEventListener(
        "focus",
        handleFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  const movies = useMemo(
    () =>
      content.filter(
        (item) =>
          item.type === "movie"
      ),
    [content]
  );

  const series = useMemo(
    () =>
      content.filter(
        (item) =>
          item.type === "series"
      ),
    [content]
  );

  const latestMovies = useMemo(
    () =>
      [...movies].sort(
        (a, b) =>
          createdTime(b) -
            createdTime(a) ||
          Number(b.year || 0) -
            Number(a.year || 0)
      ),
    [movies]
  );

  const latestSeries = useMemo(
    () =>
      [...series].sort(
        (a, b) =>
          createdTime(b) -
            createdTime(a) ||
          Number(b.year || 0) -
            Number(a.year || 0)
      ),
    [series]
  );

  const popularMovies = useMemo(
    () =>
      [...movies].sort(popularity),
    [movies]
  );

  const popularSeries = useMemo(
    () =>
      [...series].sort(popularity),
    [series]
  );

  const trending = useMemo(
    () =>
      [...content].sort(popularity),
    [content]
  );

  const genreRows = useMemo(() => {
    const grouped = new Map();

    content.forEach((item) => {
      (item.genres || []).forEach(
        (genre) => {
          grouped.set(
            genre,
            [
              ...(grouped.get(
                genre
              ) || []),
              item,
            ]
          );
        }
      );
    });

    return [...grouped.entries()]
      .filter(
        ([, items]) =>
          items.length > 0
      )
      .sort(([a], [b]) =>
        a.localeCompare(b)
      );
  }, [content]);

  const languageRows = useMemo(() => {
    const grouped = new Map();

    content.forEach((item) => {
      if (item.language) {
        grouped.set(
          item.language,
          [
            ...(grouped.get(
              item.language
            ) || []),
            item,
          ]
        );
      }
    });

    return [...grouped.entries()]
      .filter(
        ([, items]) =>
          items.length >= 2
      )
      .sort(([a], [b]) =>
        a.localeCompare(b)
      );
  }, [content]);

  if (loading) {
    return <HomeSkeleton />;
  }

  if (error) {
    return (
      <HomeError
        onRetry={loadContent}
      />
    );
  }

  if (!content.length) {
    return <EmptyHome />;
  }

  const featured =
    content
      .filter(
        (item) => item.featured
      )
      .sort(
        (a, b) =>
          createdTime(b) -
          createdTime(a)
      )[0] ||
    trending[0];

  return (
    <main className="bg-black pb-16">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #18181b 0%, #27272a 50%, #18181b 100%);
          background-size: 800px 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        @keyframes ringPulse {
          0% { box-shadow: 0 0 0 0 rgba(229,9,20,0.55); }
          70% { box-shadow: 0 0 0 14px rgba(229,9,20,0); }
          100% { box-shadow: 0 0 0 0 rgba(229,9,20,0); }
        }
        .play-ring:hover { animation: ringPulse 1.1s ease-out; }
      `}</style>

      <Hero content={featured} />

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {continueWatching.length > 0 && (
          <ContinueWatchingRow
            items={continueWatching.slice(
              0,
              10
            )}
          />
        )}

        <MovieRow
          title="Trending"
          movies={trending.slice(
            0,
            10
          )}
          viewAllPath="/movies"
        />

        <MovieRow
          title="Latest Movies"
          movies={latestMovies.slice(
            0,
            10
          )}
          viewAllPath="/movies"
        />

        <MovieRow
          title="Latest Series"
          movies={latestSeries.slice(
            0,
            10
          )}
          viewAllPath="/tv-shows"
        />

        <MovieRow
          title="Popular Movies"
          movies={popularMovies.slice(
            0,
            10
          )}
          viewAllPath="/movies"
        />

        <MovieRow
          title="Popular Series"
          movies={popularSeries.slice(
            0,
            10
          )}
          viewAllPath="/tv-shows"
        />

        {genreRows.map(
          ([genre, items]) => (
            <MovieRow
              key={genre}
              title={genre}
              movies={items.slice(
                0,
                10
              )}
              viewAllPath={`/genres?genre=${encodeURIComponent(
                genre
              )}`}
            />
          )
        )}

        {languageRows.map(
          ([language, items]) => (
            <MovieRow
              key={language}
              title={`${language} Content`}
              movies={items.slice(
                0,
                10
              )}
              viewAllPath={`/search?q=${encodeURIComponent(
                language
              )}`}
            />
          )
        )}
      </div>
    </main>
  );
}

function ContinueWatchingRow({
  items,
}) {
  return (
    <section className="py-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-[#E50914]" />
          <div>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              Continue Watching
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Pick up where you left off
            </p>
          </div>
        </div>

        <Link
          to="/history"
          className="text-xs font-semibold text-zinc-400 transition hover:text-white"
        >
          View History
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-track]:bg-transparent">
        {items.map((item) => {
          const progress =
            Math.max(
              0,
              Math.min(
                100,
                Number(
                  item.progress
                ) || 0
              )
            );

          const isEpisode =
            item.seasonNumber !==
              null &&
            item.episodeNumber !==
              null;

          const watchPath =
            isEpisode
              ? `/watch/${item.movieId}?season=${item.seasonNumber}&episode=${item.episodeNumber}`
              : `/watch/${item.movieId}`;

          const detailsPath =
            `/movie/${item.movieId}`;

          return (
            <article
              key={`${item.movieId}-${item.seasonNumber ?? "movie"}-${item.episodeNumber ?? "movie"}`}
              className="group w-44 shrink-0 transition-transform duration-300 hover:-translate-y-1 sm:w-52"
            >
              <Link
                to={watchPath}
                className="relative block aspect-video overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/5 transition duration-300 group-hover:ring-white/20 group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
              >
                {item.backdrop ||
                item.poster ? (
                  <img
                    src={
                      item.backdrop ||
                      item.poster
                    }
                    alt={
                      item.title ||
                      "Movie"
                    }
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    onError={(
                      event
                    ) => {
                      if (
                        item.poster &&
                        event
                          .currentTarget
                          .src !==
                          item.poster
                      ) {
                        event.currentTarget.src =
                          item.poster;
                      } else {
                        event.currentTarget.style.display =
                          "none";
                      }
                    }}
                  />
                ) : null}

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="play-ring flex h-11 w-11 items-center justify-center rounded-full bg-[#E50914] shadow-xl transition duration-200 group-hover:scale-110">
                    <Play
                      size={18}
                      fill="currentColor"
                    />
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/15">
                  <div
                    className="h-full bg-[#E50914] shadow-[0_0_8px_rgba(229,9,20,0.7)]"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </Link>

              <Link
                to={detailsPath}
                className="mt-2 block truncate text-sm font-bold text-white transition hover:text-[#E50914]"
              >
                {item.title ||
                  "Untitled"}
              </Link>

              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span>
                  {isEpisode
                    ? `S${item.seasonNumber} E${item.episodeNumber}`
                    : item.type ===
                        "series"
                      ? "TV Series"
                      : "Movie"}
                </span>

                <span className="text-zinc-700">•</span>

                <span>
                  {progress}% watched
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function HomeSkeleton() {
  return (
    <main className="min-h-screen bg-black">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #18181b 0%, #27272a 50%, #18181b 100%);
          background-size: 800px 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
      `}</style>

      <div className="h-130 skeleton-shimmer" />

      <div className="mx-auto max-w-7xl space-y-10 px-5 py-10 md:px-8">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <section key={index}>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-6 w-1 rounded-full bg-zinc-800" />
              <div className="h-7 w-48 rounded skeleton-shimmer" />
            </div>

            <div className="flex gap-4 overflow-hidden">
              {Array.from({
                length: 6,
              }).map(
                (__, cardIndex) => (
                  <div
                    key={cardIndex}
                    className="h-64 w-40 shrink-0 rounded-xl skeleton-shimmer"
                  />
                )
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function HomeError({
  onRetry,
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#E50914]/10 ring-1 ring-[#E50914]/30">
          <AlertCircle size={28} className="text-[#E50914]" />
        </div>

        <h1 className="text-2xl font-black tracking-tight">
          Unable to load content.
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Check your connection
          and try again.
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#E50914] px-6 text-sm font-bold shadow-lg shadow-[#E50914]/25 transition hover:bg-[#f6121d] active:scale-95"
        >
          <RefreshCw size={17} />
          Retry
        </button>
      </div>
    </main>
  );
}

function EmptyHome() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 text-center text-white">
      <div>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-zinc-800">
          <Clapperboard size={28} className="text-zinc-500" />
        </div>

        <h1 className="text-2xl font-black tracking-tight">
          Content coming soon.
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Published movies and
          series will appear here.
        </p>
      </div>
    </main>
  );
}

export default Home;