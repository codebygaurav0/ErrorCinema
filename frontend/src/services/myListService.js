import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem(
    "errorcinema_token"
  );

  return {
    Authorization: `Bearer ${token}`,
  };
};

const getMyList = async () => {
  const response = await axios.get(
    `${API_URL}/my-list`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

const checkMyList = async (movieId) => {
  const response = await axios.get(
    `${API_URL}/my-list/check/${movieId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

const addToMyList = async (movieId) => {
  const response = await axios.post(
    `${API_URL}/my-list/${movieId}`,
    {},
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

const removeFromMyList = async (movieId) => {
  const response = await axios.delete(
    `${API_URL}/my-list/${movieId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

export {
  getMyList,
  checkMyList,
  addToMyList,
  removeFromMyList,
};
