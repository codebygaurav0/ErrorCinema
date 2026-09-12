import Hls from "hls.js";
import {
  ArrowLeft,
  Captions,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { getMovieById } from "../services/movieService";
import {
  getHistoryItem,
  saveWatchProgress,
} from "../services/watchHistoryService";

function Player() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const lastSavedProgressRef = useRef(0);
  const restoredProgressKeyRef = useRef("");

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [quality, setQuality] = useState("Auto");
  const [subtitleLanguage, setSubtitleLanguage] =
    useState("Off");

  const [videoError, setVideoError] = useState("");
  const [isVideoLoading, setIsVideoLoading] =
    useState(false);

  const requestedSeasonNumber =
    Number(searchParams.get("season")) || 1;

  const requestedEpisodeNumber =
    Number(searchParams.get("episode")) || 1;

  /*
   * ------------------------------------------------------------
   * Load Movie / Series
   * ------------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const loadMovie = async () => {
      try {
        setLoading(true);
        setError("");
        setVideoError("");

        const data = await getMovieById(id);

        if (!data?.movie) {
          throw new Error("Movie not found");
        }

        if (data.movie.published !== true) {
          throw new Error(
            "This content is unavailable."
          );
        }

        if (!cancelled) {
          setMovie(data.movie);
        }
      } catch (err) {
        console.error(
          "Failed to load movie:",
          err
        );

        if (!cancelled) {
          setMovie(null);

          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load this video."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMovie();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /*
   * ------------------------------------------------------------
   * Series Detection
   * ------------------------------------------------------------
   */

  const isSeries = Boolean(
    movie?.type === "series" ||
      (Array.isArray(movie?.seasons) &&
        movie.seasons.length > 0)
  );

  /*
   * ------------------------------------------------------------
   * Published + Sorted Seasons
   * ------------------------------------------------------------
   */

  const sortedSeasons = useMemo(() => {
    if (
      !isSeries ||
      !Array.isArray(movie?.seasons)
    ) {
      return [];
    }

    return movie.seasons
      .filter(
        (season) => season != null
      )
      .map((season) => ({
        ...season,
        episodes: Array.isArray(
          season.episodes
        )
          ? season.episodes
              .filter(
                (episode) =>
                  episode?.published === true
              )
              .sort(
                (a, b) =>
                  Number(
                    a.episodeNumber || 0
                  ) -
                  Number(
                    b.episodeNumber || 0
                  )
              )
          : [],
      }))
      .sort(
        (a, b) =>
          Number(
            a.seasonNumber || 0
          ) -
          Number(
            b.seasonNumber || 0
          )
      );
  }, [movie, isSeries]);

  /*
   * ------------------------------------------------------------
   * Current Season
   * ------------------------------------------------------------
   */

  const currentSeason = useMemo(() => {
    if (
      !isSeries ||
      !sortedSeasons.length
    ) {
      return null;
    }

    return (
      sortedSeasons.find(
        (season) =>
          Number(
            season.seasonNumber
          ) === requestedSeasonNumber
      ) || sortedSeasons[0]
    );
  }, [
    isSeries,
    sortedSeasons,
    requestedSeasonNumber,
  ]);

  /*
   * ------------------------------------------------------------
   * Current Episode
   * ------------------------------------------------------------
   */

  const currentEpisode = useMemo(() => {
    if (
      !currentSeason?.episodes?.length
    ) {
      return null;
    }

    return (
      currentSeason.episodes.find(
        (episode) =>
          Number(
            episode.episodeNumber
          ) === requestedEpisodeNumber
      ) ||
      currentSeason.episodes[0]
    );
  }, [
    currentSeason,
    requestedEpisodeNumber,
  ]);

  /*
   * ------------------------------------------------------------
   * Video Sources
   * ------------------------------------------------------------
   */

  const videoSources = useMemo(() => {
    if (isSeries) {
      if (
        currentEpisode &&
        Array.isArray(
          currentEpisode.videoSources
        )
      ) {
        return currentEpisode.videoSources.filter(
          (source) =>
            source?.url &&
            typeof source.url ===
              "string" &&
            source.url.trim()
        );
      }

      return [];
    }

    if (
      Array.isArray(
        movie?.videoSources
      )
    ) {
      return movie.videoSources.filter(
        (source) =>
          source?.url &&
          typeof source.url ===
            "string" &&
          source.url.trim()
      );
    }

    return [];
  }, [
    movie,
    currentEpisode,
    isSeries,
  ]);

  /*
   * ------------------------------------------------------------
   * Selected Video Source
   * ------------------------------------------------------------
   */

  const selectedSource = useMemo(() => {
    if (!videoSources.length) {
      return null;
    }

    if (quality === "Auto") {
      const qualityPriority = [
        "1080p",
        "720p",
        "480p",
        "360p",
        "4K",
      ];

      for (
        const preferredQuality of qualityPriority
      ) {
        const source =
          videoSources.find(
            (item) =>
              item?.quality ===
              preferredQuality
          );

        if (source) {
          return source;
        }
      }

      return videoSources[0];
    }

    return (
      videoSources.find(
        (source) =>
          source?.quality === quality
      ) || videoSources[0]
    );
  }, [
    videoSources,
    quality,
  ]);

  const normalizeVideoUrl = useCallback((value) => {
    if (typeof value !== "string") {
      return "";
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return "";
    }

    // Supports URLs accidentally pasted as Markdown links:
    // [https://example.com/video.mp4](https://example.com/video.mp4)
    const markdownMatch = trimmed.match(
      /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/
    );

    if (markdownMatch) {
      return markdownMatch[2].trim();
    }

    return trimmed;
  }, []);

  const videoSource = normalizeVideoUrl(
    selectedSource?.url || ""
  );

  /*
   * ------------------------------------------------------------
   * Available Qualities
   * ------------------------------------------------------------
   */

  const availableQualities = useMemo(() => {
    const qualities = videoSources
      .map(
        (source) =>
          source?.quality
      )
      .filter(Boolean);

    return [
      ...new Set(qualities),
    ];
  }, [videoSources]);

  /*
   * ------------------------------------------------------------
   * Subtitles
   * ------------------------------------------------------------
   */

  const subtitles = useMemo(() => {
    const source = isSeries
      ? currentEpisode?.subtitles
      : movie?.subtitles;

    if (!Array.isArray(source)) {
      return [];
    }

    return source.filter(
      (subtitle) =>
        subtitle?.url &&
        typeof subtitle.url ===
          "string" &&
        subtitle.url.trim()
    );
  }, [
    movie,
    currentEpisode,
    isSeries,
  ]);

  const availableSubtitles = useMemo(() => {
    const seen = new Set();

    return subtitles.filter(
      (subtitle) => {
        const key =
          subtitle.language
            ?.trim()
            .toLowerCase() ||
          subtitle.label
            ?.trim()
            .toLowerCase() ||
          subtitle.url
            .trim()
            .toLowerCase();

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);

        return true;
      }
    );
  }, [subtitles]);

  const selectedSubtitle = useMemo(() => {
    if (
      subtitleLanguage === "Off"
    ) {
      return null;
    }

    return (
      subtitles.find(
        (subtitle) =>
          subtitle.language ===
          subtitleLanguage
      ) || null
    );
  }, [
    subtitles,
    subtitleLanguage,
  ]);

  const saveCurrentWatchProgress = useCallback(() => {
    const video = videoRef.current;

    if (!video || !movie?._id || !videoSource) {
      return;
    }

    const videoDuration = Number(video.duration);
    const current = Number(video.currentTime);

    if (
      !Number.isFinite(videoDuration) ||
      videoDuration <= 0 ||
      !Number.isFinite(current) ||
      current < 0
    ) {
      return;
    }

    const isEpisode = isSeries && currentEpisode;

    saveWatchProgress({
      movie,
      seasonNumber: isEpisode
        ? currentSeason?.seasonNumber
        : null,
      episodeNumber: isEpisode
        ? currentEpisode?.episodeNumber
        : null,
      currentTime: current,
      duration: videoDuration,
    });

    lastSavedProgressRef.current = current;
    window.dispatchEvent(
      new Event("errorcinema-history-updated")
    );
  }, [
    movie,
    videoSource,
    isSeries,
    currentEpisode,
    currentSeason,
  ]);

  /*
   * ------------------------------------------------------------
   * Play / Pause
   * ------------------------------------------------------------
   */

  const togglePlay = useCallback(() => {
    const video =
      videoRef.current;

    if (
      !video ||
      !videoSource ||
      videoError
    ) {
      return;
    }

    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          setVideoError("");
        })
        .catch((err) => {
          console.error(
            "Play failed:",
            err
          );

          setVideoError(
            "Video could not be played. Please check the video source."
          );

          setIsPlaying(false);
        });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [
    videoSource,
    videoError,
  ]);

  /*
   * ------------------------------------------------------------
   * Seek
   * ------------------------------------------------------------
   */

  const seek = useCallback(
    (seconds) => {
      const video =
        videoRef.current;

      if (!video) {
        return;
      }

      const videoDuration =
        Number(video.duration);

      if (
        !Number.isFinite(
          videoDuration
        ) ||
        videoDuration <= 0
      ) {
        return;
      }

      const current =
        Number(
          video.currentTime
        ) || 0;

      const nextTime = Math.max(
        0,
        Math.min(
          videoDuration,
          current + seconds
        )
      );

      video.currentTime =
        nextTime;

      setCurrentTime(
        nextTime
      );
    },
    []
  );

  /*
   * ------------------------------------------------------------
   * Mute
   * ------------------------------------------------------------
   */

  const toggleMute =
    useCallback(() => {
      const video =
        videoRef.current;

      if (!video) {
        return;
      }

      if (video.muted) {
        const nextVolume =
          volume > 0
            ? volume
            : 1;

        video.muted = false;
        video.volume =
          nextVolume;

        setVolume(
          nextVolume
        );
        setIsMuted(false);
      } else {
        video.muted = true;
        setIsMuted(true);
      }
    }, [volume]);

  /*
   * ------------------------------------------------------------
   * Volume
   * ------------------------------------------------------------
   */

  const handleVolume =
    useCallback((event) => {
      const newVolume =
        Number(
          event.target.value
        );

      const video =
        videoRef.current;

      if (
        !video ||
        !Number.isFinite(
          newVolume
        )
      ) {
        return;
      }

      const safeVolume =
        Math.max(
          0,
          Math.min(
            1,
            newVolume
          )
        );

      video.volume =
        safeVolume;

      setVolume(
        safeVolume
      );

      if (
        safeVolume === 0
      ) {
        video.muted = true;
        setIsMuted(true);
      } else {
        video.muted = false;
        setIsMuted(false);
      }
    }, []);

  /*
   * ------------------------------------------------------------
   * Fullscreen
   * ------------------------------------------------------------
   */

  const toggleFullscreen =
    useCallback(async () => {
      const container =
        containerRef.current;

      if (!container) {
        return;
      }

      try {
        if (
          !document.fullscreenElement
        ) {
          await container.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (err) {
        console.error(
          "Fullscreen error:",
          err
        );
      }
    }, []);

  /*
   * ------------------------------------------------------------
   * Format Time
   * ------------------------------------------------------------
   */

  const formatTime =
    useCallback((time) => {
      if (
        !Number.isFinite(time) ||
        time < 0
      ) {
        return "00:00";
      }

      const totalSeconds =
        Math.floor(time);

      const hours = Math.floor(
        totalSeconds / 3600
      );

      const minutes = Math.floor(
        (totalSeconds % 3600) /
          60
      );

      const seconds =
        totalSeconds % 60;

      if (hours > 0) {
        return `${String(
          hours
        ).padStart(
          2,
          "0"
        )}:${String(
          minutes
        ).padStart(
          2,
          "0"
        )}:${String(
          seconds
        ).padStart(
          2,
          "0"
        )}`;
      }

      return `${String(
        minutes
      ).padStart(
        2,
        "0"
      )}:${String(
        seconds
      ).padStart(
        2,
        "0"
      )}`;
    }, []);

  /*
   * ------------------------------------------------------------
   * Progress
   * ------------------------------------------------------------
   */

  const handleProgress =
    useCallback((event) => {
      const video =
        videoRef.current;

      if (!video) {
        return;
      }

      const newTime =
        Number(
          event.target.value
        );

      if (
        !Number.isFinite(
          newTime
        )
      ) {
        return;
      }

      video.currentTime =
        newTime;

      setCurrentTime(
        newTime
      );
    }, []);

  /*
   * ------------------------------------------------------------
   * Previous Episode
   * ------------------------------------------------------------
   */

  const goToPreviousEpisode =
    useCallback(() => {
      if (
        !isSeries ||
        !currentEpisode ||
        !currentSeason ||
        !sortedSeasons.length
      ) {
        return;
      }

      const currentSeasonIndex =
        sortedSeasons.findIndex(
          (season) =>
            Number(
              season.seasonNumber
            ) ===
            Number(
              currentSeason.seasonNumber
            )
        );

      if (
        currentSeasonIndex < 0
      ) {
        return;
      }

      const episodes =
        currentSeason.episodes ||
        [];

      const currentEpisodeIndex =
        episodes.findIndex(
          (episode) =>
            Number(
              episode.episodeNumber
            ) ===
            Number(
              currentEpisode.episodeNumber
            )
        );

      if (
        currentEpisodeIndex > 0
      ) {
        const previousEpisode =
          episodes[
            currentEpisodeIndex -
              1
          ];

        navigate(
          `/watch/${movie._id}?season=${currentSeason.seasonNumber}&episode=${previousEpisode.episodeNumber}`
        );

        return;
      }

      if (
        currentSeasonIndex > 0
      ) {
        const previousSeason =
          sortedSeasons[
            currentSeasonIndex -
              1
          ];

        const previousEpisodes =
          previousSeason.episodes ||
          [];

        const lastEpisode =
          previousEpisodes[
            previousEpisodes.length -
              1
          ];

        if (lastEpisode) {
          navigate(
            `/watch/${movie._id}?season=${previousSeason.seasonNumber}&episode=${lastEpisode.episodeNumber}`
          );
        }
      }
    }, [
      isSeries,
      currentEpisode,
      currentSeason,
      sortedSeasons,
      movie,
      navigate,
    ]);

  /*
   * ------------------------------------------------------------
   * Next Episode
   * ------------------------------------------------------------
   */

  const goToNextEpisode =
    useCallback(() => {
      if (
        !isSeries ||
        !currentEpisode ||
        !currentSeason ||
        !sortedSeasons.length
      ) {
        return;
      }

      const currentSeasonIndex =
        sortedSeasons.findIndex(
          (season) =>
            Number(
              season.seasonNumber
            ) ===
            Number(
              currentSeason.seasonNumber
            )
        );

      if (
        currentSeasonIndex < 0
      ) {
        return;
      }

      const episodes =
        currentSeason.episodes ||
        [];

      const currentEpisodeIndex =
        episodes.findIndex(
          (episode) =>
            Number(
              episode.episodeNumber
            ) ===
            Number(
              currentEpisode.episodeNumber
            )
        );

      if (
        currentEpisodeIndex >= 0 &&
        currentEpisodeIndex <
          episodes.length - 1
      ) {
        const nextEpisode =
          episodes[
            currentEpisodeIndex +
              1
          ];

        navigate(
          `/watch/${movie._id}?season=${currentSeason.seasonNumber}&episode=${nextEpisode.episodeNumber}`
        );

        return;
      }

      if (
        currentSeasonIndex >= 0 &&
        currentSeasonIndex <
          sortedSeasons.length - 1
      ) {
        const nextSeason =
          sortedSeasons[
            currentSeasonIndex + 1
          ];

        const nextEpisodes =
          nextSeason.episodes ||
          [];

        const firstEpisode =
          nextEpisodes[0];

        if (firstEpisode) {
          navigate(
            `/watch/${movie._id}?season=${nextSeason.seasonNumber}&episode=${firstEpisode.episodeNumber}`
          );
        }
      }
    }, [
      isSeries,
      currentEpisode,
      currentSeason,
      sortedSeasons,
      movie,
      navigate,
    ]);

  /*
   * ------------------------------------------------------------
   * Load Video
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return undefined;
    }

    let cancelled = false;

    setVideoError("");
    setIsVideoLoading(true);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    video.pause();
    video.removeAttribute("src");
    video.load();

    if (!videoSource) {
      return undefined;
    }

    const sourceUrl = videoSource.toLowerCase();

    const isHls =
      selectedSource?.format?.toLowerCase() === "hls" ||
      sourceUrl.includes(".m3u8");

    const handleCanPlay = () => {
      if (cancelled) return;

      setIsVideoLoading(false);
      setVideoError("");
    };

    const handleWaiting = () => {
      if (cancelled) return;

      setIsVideoLoading(true);
    };

    const handlePlaying = () => {
      if (cancelled) return;

      setIsVideoLoading(false);
      setVideoError("");
    };

    const handleError = () => {
      if (cancelled) return;

      console.error("Video source error:", {
        src: video.currentSrc || video.src,
        mediaError: video.error,
        source: selectedSource,
      });

      setIsVideoLoading(false);
      setIsPlaying(false);

      setVideoError(
        "Video could not be loaded. Please check the video URL, format, or server access."
      );
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("error", handleError);

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,
        });

        hlsRef.current = hls;

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          if (!cancelled) {
            hls.loadSource(videoSource);
          }
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!cancelled) {
            setIsVideoLoading(false);
            setVideoError("");
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error("HLS error:", data);

          if (data?.fatal && !cancelled) {
            setIsVideoLoading(false);
            setIsPlaying(false);
            setVideoError("HLS video could not be loaded.");
          }
        });

        hls.attachMedia(video);
      } else if (
        video.canPlayType("application/vnd.apple.mpegurl")
      ) {
        video.src = videoSource;
        video.load();
      } else {
        setIsVideoLoading(false);
        setVideoError(
          "This browser does not support HLS playback."
        );
      }
    } else {
      // MP4 / WebM / other browser-supported media
      video.src = videoSource;
      video.load();
    }

    return () => {
      cancelled = true;

      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("error", handleError);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [
    videoSource,
    selectedSource,
  ]);

  /*
   * ------------------------------------------------------------
   * Video Events
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const video =
      videoRef.current;

    if (!video) {
      return undefined;
    }

    const updateVideoState =
      () => {
        const videoDuration =
          Number(
            video.duration
          );

        if (
          Number.isFinite(
            videoDuration
          ) &&
          videoDuration > 0
        ) {
          setDuration(
            videoDuration
          );
        }

        const current =
          Number(
            video.currentTime
          );

        if (
          Number.isFinite(
            current
          ) &&
          current >= 0
        ) {
          setCurrentTime(
            current
          );
        }
      };

    const handleLoadedMetadata =
      () => {
        updateVideoState();
        setVideoError("");

        if (!movie?._id || !videoSource) {
          return;
        }

        const historyKey = isSeries && currentEpisode
          ? `${movie._id}-${currentSeason?.seasonNumber}-${currentEpisode.episodeNumber}`
          : `${movie._id}-movie`;

        if (restoredProgressKeyRef.current === historyKey) {
          return;
        }

        const historyItem = getHistoryItem({
          movieId: movie._id,
          seasonNumber: isSeries && currentEpisode
            ? currentSeason?.seasonNumber
            : null,
          episodeNumber: isSeries && currentEpisode
            ? currentEpisode.episodeNumber
            : null,
        });

        const savedTime = Number(historyItem?.currentTime);

        if (
          Number.isFinite(savedTime) &&
          savedTime > 0 &&
          Number.isFinite(video.duration) &&
          video.duration > 0 &&
          savedTime < video.duration - 5
        ) {
          video.currentTime = Math.min(
            savedTime,
            Math.max(0, video.duration - 1)
          );
        }

        restoredProgressKeyRef.current = historyKey;
      };

    const handleDurationChange =
      () => {
        updateVideoState();
      };

    const handleLoadedData =
      () => {
        updateVideoState();
      };

    const handleCanPlay =
      () => {
        updateVideoState();
        setIsVideoLoading(
          false
        );
      };

    const handleWaiting =
      () => {
        setIsVideoLoading(
          true
        );
      };

    const handlePlaying =
      () => {
        setIsVideoLoading(
          false
        );

        setIsPlaying(true);
        setVideoError("");
        updateVideoState();
      };

    const handleTimeUpdate =
      () => {
        updateVideoState();

        const videoCurrent = Number(video.currentTime);
        if (
          Number.isFinite(videoCurrent) &&
          Math.abs(
            videoCurrent - lastSavedProgressRef.current
          ) >= 5
        ) {
          saveCurrentWatchProgress();
        }
      };

    const handlePlay = () => {
      setIsPlaying(true);
      setVideoError("");
      updateVideoState();
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setIsVideoLoading(false);

      const videoDuration =
        Number(
          video.duration
        );

      if (
        Number.isFinite(
          videoDuration
        ) &&
        videoDuration > 0
      ) {
        setCurrentTime(
          videoDuration
        );
      }

      saveCurrentWatchProgress();
    };

    const handleError = () => {
      console.error(
        "HTML5 Video Error:",
        video.error
      );

      setIsVideoLoading(false);
      setIsPlaying(false);

      setVideoError(
        "Video could not be loaded. Please check the video source and format."
      );
    };

    video.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );

    video.addEventListener(
      "durationchange",
      handleDurationChange
    );

    video.addEventListener(
      "loadeddata",
      handleLoadedData
    );

    video.addEventListener(
      "canplay",
      handleCanPlay
    );

    video.addEventListener(
      "waiting",
      handleWaiting
    );

    video.addEventListener(
      "playing",
      handlePlaying
    );

    video.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );

    video.addEventListener(
      "play",
      handlePlay
    );

    video.addEventListener(
      "pause",
      handlePause
    );

    video.addEventListener(
      "ended",
      handleEnded
    );

    video.addEventListener(
      "error",
      handleError
    );

    updateVideoState();

    return () => {
      video.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );

      video.removeEventListener(
        "durationchange",
        handleDurationChange
      );

      video.removeEventListener(
        "loadeddata",
        handleLoadedData
      );

      video.removeEventListener(
        "canplay",
        handleCanPlay
      );

      video.removeEventListener(
        "waiting",
        handleWaiting
      );

      video.removeEventListener(
        "playing",
        handlePlaying
      );

      video.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );

      video.removeEventListener(
        "play",
        handlePlay
      );

      video.removeEventListener(
        "pause",
        handlePause
      );

      video.removeEventListener(
        "ended",
        handleEnded
      );

      video.removeEventListener(
        "error",
        handleError
      );
    };
  }, [
    movie,
    videoSource,
    isSeries,
    currentEpisode,
    currentSeason,
    saveCurrentWatchProgress,
  ]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentWatchProgress();
    };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      handleBeforeUnload();
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [saveCurrentWatchProgress]);

  /*
   * ------------------------------------------------------------
   * Keyboard Controls
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const handleKeyDown =
      (event) => {
        const target =
          event.target;

        if (
          target instanceof
            HTMLInputElement ||
          target instanceof
            HTMLTextAreaElement ||
          target instanceof
            HTMLSelectElement ||
          target?.isContentEditable
        ) {
          return;
        }

        switch (
          event.key.toLowerCase()
        ) {
          case " ":
          case "k":
            event.preventDefault();
            togglePlay();
            break;

          case "arrowleft":
            event.preventDefault();
            seek(-10);
            break;

          case "arrowright":
            event.preventDefault();
            seek(10);
            break;

          case "m":
            event.preventDefault();
            toggleMute();
            break;

          case "f":
            event.preventDefault();
            toggleFullscreen();
            break;

          default:
            break;
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    togglePlay,
    seek,
    toggleMute,
    toggleFullscreen,
  ]);

  /*
   * ------------------------------------------------------------
   * Fullscreen State
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const handleFullscreenChange =
      () => {
        setIsFullscreen(
          Boolean(
            document.fullscreenElement
          )
        );
      };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  /*
   * ------------------------------------------------------------
   * Loading
   * ------------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />

          <p className="text-sm text-gray-500">
            Loading video...
          </p>
        </div>
      </main>
    );
  }

  /*
   * ------------------------------------------------------------
   * API Error
   * ------------------------------------------------------------
   */

  if (!movie || error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-black">
            Video Not Found
          </h1>

          <p className="mt-3 text-gray-500">
            {error ||
              "This video is unavailable."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                movie?.type ===
                  "series"
                  ? "/tv-shows"
                  : "/movies"
              )
            }
            className="mt-6 rounded-lg bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  /*
   * ------------------------------------------------------------
   * Episode Navigation State
   * ------------------------------------------------------------
   */

  const currentSeasonIndex =
    isSeries
      ? sortedSeasons.findIndex(
          (season) =>
            Number(
              season.seasonNumber
            ) ===
            Number(
              currentSeason?.seasonNumber
            )
        )
      : -1;

  const currentEpisodes =
    currentSeason?.episodes ||
    [];

  const currentEpisodeIndex =
    currentEpisode
      ? currentEpisodes.findIndex(
          (episode) =>
            Number(
              episode.episodeNumber
            ) ===
            Number(
              currentEpisode.episodeNumber
            )
        )
      : -1;

  const isFirstEpisode =
    !isSeries ||
    !currentEpisode ||
    !currentSeason ||
    (currentSeasonIndex ===
      0 &&
      currentEpisodeIndex ===
        0);

  const isLastEpisode =
    !isSeries ||
    !currentEpisode ||
    !currentSeason ||
    (currentSeasonIndex ===
      sortedSeasons.length - 1 &&
      currentEpisodeIndex ===
        currentEpisodes.length - 1);

  /*
   * ------------------------------------------------------------
   * Render
   * ------------------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-black text-white">
      <div
        ref={containerRef}
        className="relative min-h-screen bg-black"
      >
        {/* Top Bar */}

        <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/95 via-black/70 to-transparent px-4 py-5 md:px-8">
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="flex items-center gap-2 rounded-lg bg-black/50 px-3 py-2 text-sm font-medium backdrop-blur-md transition hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Go back"
          >
            <ArrowLeft size={19} />

            <span>Back</span>
          </button>

          <div className="max-w-[65%] text-right">
            <h1 className="truncate text-sm font-bold sm:text-base">
              {movie.title}
            </h1>

            {isSeries &&
              currentEpisode && (
                <p className="truncate text-xs text-gray-400">
                  S
                  {
                    currentSeason?.seasonNumber
                  }{" "}
                  · E
                  {
                    currentEpisode.episodeNumber
                  }{" "}
                  ·{" "}
                  {
                    currentEpisode.title
                  }
                </p>
              )}
          </div>
        </div>

        {/* Video Area */}

        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
          {videoSource ? (
            <>
              <video
                ref={videoRef}
                className="max-h-screen w-full cursor-pointer object-contain"
                playsInline
                preload="auto"
                onClick={(event) => {
                  event.stopPropagation();
                  togglePlay();
                }}
              >
                {selectedSubtitle && (
                  <track
                    key={`${selectedSubtitle.language}-${selectedSubtitle.url}`}
                    kind="subtitles"
                    src={selectedSubtitle.url.trim()}
                    srcLang={
                      selectedSubtitle.language ||
                      "en"
                    }
                    label={
                      selectedSubtitle.label ||
                      selectedSubtitle.language ||
                      "Subtitle"
                    }
                    default
                  />
                )}
              </video>

              {isVideoLoading &&
                !videoError && (
                  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />
                  </div>
                )}
            </>
          ) : (
            <div className="max-w-md px-5 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900">
                <Play
                  size={26}
                  className="text-gray-500"
                />
              </div>

              <h2 className="text-xl font-bold">
                No video source
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                This{" "}
                {isSeries
                  ? "episode"
                  : "movie"}{" "}
                does not have an authorized
                video source.
              </p>
            </div>
          )}

          {/* Center Play */}

          {videoSource &&
            !isPlaying &&
            !videoError &&
            !isVideoLoading && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  togglePlay();
                }}
                className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-2xl transition hover:scale-110 focus:outline-none focus:ring-4 focus:ring-white/30 sm:h-20 sm:w-20"
                aria-label="Play video"
              >
                <Play
                  size={30}
                  fill="currentColor"
                />
              </button>
            )}
        </div>

        {/* Video Error */}

        {videoSource &&
          videoError && (
            <div className="absolute left-1/2 top-1/2 z-40 w-[90%] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-red-500/20 bg-black/95 p-6 text-center backdrop-blur-md">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <RotateCcw
                  size={22}
                  className="text-red-400"
                />
              </div>

              <h2 className="text-lg font-bold text-red-400">
                Video Playback Error
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                {videoError}
              </p>

              <button
                type="button"
                onClick={() => {
                  setVideoError("");

                  const video =
                    videoRef.current;

                  if (!video) {
                    return;
                  }

                  video.load();

                  video
                    .play()
                    .then(() => {
                      setIsPlaying(
                        true
                      );
                    })
                    .catch(() => {
                      setVideoError(
                        "The video could not be started. Please try again."
                      );
                    });
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <RotateCcw size={16} />

                Retry
              </button>
            </div>
          )}

        {/* Controls */}

        <div
          className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black via-black/85 to-transparent px-4 pb-5 pt-16 md:px-8"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          {/* Progress */}

          {videoSource &&
            duration > 0 && (
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={Math.min(
                  currentTime,
                  duration
                )}
                onChange={
                  handleProgress
                }
                className="mb-4 h-1 w-full cursor-pointer accent-red-600"
                aria-label="Video progress"
              />
            )}

          <div className="flex items-center justify-between gap-2">
            {/* Left Controls */}

            <div className="flex min-w-0 items-center gap-1 sm:gap-3">
              {/* Play / Pause */}

              <button
                type="button"
                onClick={
                  togglePlay
                }
                disabled={
                  !videoSource ||
                  Boolean(
                    videoError
                  )
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10 disabled:opacity-30"
                aria-label={
                  isPlaying
                    ? "Pause"
                    : "Play"
                }
              >
                {isPlaying ? (
                  <Pause
                    size={20}
                    fill="currentColor"
                  />
                ) : (
                  <Play
                    size={20}
                    fill="currentColor"
                  />
                )}
              </button>

              {/* Rewind */}

              <button
                type="button"
                onClick={() =>
                  seek(-10)
                }
                disabled={
                  !videoSource ||
                  duration <= 0
                }
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10 disabled:opacity-30"
                aria-label="Rewind 10 seconds"
              >
                <RotateCcw
                  size={19}
                />

                <span className="absolute text-[7px] font-bold">
                  10
                </span>
              </button>

              {/* Forward */}

              <button
                type="button"
                onClick={() =>
                  seek(10)
                }
                disabled={
                  !videoSource ||
                  duration <= 0
                }
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10 disabled:opacity-30"
                aria-label="Forward 10 seconds"
              >
                <RotateCw
                  size={19}
                />

                <span className="absolute text-[7px] font-bold">
                  10
                </span>
              </button>

              {/* Mute */}

              <button
                type="button"
                onClick={
                  toggleMute
                }
                disabled={
                  !videoSource
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10 disabled:opacity-30"
                aria-label={
                  isMuted
                    ? "Unmute"
                    : "Mute"
                }
              >
                {isMuted ||
                volume === 0 ? (
                  <VolumeX
                    size={20}
                  />
                ) : (
                  <Volume2
                    size={20}
                  />
                )}
              </button>

              {/* Volume */}

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={
                  isMuted
                    ? 0
                    : volume
                }
                onChange={
                  handleVolume
                }
                disabled={
                  !videoSource
                }
                className="hidden w-20 accent-red-600 sm:block"
                aria-label="Volume"
              />

              {/* Time */}

              {duration > 0 && (
                <span className="whitespace-nowrap text-xs text-gray-400">
                  {formatTime(
                    currentTime
                  )}{" "}
                  /{" "}
                  {formatTime(
                    duration
                  )}
                </span>
              )}
            </div>

            {/* Right Controls */}

            <div className="flex shrink-0 items-center gap-1 sm:gap-3">
              {/* Previous / Next */}

              {isSeries && (
                <>
                  <button
                    type="button"
                    onClick={
                      goToPreviousEpisode
                    }
                    disabled={
                      isFirstEpisode
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Previous episode"
                  >
                    <ChevronLeft
                      size={21}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={
                      goToNextEpisode
                    }
                    disabled={
                      isLastEpisode
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Next episode"
                  >
                    <ChevronRight
                      size={21}
                    />
                  </button>
                </>
              )}

              {/* Subtitles */}

              {availableSubtitles.length >
                0 && (
                <div className="flex items-center gap-1">
                  <Captions
                    size={17}
                    className="hidden text-gray-400 sm:block"
                  />

                  <select
                    value={
                      subtitleLanguage
                    }
                    onChange={(event) =>
                      setSubtitleLanguage(
                        event.target.value
                      )
                    }
                    className="max-w-24 rounded-md border border-white/10 bg-black/90 px-2 py-1.5 text-xs font-semibold outline-none focus:border-red-500 sm:max-w-none"
                    aria-label="Subtitle language"
                  >
                    <option value="Off">
                      Subtitles Off
                    </option>

                    {availableSubtitles.map(
                      (subtitle) => (
                        <option
                          key={`${subtitle.language}-${subtitle.url}`}
                          value={
                            subtitle.language
                          }
                        >
                          {subtitle.label ||
                            subtitle.language ||
                            "Subtitle"}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              {/* Quality */}

              {availableQualities.length >
                0 && (
                <select
                  value={quality}
                  onChange={(event) =>
                    setQuality(
                      event.target.value
                    )
                  }
                  className="max-w-20 rounded-md border border-white/10 bg-black/90 px-2 py-1.5 text-xs font-semibold outline-none focus:border-red-500 sm:max-w-none"
                  aria-label="Video quality"
                >
                  <option value="Auto">
                    Auto
                  </option>

                  {availableQualities.map(
                    (itemQuality) => (
                      <option
                        key={
                          itemQuality
                        }
                        value={
                          itemQuality
                        }
                      >
                        {
                          itemQuality
                        }
                      </option>
                    )
                  )}
                </select>
              )}

              {/* Fullscreen */}

              <button
                type="button"
                onClick={
                  toggleFullscreen
                }
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={
                  isFullscreen
                    ? "Exit fullscreen"
                    : "Fullscreen"
                }
              >
                {isFullscreen ? (
                  <Minimize
                    size={20}
                  />
                ) : (
                  <Maximize
                    size={20}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Below Player */}

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold">
              {movie.title}
            </h2>

            {isSeries &&
              currentEpisode && (
                <p className="mt-2 text-sm text-gray-500">
                  Season{" "}
                  {
                    currentSeason?.seasonNumber
                  }{" "}
                  · Episode{" "}
                  {
                    currentEpisode.episodeNumber
                  }{" "}
                  ·{" "}
                  {
                    currentEpisode.title
                  }
                </p>
              )}
          </div>

          {selectedSource?.quality && (
            <span className="rounded-md border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-gray-300">
              {selectedSource.quality}
            </span>
          )}
        </div>

        {(currentEpisode?.description ||
          movie.description) && (
          <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-400">
            {currentEpisode?.description ||
              movie.description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600">
          <span>
            Space / K = Play/Pause
          </span>

          <span>
            ← / → = 10 sec seek
          </span>

          <span>
            M = Mute
          </span>

          <span>
            F = Fullscreen
          </span>

          {availableSubtitles.length >
            0 && (
            <span>
              CC = Subtitles
            </span>
          )}
        </div>
      </section>
    </main>
  );
}

export default Player;