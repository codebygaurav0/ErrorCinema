const HISTORY_KEY = "errorcinema_watch_history";

const MAX_HISTORY_ITEMS = 50;

const readHistory = () => {
  try {
    const stored =
      localStorage.getItem(HISTORY_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "Watch history read error:",
      error
    );

    return [];
  }
};

const writeHistory = (history) => {
  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history)
    );
  } catch (error) {
    console.error(
      "Watch history write error:",
      error
    );
  }
};

const getWatchHistory = () => {
  return readHistory();
};

const saveWatchProgress = ({
  movie,
  seasonNumber = null,
  episodeNumber = null,
  currentTime = 0,
  duration = 0,
}) => {
  if (!movie?._id) {
    return;
  }

  const history = readHistory();

  const isEpisode =
    seasonNumber !== null &&
    episodeNumber !== null;

  const existingIndex = history.findIndex(
    (item) =>
      String(item.movieId) ===
        String(movie._id) &&
      (isEpisode
        ? item.seasonNumber ===
            Number(seasonNumber) &&
          item.episodeNumber ===
            Number(episodeNumber)
        : item.seasonNumber === null &&
          item.episodeNumber === null)
  );

  const safeCurrentTime = Math.max(
    0,
    Number(currentTime) || 0
  );

  const safeDuration = Math.max(
    0,
    Number(duration) || 0
  );

  const progress =
    safeDuration > 0
      ? Math.min(
          100,
          Math.round(
            (safeCurrentTime /
              safeDuration) *
              100
          )
        )
      : 0;

  const item = {
    movieId: movie._id,
    title: movie.title || "",
    type: movie.type || "movie",
    poster: movie.poster || "",
    backdrop: movie.backdrop || "",
    seasonNumber: isEpisode
      ? Number(seasonNumber)
      : null,
    episodeNumber: isEpisode
      ? Number(episodeNumber)
      : null,
    currentTime: safeCurrentTime,
    duration: safeDuration,
    progress,
    updatedAt: Date.now(),
  };

  if (existingIndex >= 0) {
    history.splice(
      existingIndex,
      1
    );
  }

  history.unshift(item);

  writeHistory(
    history.slice(
      0,
      MAX_HISTORY_ITEMS
    )
  );
};

const removeWatchHistory = ({
  movieId,
  seasonNumber = null,
  episodeNumber = null,
}) => {
  const history = readHistory();

  const filtered = history.filter(
    (item) =>
      !(
        String(item.movieId) ===
          String(movieId) &&
        item.seasonNumber ===
          (seasonNumber !== null
            ? Number(seasonNumber)
            : null) &&
        item.episodeNumber ===
          (episodeNumber !== null
            ? Number(episodeNumber)
            : null)
      )
  );

  writeHistory(filtered);

  return filtered;
};

const clearWatchHistory = () => {
  try {
    localStorage.removeItem(
      HISTORY_KEY
    );
  } catch (error) {
    console.error(
      "Clear watch history error:",
      error
    );
  }
};

const getContinueWatching = () => {
  return readHistory().filter(
    (item) =>
      item.progress > 0 &&
      item.progress < 95
  );
};

const getHistoryItem = ({
  movieId,
  seasonNumber = null,
  episodeNumber = null,
}) => {
  const history = readHistory();

  return (
    history.find(
      (item) =>
        String(item.movieId) ===
          String(movieId) &&
        item.seasonNumber ===
          (seasonNumber !== null
            ? Number(seasonNumber)
            : null) &&
        item.episodeNumber ===
          (episodeNumber !== null
            ? Number(episodeNumber)
            : null)
    ) || null
  );
};

export {
  getWatchHistory,
  saveWatchProgress,
  removeWatchHistory,
  clearWatchHistory,
  getContinueWatching,
  getHistoryItem,
};
