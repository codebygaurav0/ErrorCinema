import { ArrowLeft, Check, Film, Image, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

const qualities = ["360p", "480p", "720p", "1080p", "4K"];

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

const genreSuggestions = [
  "Action",
  "Comedy",
  "Drama",
  "Thriller",
  "Romance",
  "Horror",
  "Animation",
  "Sci-Fi",
  "Adventure",
  "Crime",
  "Fantasy",
  "Mystery",
];

const initialForm = {
  title: "",
  description: "",
  year: "",
  rating: "",
  duration: "",
  genres: [],
  language: "",
  country: "",
  certification: "",
  poster: "",
  backdrop: "",
  trailer: "",
  director: "",
  cast: [],
  featured: false,
  published: false,
};

function isUrl(value) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function uniqueTrimmed(values) {
  return [
    ...new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    ),
  ];
}

function AddMovie() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [genreInput, setGenreInput] = useState("");
  const [castInput, setCastInput] = useState("");
  const [videoSources, setVideoSources] = useState([]);
  const [subtitles, setSubtitles] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const addGenre = (value) => {
    const genre = value.trim();

    if (!genre) return;

    setForm((previous) => ({
      ...previous,
      genres: uniqueTrimmed([
        ...previous.genres,
        genre,
      ]),
    }));

    setGenreInput("");
  };

  const addCast = (value) => {
    const member = value.trim();

    if (!member) return;

    setForm((previous) => ({
      ...previous,
      cast: uniqueTrimmed([
        ...previous.cast,
        member,
      ]),
    }));

    setCastInput("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const currentYear =
      new Date().getFullYear();

    const year = Number(form.year);

    const rating =
      form.rating === ""
        ? 0
        : Number(form.rating);

    if (!form.title.trim()) {
      toast.error("Movie title is required.");
      return;
    }

    if (!form.description.trim()) {
      toast.error(
        "Movie description is required."
      );
      return;
    }

    if (
      !Number.isInteger(year) ||
      year < 1888 ||
      year > currentYear + 1
    ) {
      toast.error(
        "Please enter a valid release year."
      );
      return;
    }

    if (
      !Number.isFinite(rating) ||
      rating < 0 ||
      rating > 10
    ) {
      toast.error(
        "Rating must be between 0 and 10."
      );
      return;
    }

    if (!form.language.trim()) {
      toast.error("Language is required.");
      return;
    }

    if (
      !form.poster.trim() ||
      !isUrl(form.poster.trim())
    ) {
      toast.error(
        "Please enter a valid poster URL."
      );
      return;
    }

    for (const field of [
      "backdrop",
      "trailer",
    ]) {
      if (
        form[field].trim() &&
        !isUrl(form[field].trim())
      ) {
        toast.error(
          `Please enter a valid ${field} URL.`
        );
        return;
      }
    }

    const cleanedSources =
      videoSources
        .filter((source) =>
          source.url.trim()
        )
        .map((source) => ({
          quality: source.quality,
          format: source.format,
          url: source.url.trim(),
        }));

    const sourceUrls =
      cleanedSources.map((source) =>
        source.url.toLowerCase()
      );

    if (
      new Set(sourceUrls).size !==
      sourceUrls.length
    ) {
      toast.error(
        "Video source URLs must be unique."
      );
      return;
    }

    if (
      cleanedSources.some(
        (source) => !isUrl(source.url)
      )
    ) {
      toast.error(
        "Please enter a valid video source URL."
      );
      return;
    }

    const cleanedSubtitles =
      subtitles
        .filter((subtitle) =>
          subtitle.url.trim()
        )
        .map((subtitle) => ({
          language:
            subtitle.language.trim(),
          label:
            subtitle.label.trim() ||
            subtitle.language.trim(),
          url: subtitle.url.trim(),
        }));

    const subtitleUrls =
      cleanedSubtitles.map((subtitle) =>
        subtitle.url.toLowerCase()
      );

    if (
      cleanedSubtitles.some(
        (subtitle) => !subtitle.language
      )
    ) {
      toast.error(
        "Subtitle language is required."
      );
      return;
    }

    if (
      new Set(subtitleUrls).size !==
      subtitleUrls.length
    ) {
      toast.error(
        "Subtitle URLs must be unique."
      );
      return;
    }

    if (
      cleanedSubtitles.some(
        (subtitle) => !isUrl(subtitle.url)
      )
    ) {
      toast.error(
        "Please enter a valid subtitle URL."
      );
      return;
    }

    const token = localStorage.getItem(
      "errorcinema_admin_token"
    );

    if (!token) {
      toast.error("Admin login required");

      navigate("/admin/login", {
        replace: true,
      });

      return;
    }

    const payload = {
      type: "movie",
      title: form.title.trim(),
      description: form.description.trim(),
      year,
      rating,
      duration: form.duration.trim(),
      genres: uniqueTrimmed(form.genres),
      language: form.language.trim(),
      country: form.country.trim(),
      certification:
        form.certification.trim(),
      poster: form.poster.trim(),
      backdrop: form.backdrop.trim(),
      trailer: form.trailer.trim(),
      director: form.director.trim(),
      cast: uniqueTrimmed(form.cast),
      videoSources: cleanedSources,
      subtitles: cleanedSubtitles,
      seasons: [],
      featured: Boolean(form.featured),
      published: Boolean(form.published),
    };

    try {
      setSaving(true);

      await api.post(
        "/movies",
        payload,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      toast.success(
        "Movie created successfully"
      );

      navigate("/admin/movies");
    } catch (error) {
      console.error(
        "Create movie error:",
        error
      );

      if (
        [401, 403].includes(
          error.response?.status
        )
      ) {
        localStorage.removeItem(
          "errorcinema_admin_token"
        );

        localStorage.removeItem(
          "errorcinema_admin_user"
        );

        toast.error(
          "You are not authorized."
        );

        navigate("/admin/login", {
          replace: true,
        });

        return;
      }

      toast.error(
        error.response?.data?.message ||
          "Unable to create movie."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        <header className="mb-7 flex items-start gap-4">
          <button
            type="button"
            onClick={() =>
              navigate("/admin/movies")
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Back to movies"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <h1 className="text-2xl font-black sm:text-3xl">
              Add Movie
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Add a new movie to your
              ErrorCinema library.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <Section
            icon={<Film size={19} />}
            title="Basic Information"
            description="Required movie metadata and classification."
          >
            <div className="grid gap-5 md:grid-cols-2">

              <Field
                label="Movie Title *"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter movie title"
                className="md:col-span-2"
              />

              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Description *
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Enter movie description"
                  className="admin-input resize-y"
                />
              </div>

              <Field
                label="Release Year *"
                name="year"
                type="number"
                min="1888"
                max={
                  new Date().getFullYear() + 1
                }
                value={form.year}
                onChange={handleChange}
                placeholder="2026"
              />

              <Field
                label="Rating"
                name="rating"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={form.rating}
                onChange={handleChange}
                placeholder="0 - 10"
              />

              <Field
                label="Duration"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="2h 10m"
                help="Metadata duration only; player time is separate."
              />

              <Field
                label="Language *"
                name="language"
                value={form.language}
                onChange={handleChange}
                placeholder="English"
              />

              <Field
                label="Country"
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="United States"
              />

              <Field
                label="Certification"
                name="certification"
                value={form.certification}
                onChange={handleChange}
                placeholder="U / UA / A"
              />

              <TagEditor
                label="Genres"
                values={form.genres}
                input={genreInput}
                setInput={setGenreInput}
                onAdd={addGenre}
                onRemove={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    genres:
                      previous.genres.filter(
                        (item) =>
                          item !== value
                      ),
                  }))
                }
                suggestions={
                  genreSuggestions
                }
                className="md:col-span-2"
              />

            </div>
          </Section>

          <Section
            icon={<Image size={19} />}
            title="Media"
            description="Use owned, licensed, public-domain, or otherwise authorized URLs."
          >
            <div className="grid gap-5 md:grid-cols-2">

              <UrlField
                label="Poster URL *"
                name="poster"
                value={form.poster}
                onChange={handleChange}
              />

              <UrlField
                label="Backdrop URL"
                name="backdrop"
                value={form.backdrop}
                onChange={handleChange}
              />

              <Field
                label="Trailer URL"
                name="trailer"
                type="url"
                value={form.trailer}
                onChange={handleChange}
                placeholder="https://example.com/trailer.mp4"
                className="md:col-span-2"
              />

            </div>
          </Section>

          <Section
            title="Credits"
            description="Director and cast information."
          >
            <div className="grid gap-5 md:grid-cols-2">

              <Field
                label="Director"
                name="director"
                value={form.director}
                onChange={handleChange}
                placeholder="Director name"
              />

              <TagEditor
                label="Cast"
                values={form.cast}
                input={castInput}
                setInput={setCastInput}
                onAdd={addCast}
                onRemove={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    cast:
                      previous.cast.filter(
                        (item) =>
                          item !== value
                      ),
                  }))
                }
                placeholder="Actor name"
              />

            </div>
          </Section>

          <SourceSection
            sources={videoSources}
            setSources={setVideoSources}
          />

          <SubtitleSection
            subtitles={subtitles}
            setSubtitles={setSubtitles}
          />

          <Publishing
            form={form}
            onChange={handleChange}
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                navigate("/admin/movies")
              }
              className="min-h-12 rounded-lg border border-white/10 px-6 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-red-600 px-6 text-sm font-bold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check size={18} />

              {saving
                ? "Creating..."
                : "Create Movie"}
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900 p-5 sm:p-6">

      <div className="mb-6 flex items-center gap-3">

        {icon && (
          <div className="rounded-lg bg-red-600/10 p-2 text-red-500">
            {icon}
          </div>
        )}

        <div>
          <h2 className="font-bold">
            {title}
          </h2>

          <p className="mt-1 text-xs text-gray-600">
            {description}
          </p>
        </div>

      </div>

      {children}

    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  help,
  className = "",
  ...props
}) {
  return (
    <div className={className}>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-gray-300"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        className="admin-input"
        {...props}
      />

      {help && (
        <p className="mt-2 text-xs text-gray-600">
          {help}
        </p>
      )}

    </div>
  );
}

