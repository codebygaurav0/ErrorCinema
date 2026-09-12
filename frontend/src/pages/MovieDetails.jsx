import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Heart,
  Loader2,
  Play,
  Share2,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import MovieRow from "../components/MovieRow";
import { getMovieById, getMovies } from "../services/movieService";
import { useAuth } from "../context/useAuth";
import {
  addToMyList,
  checkMyList,
  removeFromMyList,
} from "../services/myListService";

function sortedSeasons(movie) {
  return (Array.isArray(movie?.seasons) ? movie.seasons : [])
    .map((season) => ({
      ...season,
      episodes: (Array.isArray(season.episodes) ? season.episodes : [])
        .filter((episode) => episode?.published === true)
        .sort(
          (a, b) =>
            Number(a.episodeNumber || 0) -
            Number(b.episodeNumber || 0)
        ),
    }))
    .sort(
      (a, b) =>
        Number(a.seasonNumber || 0) -
        Number(b.seasonNumber || 0)
    );
}

function playableSource(sources) {
  return (Array.isArray(sources) ? sources : []).find(
    (source) => source?.url?.trim()
  );
}

function firstPlayableEpisode(movie) {
  for (const season of sortedSeasons(movie)) {
    for (const episode of season.episodes) {
      if (playableSource(episode.videoSources)) {
        return { season, episode };
      }
    }
  }

  return null;
}

