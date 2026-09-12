import { Info, Play, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function firstPlayableEpisode(content) {
  return (content.seasons || [])
    .filter((season) => season?.episodes?.length)
    .sort((a, b) => Number(a.seasonNumber) - Number(b.seasonNumber))
    .flatMap((season) => [...season.episodes].sort((a, b) => Number(a.episodeNumber) - Number(b.episodeNumber)).map((episode) => ({ season, episode })))
    .find(({ episode }) => episode.published !== false && episode.videoSources?.some((source) => source?.url));
}

function Hero({ content }) {
  const navigate = useNavigate();
  if (!content) return null;

  const id = content._id || content.id;
  const isSeries = content.type === "series";

  const handleWatch = () => {
    if (!id) return;
    if (!isSeries) {
      if (!content.videoSources?.some((source) => source?.url)) {
        toast.error("No playable video is currently available.");
        return;
      }
      navigate(`/watch/${id}`);
      return;
    }

    const playable = firstPlayableEpisode(content);
    if (!playable) {
      toast.error("No playable video is currently available.");
      return;
    }
    navigate(`/watch/${id}?season=${playable.season.seasonNumber}&episode=${playable.episode.episodeNumber}`);
  };

  return <section className="relative min-h-130 overflow-hidden pt-16 sm:min-h-155">
    <div className="absolute inset-0 bg-zinc-950"><img src={content.backdrop} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /></div>
    <div className="absolute inset-0 bg-linear-to-r from-black via-black/75 to-transparent" /><div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-black/20" />
    <div className="relative z-10 flex min-h-130 items-end sm:min-h-155"><div className="mx-auto w-full max-w-7xl px-5 pb-14 md:px-8 md:pb-20"><div className="max-w-2xl">
      <span className="mb-4 inline-flex rounded bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider">{isSeries ? "Featured Series" : "Featured Movie"}</span>
      <h1 className="text-4xl font-black leading-tight sm:text-5xl md:text-7xl">{content.title}</h1>
      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-300">{content.year && <span>{content.year}</span>}{content.rating !== undefined && content.rating !== null && <span className="flex items-center gap-1 font-bold text-yellow-400"><Star size={14} fill="currentColor" /> {content.rating}</span>}{content.duration && <span>{content.duration}</span>}<span className="rounded border border-gray-500 px-2 py-0.5">{isSeries ? "Series" : "Movie"}</span></div>
      {content.genres?.length > 0 && <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-300">{content.genres.slice(0, 4).map((genre) => <span key={genre} className="rounded-full border border-white/15 bg-black/30 px-3 py-1">{genre}</span>)}</div>}
      {content.description && <p className="mt-5 line-clamp-3 max-w-xl text-sm leading-6 text-gray-300 md:text-base">{content.description}</p>}
      <div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={handleWatch} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-white px-6 py-3 font-bold text-black transition hover:bg-gray-200"><Play size={19} fill="currentColor" /> Watch Now</button><button type="button" onClick={() => navigate(`/movie/${id}`)} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-white/15 px-6 py-3 font-bold text-white backdrop-blur transition hover:bg-white/25"><Info size={19} /> More Info</button></div>
    </div></div></div>
  </section>;
}

export default Hero;