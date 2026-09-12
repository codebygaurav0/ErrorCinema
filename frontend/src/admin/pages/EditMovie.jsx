import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const emptySource = {
  quality: "1080p",
  format: "mp4",
  url: "",
};

const emptySubtitle = {
  language: "English",
  label: "English",
  url: "",
};

const emptyEpisode = {
  episodeNumber: 1,
  title: "",
  description: "",
  duration: "",
  thumbnail: "",
  videoSources: [{ ...emptySource }],
  subtitles: [{ ...emptySubtitle }],
  published: false,
};

const emptySeason = {
  seasonNumber: 1,
  title: "",
  episodes: [],
};

function isUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function uniqueTrimmed(values) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function EditMovie() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: "movie",
    title: "",
    description: "",
    year: "",
    rating: "",
    duration: "",
    genres: "",
    language: "",
    country: "",
    certification: "",
    poster: "",
    backdrop: "",
    trailer: "",
    director: "",
    cast: "",
    featured: false,
    published: false,
    videoSources: [{ ...emptySource }],
    subtitles: [{ ...emptySubtitle }],
    seasons: [],
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const token = localStorage.getItem("errorcinema_admin_token");

        if (!token) {
          navigate("/admin/login", { replace: true });
          return;
        }

        const response = await api.get(`/movies/admin/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const movie = response.data.movie;

        if (!movie) {
          toast.error("Content not found");
          navigate("/admin/movies");
          return;
        }

        const normalizedSeasons = (movie.seasons || [])
          .map((season, seasonIndex) => ({
            _id: season._id,
            seasonNumber: season.seasonNumber ?? seasonIndex + 1,
            title: season.title || "",
            episodes: (season.episodes || [])
              .map((episode, episodeIndex) => ({
                _id: episode._id,
                episodeNumber:
                  episode.episodeNumber ?? episodeIndex + 1,
                title: episode.title || "",
                description: episode.description || "",
                duration: episode.duration || "",
                thumbnail: episode.thumbnail || "",
                published: Boolean(episode.published),

                videoSources:
                  episode.videoSources?.length > 0
                    ? episode.videoSources.map((source) => ({
                        quality: source.quality || "1080p",
                        format: source.format || "mp4",
                        url: source.url || "",
                      }))
                    : [{ ...emptySource }],

                subtitles:
                  episode.subtitles?.length > 0
                    ? episode.subtitles.map((subtitle) => ({
                        language: subtitle.language || "English",
                        label: subtitle.label || subtitle.language || "",
                        url: subtitle.url || "",
                      }))
                    : [{ ...emptySubtitle }],
              }))
              .sort((a, b) => a.episodeNumber - b.episodeNumber),
          }))
          .sort((a, b) => a.seasonNumber - b.seasonNumber);

        setForm({
          type: movie.type || "movie",
          title: movie.title || "",
          description: movie.description || "",
          year: movie.year || "",
          rating: movie.rating ?? "",
          duration: movie.duration || "",
          genres: (movie.genres || []).join(", "),
          language: movie.language || "",
          country: movie.country || "",
          certification: movie.certification || "",
          poster: movie.poster || "",
          backdrop: movie.backdrop || "",
          trailer: movie.trailer || "",
          director: movie.director || "",
          cast: (movie.cast || []).join(", "),
          featured: Boolean(movie.featured),
          published: Boolean(movie.published),

          videoSources:
            movie.videoSources?.length > 0
              ? movie.videoSources.map((source) => ({
                  quality: source.quality || "1080p",
                  format: source.format || "mp4",
                  url: source.url || "",
                }))
              : [{ ...emptySource }],

          subtitles:
            movie.subtitles?.length > 0
              ? movie.subtitles.map((subtitle) => ({
                  language: subtitle.language || "English",
                  label: subtitle.label || subtitle.language || "",
                  url: subtitle.url || "",
                }))
              : [{ ...emptySubtitle }],

          seasons: normalizedSeasons,
        });
      } catch (error) {
        console.error("Fetch content error:", error);

        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          localStorage.removeItem("errorcinema_admin_token");
          localStorage.removeItem("errorcinema_admin_user");
          navigate("/admin/login", { replace: true });
          return;
        }

        toast.error(
          error.response?.data?.message || "Failed to load content"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSourceChange = (index, field, value) => {
    setForm((previous) => {
      const sources = [...previous.videoSources];

      sources[index] = {
        ...sources[index],
        [field]: value,
      };

      return {
        ...previous,
        videoSources: sources,
      };
    });
  };

  const addSource = () => {
    setForm((previous) => ({
      ...previous,
      videoSources: [
        ...previous.videoSources,
        {
          quality: "720p",
          format: "mp4",
          url: "",
        },
      ],
    }));
  };

  const removeSource = (index) => {
    setForm((previous) => {
      return {
        ...previous,
        videoSources: previous.videoSources.filter(
          (_, sourceIndex) => sourceIndex !== index
        ),
      };
    });
  };

  const handleSubtitleChange = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      subtitles: previous.subtitles.map((subtitle, subtitleIndex) =>
        subtitleIndex === index ? { ...subtitle, [field]: value } : subtitle
      ),
    }));
  };

  const addSubtitle = () => {
    setForm((previous) => ({
      ...previous,
      subtitles: [...previous.subtitles, { ...emptySubtitle }],
    }));
  };

  const removeSubtitle = (index) => {
    setForm((previous) => ({
      ...previous,
      subtitles: previous.subtitles.filter((_, subtitleIndex) => subtitleIndex !== index),
    }));
  };

  const addSeason = () => {
    setForm((previous) => ({
      ...previous,
      seasons: [
        ...previous.seasons,
        {
          ...emptySeason,
          seasonNumber: previous.seasons.length + 1,
          episodes: [],
        },
      ],
    }));
  };

  const removeSeason = (seasonIndex) => {
    setForm((previous) => ({
      ...previous,
      seasons: previous.seasons.filter(
        (_, index) => index !== seasonIndex
      ),
    }));
  };

  const handleSeasonChange = (seasonIndex, field, value) => {
    setForm((previous) => {
      const seasons = [...previous.seasons];

      seasons[seasonIndex] = {
        ...seasons[seasonIndex],
        [field]:
          field === "seasonNumber" ? Number(value) : value,
      };

      return {
        ...previous,
        seasons,
      };
    });
  };

  const addEpisode = (seasonIndex) => {
    setForm((previous) => {
      const seasons = [...previous.seasons];

      const currentSeason = seasons[seasonIndex];

      const nextEpisodeNumber =
        currentSeason.episodes.length + 1;

      seasons[seasonIndex] = {
        ...currentSeason,
        episodes: [
          ...currentSeason.episodes,
          {
            ...emptyEpisode,
            episodeNumber: nextEpisodeNumber,
            videoSources: [{ ...emptySource }],
            subtitles: [{ ...emptySubtitle }],
          },
        ],
      };

      return {
        ...previous,
        seasons,
      };
    });
  };

  const removeEpisode = (seasonIndex, episodeIndex) => {
    setForm((previous) => {
      const seasons = [...previous.seasons];

      seasons[seasonIndex] = {
        ...seasons[seasonIndex],
        episodes: seasons[seasonIndex].episodes.filter(
          (_, index) => index !== episodeIndex
        ),
      };

      return {
        ...previous,
        seasons,
      };
    });
  };

  const handleEpisodeChange = (
    seasonIndex,
    episodeIndex,
    field,
    value
  ) => {
    setForm((previous) => {
      const seasons = [...previous.seasons];
      const episodes = [...seasons[seasonIndex].episodes];

      episodes[episodeIndex] = {
        ...episodes[episodeIndex],
        [field]:
          field === "episodeNumber"
            ? Number(value)
            : field === "published"
            ? Boolean(value)
            : value,
      };

      seasons[seasonIndex] = {
        ...seasons[seasonIndex],
        episodes,
      };

      return {
        ...previous,
        seasons,
      };
    });
  };

  const handleEpisodeSourceChange = (
    seasonIndex,
    episodeIndex,
    sourceIndex,
    field,
    value
  ) => {
    setForm((previous) => {
      const seasons = [...previous.seasons];
      const episodes = [...seasons[seasonIndex].episodes];
      const videoSources = [
        ...episodes[episodeIndex].videoSources,
      ];

      videoSources[sourceIndex] = {
        ...videoSources[sourceIndex],
        [field]: value,
      };

      episodes[episodeIndex] = {
        ...episodes[episodeIndex],
        videoSources,
      };

      seasons[seasonIndex] = {
        ...seasons[seasonIndex],
        episodes,
      };

      return {
        ...previous,
        seasons,
      };
    });
  };

  const addEpisodeSource = (seasonIndex, episodeIndex) => {
    setForm((previous) => {
      const seasons = [...previous.seasons];
      const episodes = [...seasons[seasonIndex].episodes];

      episodes[episodeIndex] = {
        ...episodes[episodeIndex],
        videoSources: [
          ...episodes[episodeIndex].videoSources,
          {
            quality: "720p",
            format: "mp4",
            url: "",
          },
        ],
      };

      seasons[seasonIndex] = {
        ...seasons[seasonIndex],
        episodes,
      };

      return {
        ...previous,
        seasons,
      };
    });
  };

  const removeEpisodeSource = (
    seasonIndex,
    episodeIndex,
    sourceIndex
  ) => {
    setForm((previous) => {
      const seasons = [...previous.seasons];
      const episodes = [...seasons[seasonIndex].episodes];

      episodes[episodeIndex] = {
        ...episodes[episodeIndex],
        videoSources:
          episodes[episodeIndex].videoSources.filter(
            (_, index) => index !== sourceIndex
          ),
      };

      seasons[seasonIndex] = {
        ...seasons[seasonIndex],
        episodes,
      };

      return {
        ...previous,
        seasons,
      };
    });
  };

  const handleEpisodeSubtitleChange = (
    seasonIndex,
    episodeIndex,
    subtitleIndex,
    field,
    value
  ) => {
    setForm((previous) => {
      const seasons = [...previous.seasons];
      const episodes = [...seasons[seasonIndex].episodes];
      const subtitles = [
        ...episodes[episodeIndex].subtitles,
      ];

      subtitles[subtitleIndex] = {
        ...subtitles[subtitleIndex],
        [field]: value,
      };

      episodes[episodeIndex] = {
        ...episodes[episodeIndex],
        subtitles,
      };

      seasons[seasonIndex] = {
        ...seasons[seasonIndex],
        episodes,
      };

      return {
        ...previous,
        seasons,
      };
    });
  };

  const addEpisodeSubtitle = (seasonIndex, episodeIndex) => {
    setForm((previous) => {
      const seasons = [...previous.seasons];
      const episodes = [...seasons[seasonIndex].episodes];

      episodes[episodeIndex] = {
        ...episodes[episodeIndex],
        subtitles: [
          ...episodes[episodeIndex].subtitles,
          {
            language: "Hindi",
            label: "Hindi",
            url: "",
          },
        ],
      };

      seasons[seasonIndex] = {
        ...seasons[seasonIndex],
        episodes,
      };

      return {
        ...previous,
        seasons,
      };
    });
  };

  const removeEpisodeSubtitle = (
    seasonIndex,
    episodeIndex,
    subtitleIndex
  ) => {
    setForm((previous) => {
      const seasons = [...previous.seasons];
      const episodes = [...seasons[seasonIndex].episodes];

      episodes[episodeIndex] = {
        ...episodes[episodeIndex],
        subtitles:
          episodes[episodeIndex].subtitles.filter(
            (_, index) => index !== subtitleIndex
          ),
      };

      seasons[seasonIndex] = {
        ...seasons[seasonIndex],
        episodes,
      };

      return {
        ...previous,
        seasons,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentYear = new Date().getFullYear();
    const year = Number(form.year);
    const rating = form.rating === "" ? 0 : Number(form.rating);

    if (!form.title.trim()) {
      toast.error("Movie title is required.");
      return;
    }

    if (!form.description.trim()) {
      toast.error("Movie description is required.");
      return;
    }

    if (!Number.isInteger(year) || year < 1888 || year > currentYear + 1) {
      toast.error("Please enter a valid release year.");
      return;
    }

    if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
      toast.error("Rating must be between 0 and 10.");
      return;
    }

    if (!form.language.trim()) {
      toast.error("Language is required.");
      return;
    }

    if (!form.poster.trim() || !isUrl(form.poster.trim())) {
      toast.error("Please enter a valid poster URL.");
      return;
    }

    for (const field of ["backdrop", "trailer"]) {
      if (form[field].trim() && !isUrl(form[field].trim())) {
        toast.error("Please enter a valid URL.");
        return;
      }
    }

    if (form.type === "series") {
      const seasonNumbers = form.seasons.map((season) => Number(season.seasonNumber));

      if (seasonNumbers.some((number) => !Number.isInteger(number) || number < 1)) {
        toast.error("Season number must be a positive integer.");
        return;
      }

      if (new Set(seasonNumbers).size !== seasonNumbers.length) {
        toast.error("Season number must be unique.");
        return;
      }

      for (const season of form.seasons) {
        const episodeNumbers = season.episodes.map((episode) => Number(episode.episodeNumber));

        if (episodeNumbers.some((number) => !Number.isInteger(number) || number < 1)) {
          toast.error("Episode number must be a positive integer.");
          return;
        }

        if (new Set(episodeNumbers).size !== episodeNumbers.length) {
          toast.error("Episode number must be unique within a season.");
          return;
        }

        for (const episode of season.episodes) {
          if (!episode.title.trim()) {
            toast.error("Episode title is required.");
            return;
          }

          if (episode.thumbnail.trim() && !isUrl(episode.thumbnail.trim())) {
            toast.error("Please enter a valid thumbnail URL.");
            return;
          }

          const sourceUrls = episode.videoSources
            .filter((source) => source.url.trim())
            .map((source) => source.url.trim().toLowerCase());

          if (new Set(sourceUrls).size !== sourceUrls.length) {
            toast.error("Episode video source URLs must be unique.");
            return;
          }

          if (episode.videoSources.some((source) => source.url.trim() && !isUrl(source.url.trim()))) {
            toast.error("Please enter a valid video URL.");
            return;
          }

          const subtitleUrls = episode.subtitles
            .filter((subtitle) => subtitle.url.trim())
            .map((subtitle) => subtitle.url.trim().toLowerCase());

          if (new Set(subtitleUrls).size !== subtitleUrls.length) {
            toast.error("Episode subtitle URLs must be unique.");
            return;
          }

          if (episode.subtitles.some((subtitle) => subtitle.url.trim() && (!subtitle.language.trim() || !isUrl(subtitle.url.trim())))) {
            toast.error("Please enter a valid subtitle URL.");
            return;
          }
        }
      }
    }

    try {
      setSaving(true);

      const token = localStorage.getItem(
        "errorcinema_admin_token"
      );

      const cleanedSources = form.videoSources
        .filter((source) => source.url.trim())
        .map((source) => ({
          quality: source.quality,
          format: source.format,
          url: source.url.trim(),
        }));

      const sourceUrls = cleanedSources.map((source) => source.url.toLowerCase());

      if (new Set(sourceUrls).size !== sourceUrls.length) {
        toast.error("Video source URLs must be unique.");
        return;
      }

      if (cleanedSources.some((source) => !isUrl(source.url))) {
        toast.error("Please enter a valid video source URL.");
        return;
      }

      const cleanedSubtitles = form.subtitles
        .filter((subtitle) => subtitle.url.trim())
        .map((subtitle) => ({
          language: subtitle.language.trim(),
          label: subtitle.label.trim() || subtitle.language.trim(),
          url: subtitle.url.trim(),
        }));

      const subtitleUrls = cleanedSubtitles.map((subtitle) => subtitle.url.toLowerCase());

      if (cleanedSubtitles.some((subtitle) => !subtitle.language)) {
        toast.error("Subtitle language is required.");
        return;
      }

      if (new Set(subtitleUrls).size !== subtitleUrls.length) {
        toast.error("Subtitle URLs must be unique.");
        return;
      }

      if (cleanedSubtitles.some((subtitle) => !isUrl(subtitle.url))) {
        toast.error("Please enter a valid subtitle URL.");
        return;
      }

      const cleanedSeasons = [...form.seasons]
        .sort((a, b) => Number(a.seasonNumber) - Number(b.seasonNumber))
        .map((season) => ({
        ...(season._id ? { _id: season._id } : {}),
        seasonNumber: Number(season.seasonNumber),
        title: season.title.trim(),

        episodes: [...season.episodes]
          .sort((a, b) => Number(a.episodeNumber) - Number(b.episodeNumber))
          .map((episode) => ({
          ...(episode._id ? { _id: episode._id } : {}),
          episodeNumber: Number(episode.episodeNumber),
          title: episode.title.trim(),
          description: episode.description.trim(),
          duration: episode.duration.trim(),
          thumbnail: episode.thumbnail.trim(),

          videoSources: episode.videoSources
            .filter((source) => source.url.trim())
            .map((source) => ({
              quality: source.quality,
              format: source.format,
              url: source.url.trim(),
            })),

          subtitles: episode.subtitles
            .filter((subtitle) => subtitle.url.trim())
            .map((subtitle) => ({
              language: subtitle.language.trim(),
              label: subtitle.label.trim() || subtitle.language.trim(),
              url: subtitle.url.trim(),
            })),

          published: Boolean(episode.published),
          })),
        }));

      const payload = {
        type: form.type,

        title: form.title.trim(),
        description: form.description.trim(),
        year,
        rating,
        duration: form.duration.trim(),

        genres: uniqueTrimmed(form.genres.split(",")),

        language: form.language.trim(),
        country: form.country.trim(),
        certification: form.certification.trim(),

        poster: form.poster.trim(),
        backdrop: form.backdrop.trim(),
        trailer: form.trailer.trim(),

        director: form.director.trim(),

        cast: uniqueTrimmed(form.cast.split(",")),

        featured: form.featured,
        published: form.published,

        videoSources:
          form.type === "movie" ? cleanedSources : [],

        subtitles:
          form.type === "movie" ? cleanedSubtitles : [],

        seasons:
          form.type === "series" ? cleanedSeasons : [],
      };

      await api.put(`/movies/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success(
        form.type === "series"
          ? "Series updated successfully"
          : "Movie updated successfully"
      );

      navigate("/admin/movies");
    } catch (error) {
      console.error("Update content error:", error);

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

        navigate("/admin/login", { replace: true });
        return;
      }

      toast.error(
        error.response?.data?.message ||
          "Failed to update content"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="flex min-h-screen items-center justify-center text-gray-400">
          Loading content...
        </div>
      </div>
    );
  }

  const isSeries = form.type === "series";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="border-b border-white/10 bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <div>
            <Link
              to="/admin/movies"
              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
            >
              <ArrowLeft size={17} />
              Back to Content
            </Link>

            <h1 className="text-2xl font-bold md:text-3xl">
              {isSeries ? "Edit Series" : "Edit Movie"}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {isSeries
                ? "Manage series information, seasons and episodes."
                : "Manage movie information and video sources."}
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl p-5 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-zinc-900 p-5 md:p-6">
            <h2 className="mb-5 text-lg font-semibold">
              {isSeries
                ? "Series Information"
                : "Basic Information"}
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-gray-400">
                  Title
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="admin-input"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-gray-400">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="admin-input min-h-32 resize-y"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Year
                </label>

                <input
                  name="year"
                  type="number"
                  value={form.year}
                  onChange={handleChange}
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Rating
                </label>

                <input
                  name="rating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={form.rating}
                  onChange={handleChange}
                  className="admin-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  {isSeries ? "Series Duration" : "Movie Duration"}
                </label>

                <input
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder={isSeries ? "1h 20m" : "2h 10m"}
                />

                {isSeries && (
                  <p className="mt-2 text-xs text-gray-600">
                    Series metadata duration; episode duration is separate.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Language
                </label>

                <input
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Country
                </label>

                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="admin-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Certification
                </label>

                <input
                  name="certification"
                  value={form.certification}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="U / UA / A / TV-14"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-gray-400">
                  Genres
                </label>

                <input
                  name="genres"
                  value={form.genres}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="Action, Comedy, Drama"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-zinc-900 p-5 md:p-6">
            <h2 className="mb-5 text-lg font-semibold">
              Images & Credits
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Poster URL
                </label>

                <input
                  name="poster"
                  value={form.poster}
                  onChange={handleChange}
                  className="admin-input"
                  required
                />

                <UrlPreview value={form.poster} alt="Poster" />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Backdrop URL
                </label>

                <input
                  name="backdrop"
                  value={form.backdrop}
                  onChange={handleChange}
                  className="admin-input"
                />

                <UrlPreview value={form.backdrop} alt="Backdrop" />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Trailer URL
                </label>

                <input
                  name="trailer"
                  value={form.trailer}
                  onChange={handleChange}
                  className="admin-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Director
                </label>

                <input
                  name="director"
                  value={form.director}
                  onChange={handleChange}
                  className="admin-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-gray-400">
                  Cast
                </label>

                <input
                  name="cast"
                  value={form.cast}
                  onChange={handleChange}
                  className="admin-input"
                />
              </div>
            </div>
          </section>

          {!isSeries && (
            <section className="rounded-xl border border-white/10 bg-zinc-900 p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Video Sources
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Use only video sources you are authorized
                    to stream.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addSource}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
                >
                  <Plus size={17} />
                  Add Quality
                </button>
              </div>

              <div className="space-y-4">
                {form.videoSources.map((source, index) => (
                  <div
                    key={`${source.quality}-${index}`}
                    className="rounded-lg border border-white/10 bg-zinc-950 p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-[160px_140px_1fr_auto] md:items-end">
                      <div>
                        <label className="mb-2 block text-xs text-gray-500">
                          Quality
                        </label>

                        <select
                          value={source.quality}
                          onChange={(e) =>
                            handleSourceChange(
                              index,
                              "quality",
                              e.target.value
                            )
                          }
                          className="admin-input"
                        >
                          <option value="360p">360p</option>
                          <option value="480p">480p</option>
                          <option value="720p">720p</option>
                          <option value="1080p">1080p</option>
                          <option value="4K">4K</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs text-gray-500">
                          Format
                        </label>

                        <select
                          value={source.format}
                          onChange={(e) =>
                            handleSourceChange(
                              index,
                              "format",
                              e.target.value
                            )
                          }
                          className="admin-input"
                        >
                          <option value="mp4">MP4</option>
                          <option value="hls">HLS</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs text-gray-500">
                          Video URL
                        </label>

                        <input
                          value={source.url}
                          onChange={(e) =>
                            handleSourceChange(
                              index,
                              "url",
                              e.target.value
                            )
                          }
                          className="admin-input"
                          placeholder="https://..."
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSource(index)}
                        className="flex h-12 items-center justify-center rounded-lg border border-red-500/20 px-4 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!isSeries && (
            <section className="rounded-xl border border-white/10 bg-zinc-900 p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Subtitles</h2>
                  <p className="mt-1 text-xs text-gray-500">Manage authorized subtitle URLs.</p>
                </div>

                <button
                  type="button"
                  onClick={addSubtitle}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
                >
                  <Plus size={17} /> Add Subtitle
                </button>
              </div>

              <div className="space-y-4">
                {form.subtitles.length === 0 && (
                  <p className="rounded-lg border border-dashed border-white/10 p-5 text-center text-sm text-gray-500">
                    No movie subtitles added.
                  </p>
                )}

                {form.subtitles.map((subtitle, index) => (
                  <div key={index} className="rounded-lg border border-white/10 bg-zinc-950 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold">Subtitle {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeSubtitle(index)}
                        className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10"
                        aria-label={`Remove subtitle ${index + 1}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_1fr_2fr]">
                      <input
                        value={subtitle.language}
                        onChange={(event) => handleSubtitleChange(index, "language", event.target.value)}
                        placeholder="Language"
                        className="admin-input"
                        aria-label={`Subtitle ${index + 1} language`}
                      />
                      <input
                        value={subtitle.label}
                        onChange={(event) => handleSubtitleChange(index, "label", event.target.value)}
                        placeholder="Label"
                        className="admin-input"
                        aria-label={`Subtitle ${index + 1} label`}
                      />
                      <input
                        type="url"
                        value={subtitle.url}
                        onChange={(event) => handleSubtitleChange(index, "url", event.target.value)}
                        placeholder="Authorized subtitle URL"
                        className="admin-input"
                        aria-label={`Subtitle ${index + 1} URL`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {isSeries && (
            <section className="rounded-xl border border-white/10 bg-zinc-900 p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Seasons & Episodes
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Manage seasons, episodes and authorized
                    video sources.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addSeason}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500"
                >
                  <Plus size={17} />
                  Add Season
                </button>
              </div>

              {form.seasons.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-gray-500">
                  No seasons added yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {form.seasons.map((season, seasonIndex) => (
                    <div
                      key={season._id || seasonIndex}
                      className="rounded-xl border border-white/10 bg-zinc-950 p-5"
                    >
                      <div className="mb-5 grid gap-4 md:grid-cols-[180px_1fr_auto] md:items-end">
                        <div>
                          <label className="mb-2 block text-xs text-gray-500">
                            Season
                          </label>

                          <input
                            type="number"
                            min="1"
                            value={season.seasonNumber}
                            onChange={(e) =>
                              handleSeasonChange(
                                seasonIndex,
                                "seasonNumber",
                                e.target.value
                              )
                            }
                            className="admin-input"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-xs text-gray-500">
                            Season Title
                          </label>

                          <input
                            value={season.title}
                            onChange={(e) =>
                              handleSeasonChange(
                                seasonIndex,
                                "title",
                                e.target.value
                              )
                            }
                            className="admin-input"
                            placeholder="Season 1"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeSeason(seasonIndex)
                          }
                          className="flex h-12 items-center justify-center rounded-lg border border-red-500/20 px-4 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold">
                          Episodes
                        </h3>

                        <button
                          type="button"
                          onClick={() =>
                            addEpisode(seasonIndex)
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
                        >
                          <Plus size={16} />
                          Add Episode
                        </button>
                      </div>

                      {season.episodes.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-gray-500">
                          No episodes added.
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {season.episodes.map(
                            (episode, episodeIndex) => (
                              <div
                                key={
                                  episode._id ||
                                  episodeIndex
                                }
                                className="rounded-xl border border-white/10 bg-zinc-900 p-5"
                              >
                                <div className="mb-5 flex items-center justify-between">
                                  <h4 className="font-semibold">
                                    Episode{" "}
                                    {episode.episodeNumber}
                                  </h4>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeEpisode(
                                        seasonIndex,
                                        episodeIndex
                                      )
                                    }
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <label className="mb-2 block text-xs text-gray-500">
                                      Episode Number
                                    </label>

                                    <input
                                      type="number"
                                      min="1"
                                      value={
                                        episode.episodeNumber
                                      }
                                      onChange={(e) =>
                                        handleEpisodeChange(
                                          seasonIndex,
                                          episodeIndex,
                                          "episodeNumber",
                                          e.target.value
                                        )
                                      }
                                      className="admin-input"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-xs text-gray-500">
                                      Episode Title
                                    </label>

                                    <input
                                      value={episode.title}
                                      onChange={(e) =>
                                        handleEpisodeChange(
                                          seasonIndex,
                                          episodeIndex,
                                          "title",
                                          e.target.value
                                        )
                                      }
                                      className="admin-input"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-xs text-gray-500">
                                      Duration
                                    </label>

                                    <input
                                      value={
                                        episode.duration
                                      }
                                      onChange={(e) =>
                                        handleEpisodeChange(
                                          seasonIndex,
                                          episodeIndex,
                                          "duration",
                                          e.target.value
                                        )
                                      }
                                      className="admin-input"
                                      placeholder="45 min"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-xs text-gray-500">
                                      Thumbnail URL
                                    </label>

                                    <input
                                      type="url"
                                      value={
                                        episode.thumbnail
                                      }
                                      onChange={(e) =>
                                        handleEpisodeChange(
                                          seasonIndex,
                                          episodeIndex,
                                          "thumbnail",
                                          e.target.value
                                        )
                                      }
                                      className="admin-input"
                                    />

                                    <UrlPreview
                                      value={episode.thumbnail}
                                      alt="Episode thumbnail"
                                    />
                                  </div>

                                  <div className="md:col-span-2">
                                    <label className="mb-2 block text-xs text-gray-500">
                                      Description
                                    </label>

                                    <textarea
                                      value={
                                        episode.description
                                      }
                                      onChange={(e) =>
                                        handleEpisodeChange(
                                          seasonIndex,
                                          episodeIndex,
                                          "description",
                                          e.target.value
                                        )
                                      }
                                      className="admin-input min-h-24 resize-y"
                                    />
                                  </div>
                                </div>

                                <div className="mt-6">
                                  <div className="mb-3 flex items-center justify-between">
                                    <h5 className="text-sm font-semibold">
                                      Episode Video Sources
                                    </h5>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        addEpisodeSource(
                                          seasonIndex,
                                          episodeIndex
                                        )
                                      }
                                      className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs hover:bg-white/15"
                                    >
                                      <Plus size={15} />
                                      Add Quality
                                    </button>
                                  </div>

                                  <div className="space-y-3">
                                    {episode.videoSources.map(
                                      (
                                        source,
                                        sourceIndex
                                      ) => (
                                        <div
                                          key={`${source.quality}-${sourceIndex}`}
                                          className="grid gap-3 md:grid-cols-[140px_120px_1fr_auto]"
                                        >
                                          <select
                                            value={
                                              source.quality
                                            }
                                            onChange={(e) =>
                                              handleEpisodeSourceChange(
                                                seasonIndex,
                                                episodeIndex,
                                                sourceIndex,
                                                "quality",
                                                e.target.value
                                              )
                                            }
                                            className="admin-input"
                                          >
                                            <option value="360p">
                                              360p
                                            </option>
                                            <option value="480p">
                                              480p
                                            </option>
                                            <option value="720p">
                                              720p
                                            </option>
                                            <option value="1080p">
                                              1080p
                                            </option>
                                            <option value="4K">
                                              4K
                                            </option>
                                          </select>

                                          <select
                                            value={
                                              source.format
                                            }
                                            onChange={(e) =>
                                              handleEpisodeSourceChange(
                                                seasonIndex,
                                                episodeIndex,
                                                sourceIndex,
                                                "format",
                                                e.target.value
                                              )
                                            }
                                            className="admin-input"
                                          >
                                            <option value="mp4">
                                              MP4
                                            </option>
                                            <option value="hls">
                                              HLS
                                            </option>
                                          </select>

                                          <input
                                            value={source.url}
                                            onChange={(e) =>
                                              handleEpisodeSourceChange(
                                                seasonIndex,
                                                episodeIndex,
                                                sourceIndex,
                                                "url",
                                                e.target.value
                                              )
                                            }
                                            className="admin-input"
                                            placeholder="Authorized video URL"
                                          />

                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeEpisodeSource(
                                                seasonIndex,
                                                episodeIndex,
                                                sourceIndex
                                              )
                                            }
                                            className="flex h-12 items-center justify-center rounded-lg border border-red-500/20 px-4 text-red-400 hover:bg-red-500/10"
                                          >
                                            <Trash2
                                              size={17}
                                            />
                                          </button>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>

                                <div className="mt-6">
                                  <div className="mb-3 flex items-center justify-between">
                                    <h5 className="text-sm font-semibold">
                                      Episode Subtitles
                                    </h5>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        addEpisodeSubtitle(
                                          seasonIndex,
                                          episodeIndex
                                        )
                                      }
                                      className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs hover:bg-white/15"
                                    >
                                      <Plus size={15} />
                                      Add Subtitle
                                    </button>
                                  </div>

                                  <div className="space-y-3">
                                    {episode.subtitles.map(
                                      (
                                        subtitle,
                                        subtitleIndex
                                      ) => (
                                        <div
                                          key={subtitleIndex}
                                          className="grid gap-3 md:grid-cols-[160px_160px_1fr_auto]"
                                        >
                                          <input
                                            value={
                                              subtitle.language
                                            }
                                            onChange={(e) =>
                                              handleEpisodeSubtitleChange(
                                                seasonIndex,
                                                episodeIndex,
                                                subtitleIndex,
                                                "language",
                                                e.target.value
                                              )
                                            }
                                            className="admin-input"
                                            placeholder="Language"
                                          />

                                          <input
                                            value={
                                              subtitle.label
                                            }
                                            onChange={(e) =>
                                              handleEpisodeSubtitleChange(
                                                seasonIndex,
                                                episodeIndex,
                                                subtitleIndex,
                                                "label",
                                                e.target.value
                                              )
                                            }
                                            className="admin-input"
                                            placeholder="Label"
                                          />

                                          <input
                                            value={subtitle.url}
                                            onChange={(e) =>
                                              handleEpisodeSubtitleChange(
                                                seasonIndex,
                                                episodeIndex,
                                                subtitleIndex,
                                                "url",
                                                e.target.value
                                              )
                                            }
                                            className="admin-input"
                                            placeholder="Subtitle URL"
                                          />

                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeEpisodeSubtitle(
                                                seasonIndex,
                                                episodeIndex,
                                                subtitleIndex
                                              )
                                            }
                                            className="flex h-12 items-center justify-center rounded-lg border border-red-500/20 px-4 text-red-400 hover:bg-red-500/10"
                                          >
                                            <Trash2
                                              size={17}
                                            />
                                          </button>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>

                                <label className="mt-5 flex cursor-pointer items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={
                                      episode.published
                                    }
                                    onChange={(e) =>
                                      handleEpisodeChange(
                                        seasonIndex,
                                        episodeIndex,
                                        "published",
                                        e.target.checked
                                      )
                                    }
                                    className="h-4 w-4 accent-red-600"
                                  />

                                  <span className="text-sm">
                                    Publish Episode
                                  </span>
                                </label>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="rounded-xl border border-white/10 bg-zinc-900 p-5 md:p-6">
            <h2 className="mb-5 text-lg font-semibold">
              Publishing
            </h2>

            <div className="flex flex-col gap-4 sm:flex-row">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-zinc-950 p-4">
                <input
                  type="checkbox"
                  name="featured"
                  checked={form.featured}
                  onChange={handleChange}
                  className="h-4 w-4 accent-red-600"
                />

                <span>
                  <span className="block text-sm font-medium">
                    Featured
                  </span>

                  <span className="block text-xs text-gray-500">
                    Show in featured sections
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-zinc-950 p-4">
                <input
                  type="checkbox"
                  name="published"
                  checked={form.published}
                  onChange={handleChange}
                  className="h-4 w-4 accent-red-600"
                />

                <span>
                  <span className="block text-sm font-medium">
                    Published
                  </span>

                  <span className="block text-xs text-gray-500">
                    Make content visible publicly
                  </span>
                </span>
              </label>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              to="/admin/movies"
              className="flex min-h-12 items-center justify-center rounded-lg border border-white/10 px-6 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-red-600 px-6 text-sm font-semibold hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function UrlPreview({ value, alt }) {
  if (!value) return null;

  return (
    <div className="mt-3 h-28 overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
      <img
        src={value}
        alt={`${alt} preview`}
        className="h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

export default EditMovie;