async function loadMovieAndRecommendations(id) {
  const [detailsResult, listResult] = await Promise.allSettled([
    getMovieById(id),
    getMovies(),
  ]);

  if (detailsResult.status === "rejected") {
    throw detailsResult.reason;
  }

  return {
    detailsResponse: detailsResult.value,
    moviesResponse:
      listResult.status === "fulfilled"
        ? listResult.value
        : { movies: [] },
  };
}

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [inMyList, setInMyList] = useState(false);
  const [myListLoading, setMyListLoading] = useState(false);
  const [myListChecking, setMyListChecking] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    setError("");
    setNotFound(false);

    try {
      const { detailsResponse, moviesResponse } =
        await loadMovieAndRecommendations(id);

      const nextMovie = detailsResponse?.movie;

      if (!nextMovie || nextMovie.published !== true) {
        setMovie(null);
        setNotFound(true);
        return;
      }

      setMovie(nextMovie);

      const publicContent = Array.isArray(
        moviesResponse?.movies
      )
        ? moviesResponse.movies.filter(
            (item) => item?.published === true
          )
        : [];

      const genres = Array.isArray(nextMovie.genres)
        ? nextMovie.genres
        : [];

      const recommendations = publicContent
        .filter(
          (item) =>
            String(item._id) !==
            String(nextMovie._id)
        )
        .map((item) => ({
          item,
          score:
            (item.type === nextMovie.type ? 2 : 0) +
            (item.language &&
            item.language === nextMovie.language
              ? 1
              : 0) +
            (item.genres || []).filter((genre) =>
              genres.includes(genre)
            ).length,
        }))
        .filter(({ score }) => score > 0)
        .sort(
          (a, b) =>
            b.score - a.score ||
            Number(b.item.views || 0) -
              Number(a.item.views || 0)
        )
        .slice(0, 10)
        .map(({ item }) => item);

      setSimilar(recommendations);
    } catch (requestError) {
      if (
        requestError.response?.status === 404 ||
        requestError.response?.status === 400
      ) {
        setNotFound(true);
      } else {
        setError(
          "Unable to load movie details."
        );
      }

      setMovie(null);
      setSimilar([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchDetails = async () => {
      try {
        const { detailsResponse, moviesResponse } =
          await loadMovieAndRecommendations(id);

        const nextMovie =
          detailsResponse?.movie;

        if (!active) return;

        if (
          !nextMovie ||
          nextMovie.published !== true
        ) {
          setNotFound(true);
          setMovie(null);
          return;
        }

        setMovie(nextMovie);

        const publicContent =
          Array.isArray(
            moviesResponse?.movies
          )
            ? moviesResponse.movies.filter(
                (item) =>
                  item?.published === true
              )
            : [];

        const genres = Array.isArray(
          nextMovie.genres
        )
          ? nextMovie.genres
          : [];

        setSimilar(
          publicContent
            .filter(
              (item) =>
                String(item._id) !==
                String(nextMovie._id)
            )
            .map((item) => ({
              item,
              score:
                (item.type ===
                nextMovie.type
                  ? 2
                  : 0) +
                (item.language ===
                nextMovie.language
                  ? 1
                  : 0) +
                (item.genres || []).filter(
                  (genre) =>
                    genres.includes(
                      genre
                    )
                ).length,
            }))
            .filter(
              ({ score }) =>
                score > 0
            )
            .sort(
              (a, b) =>
                b.score - a.score ||
                Number(
                  b.item.views || 0
                ) -
                  Number(
                    a.item.views || 0
                  )
            )
            .slice(0, 10)
            .map(
              ({ item }) => item
            )
        );
      } catch (requestError) {
        if (!active) return;

        setMovie(null);

        if (
          requestError.response?.status ===
            404 ||
          requestError.response?.status ===
            400
        ) {
          setNotFound(true);
        } else {
          setError(
            "Unable to load movie details."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user || !id) {
      return undefined;
    }

    let active = true;

    const checkListStatus = async () => {
      try {
        setMyListChecking(true);

        const data =
          await checkMyList(id);

        if (active) {
          setInMyList(
            Boolean(data?.inMyList)
          );
        }
      } catch (checkError) {
        console.error(
          "My List status error:",
          checkError
        );

        if (active) {
          setInMyList(false);
        }
      } finally {
        if (active) {
          setMyListChecking(false);
        }
      }
    };

    checkListStatus();

    return () => {
      active = false;
    };
  }, [id, user]);

  const handleMyList = async () => {
    if (!user) {
      navigate(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`
      );
      return;
    }

    if (myListLoading) return;

    try {
      setMyListLoading(true);

      if (inMyList) {
        await removeFromMyList(id);
        setInMyList(false);
        toast.success(
          "Removed from My List"
        );
      } else {
        await addToMyList(id);
        setInMyList(true);
        toast.success(
          "Added to My List"
        );
      }
    } catch (listError) {
      console.error(
        "My List action error:",
        listError
      );

      const status =
        listError.response?.status;

      if (status === 401) {
        toast.error(
          "Please sign in first."
        );

        navigate(
          `/login?redirect=${encodeURIComponent(
            window.location.pathname
          )}`
        );
      } else if (status === 409) {
        setInMyList(true);
        toast.success(
          "Already in My List"
        );
      } else {
        toast.error(
          listError.response?.data
            ?.message ||
            "Unable to update My List"
        );
      }
    } finally {
      setMyListLoading(false);
    }
  };

  if (loading) {
    return <DetailsSkeleton />;
  }

  if (error) {
    return (
      <DetailsError
        message={error}
        onRetry={loadDetails}
      />
    );
  }

  if (notFound || !movie) {
    return <NotFoundDetails />;
  }

  const seasons =
    sortedSeasons(movie);

  const isSeries =
    movie.type === "series" ||
    seasons.length > 0;

  const activeSeasonIndex = Math.min(
    selectedSeason,
    Math.max(0, seasons.length - 1)
  );

  const movieSource =
    playableSource(
      movie.videoSources
    );

  const firstEpisode =
    firstPlayableEpisode(movie);

  const hasRating =
    movie.rating !== null &&
    movie.rating !== undefined &&
    Number(movie.rating) > 0;

  const watchNow = () => {
    if (!isSeries && movieSource) {
      navigate(
        `/watch/${movie._id}`
      );
      return;
    }

    if (isSeries && firstEpisode) {
      navigate(
        `/watch/${movie._id}?season=${firstEpisode.season.seasonNumber}&episode=${firstEpisode.episode.episodeNumber}`
      );
      return;
    }

    toast.error(
      isSeries
        ? "No playable episode is currently available."
        : "No playable video is currently available."
    );
  };

  return (
    <main className="min-h-screen bg-black pb-24 text-white">
      <section className="relative min-h-140 overflow-hidden sm:min-h-162.5">
        <div className="absolute inset-0 bg-zinc-950">
          <img
            src={
              movie.backdrop ||
              movie.poster
            }
            alt=""
            className="h-full w-full object-cover"
            onError={(event) => {
              if (
                movie.poster &&
                event.currentTarget
                  .src !== movie.poster
              ) {
                event.currentTarget.src =
                  movie.poster;
              } else {
                event.currentTarget.style.display =
                  "none";
              }
            }}
          />
        </div>

        <div className="absolute inset-0 bg-linear-to-t from-black via-black/75 to-black/20" />

        <div className="absolute inset-0 bg-linear-to-r from-black/95 via-black/50 to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-140 max-w-7xl items-end px-5 pb-12 pt-28 sm:min-h-162.5 md:px-8 md:pb-16">
          <div className="max-w-3xl">
            <button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              className="mb-7 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm text-gray-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <ArrowLeft size={18} />
              Back
            </button>

            <div className="mb-4 flex flex-wrap gap-2">
              <Badge>
                {isSeries
                  ? "TV SERIES"
                  : "MOVIE"}
              </Badge>

              {movie.certification && (
                <Badge>
                  {movie.certification}
                </Badge>
              )}

              {(movie.genres || []).map(
                (genre) => (
                  <button
                    type="button"
                    key={genre}
                    onClick={() =>
                      navigate(
                        `/genres?genre=${encodeURIComponent(
                          genre
                        )}`
                      )
                    }
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md hover:bg-white/20"
                  >
                    {genre}
                  </button>
                )
              )}
            </div>

            <h1 className="wrap-break-word text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
              {movie.title}
            </h1>

            <Meta
              movie={movie}
              hasRating={hasRating}
            />

            <p className="mt-6 max-w-2xl line-clamp-4 text-sm leading-7 text-gray-300 sm:text-base">
              {movie.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={watchNow}
                disabled={
                  !movieSource &&
                  !firstEpisode
                }
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play
                  size={18}
                  fill="currentColor"
                />
                Watch Now
              </button>

              <button
                type="button"
                onClick={
                  handleMyList
                }
                disabled={
                  myListLoading ||
                  myListChecking
                }
                className={`inline-flex min-h-12 items-center gap-2 rounded-lg px-6 py-3 text-sm font-bold backdrop-blur-md transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  inMyList
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {myListLoading ||
                myListChecking ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Heart
                    size={18}
                    fill={
                      inMyList
                        ? "currentColor"
                        : "none"
                    }
                  />
                )}

                {inMyList
                  ? "In My List"
                  : "Add to My List"}
              </button>

              <button
                type="button"
                onClick={() =>
                  navigator.clipboard
                    ?.writeText(
                      window.location.href
                    )
                    .then(() =>
                      toast.success(
                        "Movie link copied"
                      )
                    )
                    .catch(() =>
                      toast.error(
                        "Unable to copy link"
                      )
                    )
                }
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-sm font-bold backdrop-blur-md hover:bg-white/20"
              >
                <Share2 size={18} />
                Share
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <div>
            <img
              src={movie.poster}
              alt={`${movie.title} poster`}
              loading="eager"
              className="mx-auto aspect-2/3 w-full max-w-xs rounded-xl object-cover shadow-2xl lg:mx-0"
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              About {movie.title}
            </h2>

            {movie.description && (
              <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-400">
                {movie.description}
              </p>
            )}

            <InfoGrid
              movie={movie}
              isSeries={isSeries}
              seasons={seasons}
              hasRating={hasRating}
            />

            {movie.director && (
              <div className="mt-8">
                <h3 className="text-lg font-bold">
                  Director
                </h3>

                <p className="mt-3 text-sm text-gray-300">
                  {movie.director}
                </p>
              </div>
            )}

            {movie.cast?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold">
                  Cast
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {movie.cast.map(
                    (person) => (
                      <span
                        key={person}
                        className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-gray-300"
                      >
                        {person}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {movie.trailer && (
          <div className="mt-12 rounded-xl border border-white/10 bg-zinc-950 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  Trailer
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Authorized trailer source
                </p>
              </div>

              <a
                href={movie.trailer}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-semibold hover:bg-white/20"
              >
                Open Trailer
                <ExternalLink
                  size={16}
                />
              </a>
            </div>
          </div>
        )}

        {isSeries &&
          seasons.length > 0 && (
            <SeriesEpisodes
              movie={movie}
              seasons={seasons}
              selectedSeason={
                activeSeasonIndex
              }
              setSelectedSeason={
                setSelectedSeason
              }
              navigate={navigate}
            />
          )}

        {movie.subtitles?.length >
          0 && (
          <SubtitleInfo
            subtitles={
              movie.subtitles
            }
          />
        )}

        {similar.length > 0 && (
          <MovieRow
            title="More Like This"
            movies={similar}
            viewAllPath={
              isSeries
                ? "/tv-shows"
                : "/movies"
            }
          />
        )}
      </section>
    </main>
  );
}

function Badge({ children }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
      {children}
    </span>
  );
}

function Meta({
  movie,
  hasRating,
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-300">
      {hasRating && (
        <span className="flex items-center gap-1 text-yellow-400">
          <Star
            size={16}
            fill="currentColor"
          />
          {movie.rating}
        </span>
      )}

      {movie.year && (
        <span className="flex items-center gap-1">
          <Calendar size={16} />
          {movie.year}
        </span>
      )}

      {movie.duration && (
        <span className="flex items-center gap-1">
          <Clock size={16} />
          {movie.duration}
        </span>
      )}

      {movie.language && (
        <span>{movie.language}</span>
      )}

      {movie.country && (
        <span>{movie.country}</span>
      )}
    </div>
  );
}

function InfoGrid({
  movie,
  isSeries,
  seasons,
  hasRating,
}) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {hasRating && (
        <Info
          label="Rating"
          value={`${movie.rating}/10`}
        />
      )}

      {movie.year && (
        <Info
          label="Year"
          value={movie.year}
        />
      )}

      {movie.duration && (
        <Info
          label="Duration"
          value={movie.duration}
        />
      )}

      {movie.language && (
        <Info
          label="Language"
          value={movie.language}
        />
      )}

      {movie.country && (
        <Info
          label="Country"
          value={movie.country}
        />
      )}

      {movie.certification && (
        <Info
          label="Certification"
          value={movie.certification}
        />
      )}

      <Info
        label="Type"
        value={
          isSeries
            ? "TV Series"
            : "Movie"
        }
      />

      {isSeries && (
        <Info
          label="Seasons"
          value={seasons.length}
        />
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p className="mt-1 text-sm text-white">
        {value}
      </p>
    </div>
  );
}

function SeriesEpisodes({
  movie,
  seasons,
  selectedSeason,
  setSelectedSeason,
  navigate,
}) {
  return (
    <div className="mt-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Seasons & Episodes
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {seasons.reduce(
              (total, season) =>
                total +
                season.episodes
                  .length,
              0
            )}{" "}
            published episodes
          </p>
        </div>

        <label className="text-sm text-gray-400">
          Season

          <select
            value={selectedSeason}
            onChange={(event) =>
              setSelectedSeason(
                Number(
                  event.target.value
                )
              )
            }
            className="ml-3 min-h-11 rounded-lg border border-white/10 bg-zinc-900 px-3 text-white outline-none focus:border-red-500"
          >
            {seasons.map(
              (season, index) => (
                <option
                  key={
                    season._id ||
                    season.seasonNumber
                  }
                  value={index}
                >
                  {season.title ||
                    `Season ${season.seasonNumber}`}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      <div className="mt-5 space-y-3">
        {(
          seasons[selectedSeason]
            ?.episodes || []
        ).map((episode) => (
          <EpisodeCard
            key={
              episode._id ||
              episode.episodeNumber
            }
            movie={movie}
            season={
              seasons[
                selectedSeason
              ]
            }
            episode={episode}
            navigate={navigate}
          />
        ))}
      </div>
    </div>
  );
}

function EpisodeCard({
  movie,
  season,
  episode,
  navigate,
}) {
  const source = playableSource(
    episode.videoSources
  );

  const qualities = [
    ...new Set(
      (episode.videoSources || [])
        .filter(
          (item) =>
            item?.url?.trim()
        )
        .map(
          (item) => item.quality
        )
        .filter(Boolean)
    ),
  ];

  const play = () => {
    if (!source) {
      toast.error(
        "No playable video is currently available."
      );
      return;
    }

    navigate(
      `/watch/${movie._id}?season=${season.seasonNumber}&episode=${episode.episodeNumber}`
    );
  };

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-white/10 bg-zinc-950 p-4 sm:flex-row sm:items-center">
      <img
        src={
          episode.thumbnail ||
          movie.poster
        }
        alt={`${episode.title} thumbnail`}
        loading="lazy"
        className="aspect-video w-full rounded-lg object-cover sm:h-24 sm:w-40"
        onError={(event) => {
          if (
            movie.poster &&
            event.currentTarget
              .src !== movie.poster
          ) {
            event.currentTarget.src =
              movie.poster;
          } else {
            event.currentTarget.style.display =
              "none";
          }
        }}
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          Episode{" "}
          {episode.episodeNumber}{" "}
          · {episode.title}
        </p>

        {episode.description && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">
            {episode.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {episode.duration && (
            <span>
              {episode.duration}
            </span>
          )}

          {qualities.map(
            (quality) => (
              <span
                key={quality}
                className="rounded bg-white/10 px-2 py-1 text-gray-300"
              >
                {quality}
              </span>
            )
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={play}
        disabled={!source}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Play episode ${episode.episodeNumber}`}
      >
        <Play
          size={16}
          fill="currentColor"
        />
        Play
      </button>
    </article>
  );
}

function SubtitleInfo({
  subtitles,
}) {
  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold">
        Subtitles
      </h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {subtitles
          .filter(
            (subtitle) =>
              subtitle?.language &&
              subtitle?.url
          )
          .map((subtitle) => (
            <span
              key={subtitle.url}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm text-gray-300"
            >
              <Check
                size={15}
                className="text-emerald-400"
              />

              {subtitle.label ||
                subtitle.language}
            </span>
          ))}
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="h-140 animate-pulse bg-zinc-900" />

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-10 md:px-8">
        <div className="h-8 w-2/3 animate-pulse rounded bg-zinc-900" />

        <div className="h-24 animate-pulse rounded bg-zinc-900" />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-16 animate-pulse rounded bg-zinc-900" />
          <div className="h-16 animate-pulse rounded bg-zinc-900" />
          <div className="h-16 animate-pulse rounded bg-zinc-900" />
        </div>

        <div className="h-48 animate-pulse rounded bg-zinc-900" />
      </div>
    </main>
  );
}

function DetailsError({
  message,
  onRetry,
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 text-center text-white">
      <div>
        <h1 className="text-2xl font-black">
          {message}
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Check your connection and try
          again.
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-red-600 px-5 text-sm font-bold hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </main>
  );
}

function NotFoundDetails() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 text-center text-white">
      <div>
        <h1 className="text-3xl font-black">
          Content not found.
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          This content may have been removed
          or is unavailable.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-bold hover:bg-red-700"
        >
          <ArrowLeft size={17} />
          Back to Home
        </Link>
      </div>
    </main>
  );
}

export default MovieDetails;
