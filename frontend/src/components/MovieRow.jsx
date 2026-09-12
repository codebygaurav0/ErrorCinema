import { useNavigate } from "react-router-dom";
import MovieCard from "./MovieCard";

function MovieRow({ title, movies, viewAllPath = "/movies" }) {
  const navigate = useNavigate();

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold sm:text-2xl">
          {title}
        </h2>

        <button
          type="button"
          onClick={() => navigate(viewAllPath)}
          className="text-sm font-medium text-red-500 transition hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          View All
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {movies.map((movie) => (
          <MovieCard
            key={movie._id || movie.id}
            movie={movie}
          />
        ))}
      </div>
    </section>
  );
}

export default MovieRow;
