import { ArrowLeft, Check, Image, Plus, Trash2, Tv } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

const qualities = ["360p", "480p", "720p", "1080p", "4K"];
const genreSuggestions = ["Action", "Comedy", "Drama", "Thriller", "Romance", "Horror", "Animation", "Sci-Fi"];
const emptySource = { quality: "1080p", format: "mp4", url: "" };
const emptySubtitle = { language: "English", label: "English", url: "" };

function isUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function unique(values) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function newEpisode(number = 1) {
  return { episodeNumber: number, title: "", description: "", duration: "", thumbnail: "", published: false, videoSources: [], subtitles: [] };
}

function newSeason(number = 1) {
  return { seasonNumber: number, title: `Season ${number}`, episodes: [] };
}

function AddSeries() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", year: "", rating: "", duration: "", genres: [], language: "", country: "", certification: "", poster: "", backdrop: "", trailer: "", director: "", cast: [], featured: false, published: false, seasons: [] });
  const [genreInput, setGenreInput] = useState("");
  const [castInput, setCastInput] = useState("");
  const [saving, setSaving] = useState(false);

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const addTag = (field, value, setInput) => {
    if (!value.trim()) return;
    setForm((current) => ({ ...current, [field]: unique([...current[field], value]) }));
    setInput("");
  };

  const addSeason = () => setForm((current) => ({ ...current, seasons: [...current.seasons, newSeason(current.seasons.length + 1)] }));
  const removeSeason = (seasonIndex) => setForm((current) => ({ ...current, seasons: current.seasons.filter((_, index) => index !== seasonIndex) }));
  const updateSeason = (seasonIndex, field, value) => setForm((current) => ({ ...current, seasons: current.seasons.map((season, index) => index === seasonIndex ? { ...season, [field]: field === "seasonNumber" ? value : value } : season) }));
  const addEpisode = (seasonIndex) => setForm((current) => ({ ...current, seasons: current.seasons.map((season, index) => index === seasonIndex ? { ...season, episodes: [...season.episodes, newEpisode(season.episodes.length + 1)] } : season) }));
  const removeEpisode = (seasonIndex, episodeIndex) => setForm((current) => ({ ...current, seasons: current.seasons.map((season, index) => index === seasonIndex ? { ...season, episodes: season.episodes.filter((_, childIndex) => childIndex !== episodeIndex) } : season) }));
  const updateEpisode = (seasonIndex, episodeIndex, field, value) => setForm((current) => ({ ...current, seasons: current.seasons.map((season, seasonIndexValue) => seasonIndexValue === seasonIndex ? { ...season, episodes: season.episodes.map((episode, episodeIndexValue) => episodeIndexValue === episodeIndex ? { ...episode, [field]: field === "published" ? value : value } : episode) } : season) }));
  const updateNested = (seasonIndex, episodeIndex, field, value, sourceIndex, nestedField) => setForm((current) => ({ ...current, seasons: current.seasons.map((season, seasonIndexValue) => seasonIndexValue === seasonIndex ? { ...season, episodes: season.episodes.map((episode, episodeIndexValue) => episodeIndexValue === episodeIndex ? { ...episode, [field]: episode[field].map((item, itemIndex) => itemIndex === sourceIndex ? { ...item, [nestedField]: value } : item) } : episode) } : season) }));
  const addNested = (seasonIndex, episodeIndex, field, value) => setForm((current) => ({ ...current, seasons: current.seasons.map((season, seasonIndexValue) => seasonIndexValue === seasonIndex ? { ...season, episodes: season.episodes.map((episode, episodeIndexValue) => episodeIndexValue === episodeIndex ? { ...episode, [field]: [...episode[field], { ...value }] } : episode) } : season) }));
  const removeNested = (seasonIndex, episodeIndex, field, nestedIndex) => setForm((current) => ({ ...current, seasons: current.seasons.map((season, seasonIndexValue) => seasonIndexValue === seasonIndex ? { ...season, episodes: season.episodes.map((episode, episodeIndexValue) => episodeIndexValue === episodeIndex ? { ...episode, [field]: episode[field].filter((_, itemIndex) => itemIndex !== nestedIndex) } : episode) } : season) }));

  const validateEpisode = (episode) => {
    if (!Number.isInteger(Number(episode.episodeNumber)) || Number(episode.episodeNumber) < 1) return "Episode number must be a positive integer.";
    if (!episode.title.trim()) return "Episode title is required.";
    const sourceUrls = episode.videoSources.filter((source) => source.url.trim()).map((source) => source.url.trim().toLowerCase());
    if (new Set(sourceUrls).size !== sourceUrls.length) return "Episode video source URLs must be unique.";
    if (episode.videoSources.some((source) => source.url.trim() && !isUrl(source.url.trim()))) return "Please enter a valid video URL.";
    const subtitleUrls = episode.subtitles.filter((subtitle) => subtitle.url.trim()).map((subtitle) => subtitle.url.trim().toLowerCase());
    if (new Set(subtitleUrls).size !== subtitleUrls.length) return "Episode subtitle URLs must be unique.";
    if (episode.subtitles.some((subtitle) => subtitle.url.trim() && (!subtitle.language.trim() || !isUrl(subtitle.url.trim())))) return "Please enter a valid subtitle URL.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const currentYear = new Date().getFullYear();
    const year = Number(form.year);
    const rating = form.rating === "" ? 0 : Number(form.rating);
    if (!form.title.trim()) return toast.error("Series title is required.");
    if (!form.description.trim()) return toast.error("Series description is required.");
    if (!Number.isInteger(year) || year < 1888 || year > currentYear + 1) return toast.error("Please enter a valid release year.");
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) return toast.error("Rating must be between 0 and 10.");
    if (!form.language.trim()) return toast.error("Language is required.");
    if (!form.poster.trim() || !isUrl(form.poster.trim())) return toast.error("Please enter a valid poster URL.");
    for (const field of ["backdrop", "trailer"]) if (form[field].trim() && !isUrl(form[field].trim())) return toast.error("Please enter a valid URL.");

    const seasonNumbers = form.seasons.map((season) => Number(season.seasonNumber));
    if (seasonNumbers.some((number) => !Number.isInteger(number) || number < 1)) return toast.error("Season number must be a positive integer.");
    if (new Set(seasonNumbers).size !== seasonNumbers.length) return toast.error("Season number must be unique.");

    for (const season of form.seasons) {
      const episodeNumbers = season.episodes.map((episode) => Number(episode.episodeNumber));
      if (new Set(episodeNumbers).size !== episodeNumbers.length) return toast.error("Episode number must be unique within a season.");
      for (const episode of season.episodes) {
        const error = validateEpisode(episode);
        if (error) return toast.error(error);
        if (episode.thumbnail.trim() && !isUrl(episode.thumbnail.trim())) return toast.error("Please enter a valid thumbnail URL.");
      }
    }

    const token = localStorage.getItem("errorcinema_admin_token");
    if (!token) { toast.error("Admin login required"); navigate("/admin/login", { replace: true }); return; }

    const seasons = form.seasons.map((season) => ({
      seasonNumber: Number(season.seasonNumber),
      title: season.title.trim(),
      episodes: season.episodes.map((episode) => ({
        episodeNumber: Number(episode.episodeNumber),
        title: episode.title.trim(),
        description: episode.description.trim(),
        duration: episode.duration.trim(),
        thumbnail: episode.thumbnail.trim(),
        published: Boolean(episode.published),
        videoSources: episode.videoSources.filter((source) => source.url.trim()).map((source) => ({ quality: source.quality, format: source.format, url: source.url.trim() })),
        subtitles: episode.subtitles.filter((subtitle) => subtitle.url.trim()).map((subtitle) => ({ language: subtitle.language.trim(), label: subtitle.label.trim() || subtitle.language.trim(), url: subtitle.url.trim() })),
      })),
    }));
    const payload = { type: "series", title: form.title.trim(), description: form.description.trim(), year, rating, duration: form.duration.trim(), genres: unique(form.genres), language: form.language.trim(), country: form.country.trim(), certification: form.certification.trim(), poster: form.poster.trim(), backdrop: form.backdrop.trim(), trailer: form.trailer.trim(), director: form.director.trim(), cast: unique(form.cast), videoSources: [], subtitles: [], seasons, featured: Boolean(form.featured), published: Boolean(form.published) };

    try {
      setSaving(true);
      await api.post("/movies", payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Series created successfully.");
      navigate("/admin/movies");
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) { localStorage.removeItem("errorcinema_admin_token"); localStorage.removeItem("errorcinema_admin_user"); toast.error("You are not authorized."); navigate("/admin/login", { replace: true }); return; }
      toast.error(error.response?.data?.message || "Unable to create series.");
    } finally { setSaving(false); }
  };

  return <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl"><header className="mb-7 flex items-start gap-4"><button type="button" onClick={() => navigate("/admin/movies")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white" aria-label="Back to movies"><ArrowLeft size={19} /></button><div><h1 className="text-2xl font-black sm:text-3xl">Add Series</h1><p className="mt-1 text-sm text-gray-500">Create a series with seasons and episodes.</p></div></header><form onSubmit={handleSubmit} className="space-y-6">
    <Section icon={<Tv size={19} />} title="Basic Information" description="Series metadata and classification."><div className="grid gap-5 md:grid-cols-2"><Field label="Title *" name="title" value={form.title} onChange={updateForm} className="md:col-span-2" placeholder="Series title" /><div className="md:col-span-2"><label htmlFor="description" className="mb-2 block text-sm text-gray-400">Description *</label><textarea id="description" name="description" value={form.description} onChange={updateForm} className="admin-input min-h-32 resize-y" placeholder="Series description" /></div><Field label="Year *" name="year" type="number" min="1888" max={new Date().getFullYear() + 1} value={form.year} onChange={updateForm} /><Field label="Rating" name="rating" type="number" min="0" max="10" step="0.1" value={form.rating} onChange={updateForm} /><Field label="Series Duration" name="duration" value={form.duration} onChange={updateForm} placeholder="1h 20m" help="Series metadata duration; episode duration is separate." /><Field label="Language *" name="language" value={form.language} onChange={updateForm} placeholder="English" /><Field label="Country" name="country" value={form.country} onChange={updateForm} placeholder="United States" /><Field label="Certification" name="certification" value={form.certification} onChange={updateForm} placeholder="TV-14" /><TagEditor label="Genres" values={form.genres} input={genreInput} setInput={setGenreInput} onAdd={(value) => addTag("genres", value, setGenreInput)} onRemove={(value) => setForm((current) => ({ ...current, genres: current.genres.filter((item) => item !== value) }))} suggestions={genreSuggestions} className="md:col-span-2" /></div></Section>
    <Section icon={<Image size={19} />} title="Media" description="Use owned, licensed, or authorized URLs."><div className="grid gap-5 md:grid-cols-2"><UrlField label="Poster URL *" name="poster" value={form.poster} onChange={updateForm} /><UrlField label="Backdrop URL" name="backdrop" value={form.backdrop} onChange={updateForm} /><Field label="Trailer URL" name="trailer" type="url" value={form.trailer} onChange={updateForm} className="md:col-span-2" placeholder="https://example.com/trailer" /></div></Section>
    <Section title="Credits" description="Director and cast information."><div className="grid gap-5 md:grid-cols-2"><Field label="Director" name="director" value={form.director} onChange={updateForm} placeholder="Director name" /><TagEditor label="Cast" values={form.cast} input={castInput} setInput={setCastInput} onAdd={(value) => addTag("cast", value, setCastInput)} onRemove={(value) => setForm((current) => ({ ...current, cast: current.cast.filter((item) => item !== value) }))} placeholder="Actor name" /></div></Section>
    <SeasonsSection form={form} addSeason={addSeason} removeSeason={removeSeason} updateSeason={updateSeason} addEpisode={addEpisode} removeEpisode={removeEpisode} updateEpisode={updateEpisode} updateNested={updateNested} addNested={addNested} removeNested={removeNested} />
    <Section title="Publishing" description="Control series visibility and featured placement."><div className="grid gap-3 sm:grid-cols-2"><Toggle name="featured" checked={form.featured} onChange={updateForm} label="Featured Series" help="Show in featured sections." /><Toggle name="published" checked={form.published} onChange={updateForm} label="Publish Series" help="Make the series visible to users." /></div></Section>
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => navigate("/admin/movies")} className="min-h-12 rounded-lg border border-white/10 px-6 text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white">Cancel</button><button type="submit" disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-red-600 px-6 text-sm font-bold hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"><Check size={18} />{saving ? "Creating Series..." : "Create Series"}</button></div>
  </form></div></main>;
}

