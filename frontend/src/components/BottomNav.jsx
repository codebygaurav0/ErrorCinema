import {
  Film,
  Home,
  Search,
  Tags,
  Tv,
} from "lucide-react";
import { NavLink } from "react-router-dom";

function BottomNav() {
  const navItems = [
    {
      label: "Home",
      path: "/",
      icon: Home,
    },
    {
      label: "Movies",
      path: "/movies",
      icon: Film,
    },
    {
      label: "TV Shows",
      path: "/tv-shows",
      icon: Tv,
    },
    {
      label: "Genres",
      path: "/genres",
      icon: Tags,
    },
    {
      label: "Search",
      path: "/search",
      icon: Search,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex min-w-[58px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium transition ${
                  isActive
                    ? "text-red-500"
                    : "text-gray-500 hover:text-white"
                }`
              }
            >
              <Icon size={20} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;