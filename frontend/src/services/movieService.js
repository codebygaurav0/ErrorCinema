
import api from "./api";

export const getMovies = async () => {
  const response = await api.get("/movies");

  return response.data;
};

export const getMovieById = async (id) => {
  const response = await api.get(`/movies/${id}`);

  return response.data;
};