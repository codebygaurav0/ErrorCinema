import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const getStoredToken = () =>
  localStorage.getItem("errorcinema_token");

const saveAuth = (token, user) => {
  localStorage.setItem(
    "errorcinema_token",
    token
  );

  localStorage.setItem(
    "errorcinema_user",
    JSON.stringify(user)
  );
};

const clearAuth = () => {
  localStorage.removeItem(
    "errorcinema_token"
  );

  localStorage.removeItem(
    "errorcinema_user"
  );
};

const signup = async ({
  name,
  email,
  password,
}) => {
  const response = await axios.post(
    `${API_URL}/auth/signup`,
    {
      name,
      email,
      password,
    }
  );

  if (response.data?.token) {
    saveAuth(
      response.data.token,
      response.data.user
    );
  }

  return response.data;
};

const login = async ({
  email,
  password,
}) => {
  const response = await axios.post(
    `${API_URL}/auth/login`,
    {
      email,
      password,
    }
  );

  if (response.data?.token) {
    saveAuth(
      response.data.token,
      response.data.user
    );
  }

  return response.data;
};

const getMe = async () => {
  const token =
    getStoredToken();

  if (!token) {
    return null;
  }

  const response = await axios.get(
    `${API_URL}/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

const logout = () => {
  clearAuth();
};

const getToken = () => {
  return getStoredToken();
};

const getStoredUser = () => {
  const user =
    localStorage.getItem(
      "errorcinema_user"
    );

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    clearAuth();
    return null;
  }
};

export {
  signup,
  login,
  getMe,
  logout,
  getToken,
  getStoredUser,
  saveAuth,
  clearAuth,
};