function UrlField({
  label,
  name,
  value,
  onChange,
}) {
  return (
    <div>

      <Field
        label={label}
        name={name}
        type="url"
        value={value}
        onChange={onChange}
        placeholder="https://example.com/image.jpg"
      />

      <UrlPreview
        value={value}
        alt={label}
      />

    </div>
  );
}

function UrlPreview({
  value,
  alt,
}) {
  if (!value) return null;

  return (
    <div className="mt-3 h-28 overflow-hidden rounded-lg border border-white/10 bg-zinc-950">

      <img
        src={value}
        alt={`${alt} preview`}
        className="h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.style.display =
            "none";
        }}
      />

    </div>
  );
}

function TagEditor({
  label,
  values,
  input,
  setInput,
  onAdd,
  onRemove,
  suggestions = [],
  placeholder = "Add and press Enter",
  className = "",
}) {
  return (
    <div className={className}>

      <label className="mb-2 block text-sm font-medium text-gray-300">
        {label}
      </label>

      <div className="flex gap-2">

        <input
          value={input}
          onChange={(event) =>
            setInput(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAdd(input);
            }
          }}
          placeholder={placeholder}
          className="admin-input"
        />

        <button
          type="button"
          onClick={() => onAdd(input)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/15"
          aria-label={`Add ${label}`}
        >
          <Plus size={18} />
        </button>

      </div>

      <div className="mt-3 flex flex-wrap gap-2">

        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1.5 text-xs text-red-300"
          >
            {value}

            <button
              type="button"
              onClick={() =>
                onRemove(value)
              }
              aria-label={`Remove ${value}`}
            >
              <Trash2 size={13} />
            </button>

          </span>
        ))}

      </div>

      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">

          {suggestions
            .filter(
              (suggestion) =>
                !values.includes(
                  suggestion
                )
            )
            .map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                onClick={() =>
                  onAdd(suggestion)
                }
                className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                + {suggestion}
              </button>
            ))}

        </div>
      )}

    </div>
  );
}

