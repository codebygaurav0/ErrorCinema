import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clearAuth,
  getMe,
  getStoredUser,
  login as loginUser,
  logout as logoutUser,
  signup as signupUser,
} from "../services/authService";

import { AuthContext } from "./AuthContextValue";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const storedUser = getStoredUser();

      if (!storedUser) {
        setUser(null);
        return null;
      }

      const data = await getMe();

      if (data?.user) {
        setUser(data.user);
        return data.user;
      }

      clearAuth();
      setUser(null);
      return null;
    } catch (error) {
      console.error("Session restore failed:", error);
      clearAuth();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      await refreshUser();

      if (mounted) {
        setLoading(false);
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  const signup = useCallback(async (credentials) => {
    const data = await signupUser(credentials);

    if (data?.user) {
      setUser(data.user);
    }

    return data;
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);

    if (data?.user) {
      setUser(data.user);
    }

    return data;
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      signup,
      login,
      logout,
      refreshUser,
    }),
    [
      user,
      loading,
      signup,
      login,
      logout,
      refreshUser,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
