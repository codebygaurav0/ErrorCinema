
import { Home, SearchX } from "lucide-react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 pb-24 pt-24 text-white">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-600/10 text-red-500">
          <SearchX size={40} />
        </div>

        <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-500">
          ErrorCinema
        </p>

        <h1 className="mt-3 text-7xl font-black sm:text-8xl">
          404
        </h1>

        <h2 className="mt-4 text-2xl font-bold">
          Page Not Found
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700"
        >
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