function SourceSection({
  sources,
  setSources,
}) {
  const update = (
    index,
    field,
    value
  ) => {
    setSources((current) =>
      current.map(
        (source, sourceIndex) =>
          sourceIndex === index
            ? {
                ...source,
                [field]: value,
              }
            : source
      )
    );
  };

  return (
    <Section
      title="Video Sources"
      description="Only add authorized streaming URLs. Sources are optional for drafts."
    >

      <div className="mb-5 flex justify-end">

        <button
          type="button"
          onClick={() =>
            setSources((current) => [
              ...current,
              {
                ...emptySource,
                quality: "720p",
              },
            ])
          }
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
        >
          <Plus size={17} />
          Add Video Source
        </button>

      </div>

      <div className="space-y-4">

        {sources.map(
          (source, index) => (
            <div
              key={index}
              className="rounded-lg border border-white/10 bg-zinc-950 p-4"
            >

              <div className="mb-3 flex items-center justify-between">

                <p className="text-sm font-semibold">
                  Source {index + 1}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setSources(
                      (current) =>
                        current.filter(
                          (_, sourceIndex) =>
                            sourceIndex !==
                            index
                        )
                    )
                  }
                  className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10"
                  aria-label={`Remove video source ${index + 1}`}
                >
                  <Trash2 size={17} />
                </button>

              </div>

              <div className="grid gap-4 md:grid-cols-[160px_140px_1fr]">

                <select
                  value={source.quality}
                  onChange={(event) =>
                    update(
                      index,
                      "quality",
                      event.target.value
                    )
                  }
                  className="admin-input"
                  aria-label={`Source ${index + 1} quality`}
                >
                  {qualities.map(
                    (quality) => (
                      <option
                        key={quality}
                        value={quality}
                      >
                        {quality}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={source.format}
                  onChange={(event) =>
                    update(
                      index,
                      "format",
                      event.target.value
                    )
                  }
                  className="admin-input"
                  aria-label={`Source ${index + 1} format`}
                >
                  <option value="mp4">
                    MP4
                  </option>

                  <option value="hls">
                    HLS
                  </option>
                </select>

                <input
                  type="url"
                  value={source.url}
                  onChange={(event) =>
                    update(
                      index,
                      "url",
                      event.target.value
                    )
                  }
                  placeholder="Authorized video URL"
                  className="admin-input"
                  aria-label={`Source ${index + 1} URL`}
                />

              </div>

            </div>
          )
        )}

      </div>
    </Section>
  );
}

function SubtitleSection({
  subtitles,
  setSubtitles,
}) {
  const update = (
    index,
    field,
    value
  ) => {
    setSubtitles((current) =>
      current.map(
        (subtitle, subtitleIndex) =>
          subtitleIndex === index
            ? {
                ...subtitle,
                [field]: value,
              }
            : subtitle
      )
    );
  };

  return (
    <Section
      title="Subtitles"
      description="Add authorized WebVTT subtitle URLs."
    >

      <div className="mb-5 flex justify-end">

        <button
          type="button"
          onClick={() =>
            setSubtitles((current) => [
              ...current,
              {
                ...emptySubtitle,
              },
            ])
          }
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
        >
          <Plus size={17} />
          Add Subtitle
        </button>

      </div>

      <div className="space-y-4">

        {subtitles.map(
          (subtitle, index) => (
            <div
              key={index}
              className="rounded-lg border border-white/10 bg-zinc-950 p-4"
            >

              <div className="mb-3 flex items-center justify-between">

                <p className="text-sm font-semibold">
                  Subtitle {index + 1}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setSubtitles(
                      (current) =>
                        current.filter(
                          (_, subtitleIndex) =>
                            subtitleIndex !==
                            index
                        )
                    )
                  }
                  className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10"
                  aria-label={`Remove subtitle ${index + 1}`}
                >
                  <Trash2 size={17} />
                </button>

              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_1fr_2fr]">

                <input
                  value={subtitle.language}
                  onChange={(event) =>
                    update(
                      index,
                      "language",
                      event.target.value
                    )
                  }
                  placeholder="Language"
                  className="admin-input"
                />

                <input
                  value={subtitle.label}
                  onChange={(event) =>
                    update(
                      index,
                      "label",
                      event.target.value
                    )
                  }
                  placeholder="Label"
                  className="admin-input"
                />

                <input
                  type="url"
                  value={subtitle.url}
                  onChange={(event) =>
                    update(
                      index,
                      "url",
                      event.target.value
                    )
                  }
                  placeholder="Authorized subtitle URL"
                  className="admin-input"
                />

              </div>

            </div>
          )
        )}

      </div>
    </Section>
  );
}

function Publishing({
  form,
  onChange,
}) {
  return (
    <Section
      title="Publishing"
      description="Control visibility and featured placement."
    >

      <div className="grid gap-3 sm:grid-cols-2">

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-zinc-950 p-4">

          <input
            type="checkbox"
            name="featured"
            checked={form.featured}
            onChange={onChange}
            className="h-4 w-4 accent-red-600"
          />

          <span>
            <span className="block text-sm font-semibold">
              Featured Movie
            </span>

            <span className="mt-1 block text-xs text-gray-600">
              Show in featured sections.
            </span>
          </span>

        </label>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-zinc-950 p-4">

          <input
            type="checkbox"
            name="published"
            checked={form.published}
            onChange={onChange}
            className="h-4 w-4 accent-red-600"
          />

          <span>
            <span className="block text-sm font-semibold">
              Publish Movie
            </span>

            <span className="mt-1 block text-xs text-gray-600">
              Make visible to users.
            </span>
          </span>

        </label>

      </div>
    </Section>
  );
}

export default AddMovie;