function Section({ icon, title, description, children }) { return <section className="rounded-xl border border-white/10 bg-zinc-900 p-5 sm:p-6"><div className="mb-6 flex items-center gap-3">{icon && <div className="rounded-lg bg-red-600/10 p-2 text-red-500">{icon}</div>}<div><h2 className="font-bold">{title}</h2><p className="mt-1 text-xs text-gray-600">{description}</p></div></div>{children}</section>; }
function Field({ label, name, type = "text", className = "", help, ...props }) { return <div className={className}><label htmlFor={name} className="mb-2 block text-sm font-medium text-gray-300">{label}</label><input id={name} name={name} type={type} className="admin-input" {...props} />{help && <p className="mt-2 text-xs text-gray-600">{help}</p>}</div>; }
function UrlField({ label, name, value, onChange }) { return <div><Field label={label} name={name} type="url" value={value} onChange={onChange} placeholder="https://example.com/image.jpg" /><Preview value={value} alt={label} /></div>; }
function Preview({ value, alt }) { if (!value) return null; return <div className="mt-3 h-28 overflow-hidden rounded-lg border border-white/10 bg-zinc-950"><img src={value} alt={`${alt} preview`} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /></div>; }
function TagEditor({ label, values, input, setInput, onAdd, onRemove, suggestions = [], placeholder = "Add and press Enter", className = "" }) { return <div className={className}><label className="mb-2 block text-sm font-medium text-gray-300">{label}</label><div className="flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onAdd(input); } }} placeholder={placeholder} className="admin-input" /><button type="button" onClick={() => onAdd(input)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10" aria-label={`Add ${label}`}><Plus size={18} /></button></div><div className="mt-3 flex flex-wrap gap-2">{values.map((value) => <span key={value} className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1.5 text-xs text-red-300">{value}<button type="button" onClick={() => onRemove(value)} aria-label={`Remove ${value}`}><Trash2 size={13} /></button></span>)}</div>{suggestions.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{suggestions.filter((value) => !values.includes(value)).map((value) => <button type="button" key={value} onClick={() => onAdd(value)} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-gray-400">+ {value}</button>)}</div>}</div>; }
function Toggle({ name, checked, onChange, label, help }) { return <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-zinc-950 p-4"><input type="checkbox" name={name} checked={checked} onChange={onChange} className="h-4 w-4 accent-red-600" /><span><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs text-gray-600">{help}</span></span></label>; }

