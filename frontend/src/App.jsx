import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Movies from "./pages/Movies";
import TVShows from "./pages/TVShows";
import Genres from "./pages/Genres";
import Search from "./pages/Search";
import MovieDetails from "./pages/MovieDetails";
import Player from "./pages/Player";
import NotFound from "./pages/NotFound";
import MyList from "./pages/MyList";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminMovies from "./admin/pages/AdminMovies";
import AddMovie from "./admin/pages/AddMovie";
import AddSeries from "./admin/pages/AddSeries";
import EditMovie from "./admin/pages/EditMovie";
import History from "./pages/History";
import Login from "./pages/Login";
import AdminProtectedRoute from "./admin/components/AdminProtectedRoute";

function PublicLayout() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/history" element={<History />} />
        <Route path="/my-list" element={<MyList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/tv-shows" element={<TVShows />} />
        <Route path="/genres" element={<Genres />} />
        <Route path="/search" element={<Search />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/watch/:id" element={<Player />} />
        <Route path="*" element={<NotFound />} />
        
        
      </Routes>

      <BottomNav />
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white">
        <Routes>
          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Dashboard */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />

          {/* Admin Movies */}
          <Route
            path="/admin/movies"
            element={
              <AdminProtectedRoute>
                <AdminMovies />
              </AdminProtectedRoute>
            }
          />

          {/* Add Movie */}
          <Route
            path="/admin/movies/add"
            element={
              <AdminProtectedRoute>
                <AddMovie />
              </AdminProtectedRoute>
            }
          />

          {/* Edit Movie */}
          <Route
            path="/admin/movies/:id/edit"
            element={
              <AdminProtectedRoute>
                <EditMovie />
              </AdminProtectedRoute>
            }
          />

          {/* Add Series */}
          <Route
            path="/admin/series/add"
            element={
              <AdminProtectedRoute>
                <AddSeries />
              </AdminProtectedRoute>
            }
          />

          {/* Public Website */}
          <Route path="/*" element={<PublicLayout />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;



