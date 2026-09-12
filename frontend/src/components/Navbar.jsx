import { Search, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const navigate = useNavigate();

  const openSearch = () => {
    setSearchOpen(true);
    setMobileMenu(false);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchText("");
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;

    setSearchText(value);

    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value)}`);
    } else {
      navigate("/");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const value = searchText.trim();

    if (value) {
      navigate(`/search?q=${encodeURIComponent(value)}`);
    }
  };

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/90 backdrop-blur-xl">

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">

        {/* LOGO */}

        <Link
          to="/"
          onClick={closeSearch}
          className="flex shrink-0 items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-xl font-black">
            E
          </div>

          <span className="text-xl font-bold tracking-tight">
            Error<span className="text-red-500">Cinema</span>
          </span>
        </Link>

        {/* DESKTOP NAV */}

        <nav className="hidden items-center gap-7 md:flex">

          <Link
            to="/"
            className="text-sm font-medium text-white transition hover:text-red-500"
          >
            Home
          </Link>

          <Link
            to="/movies"
            className="text-sm font-medium text-gray-400 transition hover:text-white"
          >
            Movies
          </Link>

          <Link
            to="/tv-shows"
            className="text-sm font-medium text-gray-400 transition hover:text-white"
          >
            TV Shows
          </Link>

          <Link
            to="/genres"
            className="text-sm font-medium text-gray-400 transition hover:text-white"
          >
            Genres
          </Link>

        </nav>

        {/* RIGHT SIDE */}

        <div className="flex items-center gap-2">

          {/* SEARCH */}

          {!searchOpen ? (

            <button
              type="button"
              onClick={openSearch}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Search"
            >
              <Search size={21} />
            </button>

          ) : (

            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center"
            >
              <div className="flex h-10 w-48 items-center rounded-lg border border-white/10 bg-zinc-900 sm:w-60 md:w-72">

                <Search
                  size={18}
                  className="ml-3 shrink-0 text-gray-500"
                />

                <input
                  type="text"
                  value={searchText}
                  onChange={handleSearchChange}
                  autoFocus
                  placeholder="Search movies..."
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-gray-500"
                />

                <button
                  type="button"
                  onClick={closeSearch}
                  className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close Search"
                >
                  <X size={17} />
                </button>

              </div>
            </form>

          )}

          {/* USER */}

          <button
            type="button"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-gray-300 transition hover:bg-white/10 hover:text-white sm:flex"
            aria-label="Profile"
          >
            <User size={21} />
          </button>

          {/* MOBILE MENU */}

          <button
            type="button"
            onClick={() => {
              setMobileMenu(!mobileMenu);
              setSearchOpen(false);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-300 transition hover:bg-white/10 md:hidden"
            aria-label="Menu"
          >
            {mobileMenu ? (
              <X size={23} />
            ) : (
              <Menu size={23} />
            )}
          </button>

        </div>
      </div>

      {/* MOBILE MENU */}

      {mobileMenu && (
        <div className="border-t border-white/10 bg-black px-5 py-5 md:hidden">

          <nav className="flex flex-col gap-4">

            <Link
              to="/"
              onClick={() => setMobileMenu(false)}
              className="text-white"
            >
              Home
            </Link>

            <Link
              to="/movies"
              onClick={() => setMobileMenu(false)}
              className="text-gray-400"
            >
              Movies
            </Link>

            <Link
              to="/tv-shows"
              onClick={() => setMobileMenu(false)}
              className="text-gray-400"
            >
              TV Shows
            </Link>

            <Link
              to="/genres"
              onClick={() => setMobileMenu(false)}
              className="text-gray-400"
            >
              Genres
            </Link>

          </nav>

        </div>
      )}

    </header>
  );
}

export default Navbar;