import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearAuth, loadAuth, saveAuth } from "../services/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadAuth);

  useEffect(() => {
    const syncAuth = () => {
      setAuth(loadAuth());
    };

    window.addEventListener("storage", syncAuth);
    window.addEventListener("focus", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("focus", syncAuth);
    };
  }, []);

  const value = useMemo(() => {
    const login = (payload) => {
      const source = payload?.data ?? payload ?? {};
      const next = {
        accessToken: source.accessToken,
        refreshToken: source.refreshToken,
        role: source.role,
        email: source.email
      };
      saveAuth(next);
      setAuth(next);
    };

    const logout = () => {
      clearAuth();
      setAuth(null);
    };

    return {
      auth,
      isAuthenticated: Boolean(auth?.accessToken),
      role: auth?.role || null,
      login,
      logout
    };
  }, [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthStore() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuthStore must be used within AuthProvider");
  }
  return value;
}
