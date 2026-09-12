import api from "../../services/api";

const getAdminMovies = async () => {
  const response = await api.get("/movies/admin/all");
  return response.data;
};

const getAdminMovie = async (id) => {
  const response = await api.get(`/movies/admin/${id}`);
  return response.data;
};

const createAdminMovie = async (movieData) => {
  const response = await api.post(
    "/movies",
    movieData
  );
  return response.data;
};

const updateAdminMovie = async (id, movieData) => {
  const response = await api.put(
    `/movies/${id}`,
    movieData
  );
  return response.data;
};

const deleteAdminMovie = async (id) => {
  const response = await api.delete(
    `/movies/${id}`
  );
  return response.data;
};

export {
  getAdminMovies,
  getAdminMovie,
  createAdminMovie,
  updateAdminMovie,
  deleteAdminMovie,
};
