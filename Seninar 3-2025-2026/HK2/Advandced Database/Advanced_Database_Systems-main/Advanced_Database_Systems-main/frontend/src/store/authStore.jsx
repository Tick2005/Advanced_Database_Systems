import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { clearAuth, loadAuth, saveAuth } from "../services/storage";
import { authService } from "../features/auth/authService";

const AuthContext = createContext(null);

function parseTokenExpiryMs(token) {
  if (!token || typeof token !== "string") return 0;
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return 0;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(normalized));
    return Number(payload?.exp || 0) * 1000;
  } catch {
    return 0;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadAuth);
  const refreshTimerRef = useRef(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const applyAuth = useCallback((payload) => {
    const source = payload?.data ?? payload ?? {};
    const next = {
      accessToken: source.accessToken,
      refreshToken: source.refreshToken,
      role: source.role,
      email: source.email
    };
    saveAuth(next);
    setAuth(next);
  }, []);

  const clearSessionArtifacts = useCallback(() => {
    sessionStorage.removeItem("booking_vnpay_pending");
    sessionStorage.removeItem("booking_vnpay_result");
  }, []);

  const forceLogout = useCallback(() => {
    clearRefreshTimer();
    clearSessionArtifacts();
    clearAuth();
    setAuth(null);
  }, [clearRefreshTimer, clearSessionArtifacts]);

  const refreshAccessToken = useCallback(async () => {
    const latest = loadAuth();
    if (!latest?.refreshToken) {
      forceLogout();
      return;
    }

    try {
      const refreshed = await authService.refreshToken(latest.refreshToken);
      applyAuth({ ...latest, ...refreshed });
    } catch {
      forceLogout();
    }
  }, [applyAuth, forceLogout]);

  const scheduleRefresh = useCallback((nextAuth) => {
    clearRefreshTimer();
    const expiresAt = parseTokenExpiryMs(nextAuth?.accessToken);
    if (!expiresAt || !nextAuth?.refreshToken) {
      return;
    }

    const now = Date.now();
    const refreshAt = expiresAt - 2 * 60 * 1000;
    const timeout = Math.max(5000, refreshAt - now);

    refreshTimerRef.current = window.setTimeout(() => {
      refreshAccessToken();
    }, timeout);
  }, [clearRefreshTimer, refreshAccessToken]);

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

  useEffect(() => {
    if (!auth?.accessToken) {
      clearRefreshTimer();
      return;
    }
    scheduleRefresh(auth);
    return clearRefreshTimer;
  }, [auth, clearRefreshTimer, scheduleRefresh]);

  const value = useMemo(() => {
    const login = (payload) => {
      applyAuth(payload);
    };

    const logout = () => {
      forceLogout();
    };

    return {
      auth,
      isAuthenticated: Boolean(auth?.accessToken),
      role: auth?.role || null,
      login,
      refreshAccessToken,
      logout
    };
  }, [auth, applyAuth, forceLogout, refreshAccessToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthStore() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuthStore must be used within AuthProvider");
  }
  return value;
}
