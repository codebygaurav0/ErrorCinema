import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-xl font-black">
                E
              </div>

              <span className="text-xl font-bold">
                Error<span className="text-red-500">Cinema</span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-500">
              Discover movies and TV shows in one simple streaming experience.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Browse
            </h3>

            <div className="flex flex-col gap-3 text-sm text-gray-500">
              <Link to="/" className="transition hover:text-white">
                Home
              </Link>

              <Link to="/movies" className="transition hover:text-white">
                Movies
              </Link>

              <Link to="/tv-shows" className="transition hover:text-white">
                TV Shows
              </Link>

              <Link to="/genres" className="transition hover:text-white">
                Genres
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Legal
            </h3>

            <div className="flex flex-col gap-3 text-sm text-gray-500">
              <Link to="/privacy" className="transition hover:text-white">
                Privacy Policy
              </Link>

              <Link to="/terms" className="transition hover:text-white">
                Terms of Service
              </Link>

              <Link to="/contact" className="transition hover:text-white">
                Contact Us
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Follow Us
            </h3>

            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="GitHub"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-gray-400 transition hover:bg-zinc-800 hover:text-white"
              >
                GH
              </a>

              <a
                href="#"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-gray-400 transition hover:bg-zinc-800 hover:text-white"
              >
                IG
              </a>

              <a
                href="#"
                aria-label="Twitter"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-gray-400 transition hover:bg-zinc-800 hover:text-white"
              >
                X
              </a>

              <a
                href="#"
                aria-label="YouTube"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-gray-400 transition hover:bg-zinc-800 hover:text-white"
              >
                YT
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-600">
          <p>
            © {new Date().getFullYear()} ErrorCinema. All rights reserved.
          </p>

          <p className="mt-2 text-gray-500">
            Built & Designed by{" "}
            <span className="font-semibold text-red-500 transition hover:text-red-400">
              Gumshuda
            </span>{" "}
            🚀
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;