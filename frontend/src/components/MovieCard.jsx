import { Play, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

function MovieCard({ movie }) {
  const navigate = useNavigate();

  const movieId = movie?.id || movie?._id;

  const handleClick = () => {
    if (!movieId) {
      return;
    }

    navigate(`/movie/${movieId}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group block w-36.25 shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:w-42.5 md:w-47.5"
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-xl bg-zinc-900">
        <img
          src={movie.poster}
          alt={`${movie.title || "Content"} poster`}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 shadow-xl">
            <Play size={18} fill="white" />
          </span>
        </div>

        {movie.type && (
          <span className="absolute right-2 top-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {movie.type === "series" ? "Series" : "Movie"}
          </span>
        )}
      </div>

      <div className="mt-2.5">
        <h3 className="truncate text-sm font-semibold text-white transition group-hover:text-red-500">
          {movie.title}
        </h3>

        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          {movie.year && <span>{movie.year}</span>}

          {movie.year && (movie.rating != null || movie.duration) && (
            <span className="text-gray-700">·</span>
          )}

          {movie.rating != null && (
            <span className="flex items-center gap-1">
              <Star size={11} fill="currentColor" />
              {movie.rating}
            </span>
          )}

          {movie.duration && (
            <span className="truncate">{movie.duration}</span>
          )}
        </div>
      </div>
    </button>
  );
}

export default MovieCard;