function SeasonsSection({ form, addSeason, removeSeason, updateSeason, addEpisode, removeEpisode, updateEpisode, updateNested, addNested, removeNested }) {
  return <Section title="Seasons & Episodes" description="Manage seasons, episodes, authorized video sources, and subtitles."><div className="mb-5 flex justify-end"><button type="button" onClick={addSeason} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold hover:bg-red-500"><Plus size={17} /> Add Season</button></div>{form.seasons.length === 0 && <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-gray-500">No seasons added yet.</div>}<div className="space-y-6">{form.seasons.map((season, seasonIndex) => <div key={seasonIndex} className="rounded-xl border border-white/10 bg-zinc-950 p-4 md:p-5"><div className="mb-5 grid gap-4 md:grid-cols-[160px_1fr_auto] md:items-end"><Field label="Season Number" name={`season-${seasonIndex}`} type="number" min="1" value={season.seasonNumber} onChange={(event) => updateSeason(seasonIndex, "seasonNumber", event.target.value)} /><Field label="Season Title" name={`season-title-${seasonIndex}`} value={season.title} onChange={(event) => updateSeason(seasonIndex, "title", event.target.value)} placeholder="Season 1" /><button type="button" onClick={() => removeSeason(seasonIndex)} className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-red-500/20 px-4 text-sm text-red-400 hover:bg-red-500/10"><Trash2 size={17} /> Remove</button></div><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Episodes</h3><button type="button" onClick={() => addEpisode(seasonIndex)} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold"><Plus size={15} /> Add Episode</button></div>{season.episodes.length === 0 && <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-gray-500">No episodes added.</div>}<div className="space-y-5">{season.episodes.map((episode, episodeIndex) => <EpisodeCard key={episodeIndex} episode={episode} seasonIndex={seasonIndex} episodeIndex={episodeIndex} updateEpisode={updateEpisode} removeEpisode={removeEpisode} updateNested={updateNested} addNested={addNested} removeNested={removeNested} />)}</div></div>)}</div></Section>;
}

function EpisodeCard({ episode, seasonIndex, episodeIndex, updateEpisode, removeEpisode, updateNested, addNested, removeNested }) { return <div className="rounded-xl border border-white/10 bg-zinc-900 p-4 md:p-5"><div className="mb-5 flex items-center justify-between"><h4 className="font-semibold">Episode {episode.episodeNumber}</h4><button type="button" onClick={() => removeEpisode(seasonIndex, episodeIndex)} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10" aria-label={`Remove episode ${episode.episodeNumber}`}><Trash2 size={18} /></button></div><div className="grid gap-4 md:grid-cols-2"><Field label="Episode Number" name={`episode-${seasonIndex}-${episodeIndex}`} type="number" min="1" value={episode.episodeNumber} onChange={(event) => updateEpisode(seasonIndex, episodeIndex, "episodeNumber", event.target.value)} /><Field label="Episode Title *" name={`episode-title-${seasonIndex}-${episodeIndex}`} value={episode.title} onChange={(event) => updateEpisode(seasonIndex, episodeIndex, "title", event.target.value)} placeholder="Episode title" /><Field label="Episode Duration" name={`episode-duration-${seasonIndex}-${episodeIndex}`} value={episode.duration} onChange={(event) => updateEpisode(seasonIndex, episodeIndex, "duration", event.target.value)} placeholder="45m" /><div><label htmlFor={`thumbnail-${seasonIndex}-${episodeIndex}`} className="mb-2 block text-sm text-gray-400">Thumbnail URL</label><input id={`thumbnail-${seasonIndex}-${episodeIndex}`} type="url" value={episode.thumbnail} onChange={(event) => updateEpisode(seasonIndex, episodeIndex, "thumbnail", event.target.value)} placeholder="https://..." className="admin-input" /><Preview value={episode.thumbnail} alt="Episode thumbnail" /></div><div className="md:col-span-2"><label htmlFor={`episode-description-${seasonIndex}-${episodeIndex}`} className="mb-2 block text-sm text-gray-400">Episode Description</label><textarea id={`episode-description-${seasonIndex}-${episodeIndex}`} value={episode.description} onChange={(event) => updateEpisode(seasonIndex, episodeIndex, "description", event.target.value)} className="admin-input min-h-24 resize-y" /></div></div><NestedEditor title="Video Sources" items={episode.videoSources} field="videoSources" empty={emptySource} updateNested={updateNested} addNested={addNested} removeNested={removeNested} seasonIndex={seasonIndex} episodeIndex={episodeIndex} /><NestedEditor title="Subtitles" items={episode.subtitles} field="subtitles" empty={emptySubtitle} updateNested={updateNested} addNested={addNested} removeNested={removeNested} seasonIndex={seasonIndex} episodeIndex={episodeIndex} /><label className="mt-5 flex cursor-pointer items-center gap-3"><input type="checkbox" checked={episode.published} onChange={(event) => updateEpisode(seasonIndex, episodeIndex, "published", event.target.checked)} className="h-4 w-4 accent-red-600" /><span className="text-sm">Publish Episode</span></label></div>; }

function NestedEditor({ title, items, field, empty, updateNested, addNested, removeNested, seasonIndex, episodeIndex }) { const subtitles = field === "subtitles"; return <div className="mt-6 border-t border-white/10 pt-5"><div className="mb-3 flex items-center justify-between"><div><h5 className="text-sm font-semibold">{title}</h5>{subtitles && <p className="mt-1 text-xs text-gray-600">Use authorized WebVTT or subtitle URLs.</p>}</div><button type="button" onClick={() => addNested(seasonIndex, episodeIndex, field, empty)} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs"><Plus size={15} /> Add {subtitles ? "Subtitle" : "Video Source"}</button></div><div className="space-y-3">{items.map((item, index) => <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]">{!subtitles && <><select value={item.quality} onChange={(event) => updateNested(seasonIndex, episodeIndex, field, event.target.value, index, "quality")} className="admin-input" aria-label={`${title} ${index + 1} quality`}>{qualities.map((quality) => <option key={quality} value={quality}>{quality}</option>)}</select><select value={item.format} onChange={(event) => updateNested(seasonIndex, episodeIndex, field, event.target.value, index, "format")} className="admin-input" aria-label={`${title} ${index + 1} format`}><option value="mp4">MP4</option><option value="hls">HLS</option></select></>}{subtitles && <><input value={item.language} onChange={(event) => updateNested(seasonIndex, episodeIndex, field, event.target.value, index, "language")} placeholder="Language" className="admin-input" aria-label={`Subtitle ${index + 1} language`} /><input value={item.label} onChange={(event) => updateNested(seasonIndex, episodeIndex, field, event.target.value, index, "label")} placeholder="Label" className="admin-input" aria-label={`Subtitle ${index + 1} label`} /></>}<input type="url" value={item.url} onChange={(event) => updateNested(seasonIndex, episodeIndex, field, event.target.value, index, "url")} placeholder={subtitles ? "Authorized subtitle URL" : "Authorized video URL"} className="admin-input" aria-label={`${title} ${index + 1} URL`} /><button type="button" onClick={() => removeNested(seasonIndex, episodeIndex, field, index)} className="flex min-h-12 items-center justify-center rounded-lg border border-red-500/20 px-4 text-red-400 hover:bg-red-500/10" aria-label={`Remove ${title} ${index + 1}`}><Trash2 size={17} /></button></div>)}</div></div>; }

export default AddSeries;