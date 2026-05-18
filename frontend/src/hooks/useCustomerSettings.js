import { useEffect, useState, useCallback, useRef } from "react";
import { userService } from "../features/users/userService";
import { useAuth } from "../features/auth/useAuth";

const LS_KEYS = {
  theme: "ux_theme",
  fontScale: "ux_font_scale",
  allowLocation: "ux_allow_location",
  allowCamera: "ux_allow_camera",
  dirty: "ux_settings_dirty",
};

const DEFAULT_SETTINGS = {
  theme: "light",
  fontScale: "normal",
  allowLocation: false,
  allowCamera: false,
  locationPermissionShown: false,
};

function normalizeSettings(input) {
  const source = input || {};
  const theme = source.theme === "dark" ? "dark" : "light";
  const fontScale = ["compact", "normal", "large"].includes(source.fontScale) ? source.fontScale : "normal";
  return {
    theme,
    fontScale,
    allowLocation: source.allowLocation === true,
    allowCamera: source.allowCamera === true,
    locationPermissionShown: source.locationPermissionShown === true,
  };
}

function readLocalSettings() {
  return normalizeSettings({
    theme: localStorage.getItem(LS_KEYS.theme) || DEFAULT_SETTINGS.theme,
    fontScale: localStorage.getItem(LS_KEYS.fontScale) || DEFAULT_SETTINGS.fontScale,
    allowLocation: localStorage.getItem(LS_KEYS.allowLocation) === "true",
    allowCamera: localStorage.getItem(LS_KEYS.allowCamera) === "true",
  });
}

function writeLocalSettings(settings, dirty = false) {
  localStorage.setItem(LS_KEYS.theme, settings.theme);
  localStorage.setItem(LS_KEYS.fontScale, settings.fontScale);
  localStorage.setItem(LS_KEYS.allowLocation, String(settings.allowLocation));
  localStorage.setItem(LS_KEYS.allowCamera, String(settings.allowCamera));
  localStorage.setItem(LS_KEYS.dirty, dirty ? "true" : "false");
}

function applyVisualSettings(settings) {
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.dataset.fontScale = settings.fontScale;
  document.documentElement.style.colorScheme = settings.theme;
}

function sameSettings(prev, next) {
  if (!prev || !next) return prev === next;
  return (
    prev.theme === next.theme &&
    prev.fontScale === next.fontScale &&
    prev.allowLocation === next.allowLocation &&
    prev.allowCamera === next.allowCamera &&
    prev.locationPermissionShown === next.locationPermissionShown
  );
}

export function useCustomerSettings() {
  const { isAuthenticated, auth, role } = useAuth();
  // Only CUSTOMER role has access to /api/customer/settings.
  // Staff, Manager, Owner must use local settings only to avoid 403.
  const isCustomer = isAuthenticated && role === "CUSTOMER";
  const [settings, setSettings] = useState(() => readLocalSettings());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const instanceIdRef = useRef(
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `settings-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const syncingRef = useRef(false);

  useEffect(() => {
    if (syncingRef.current) {
      syncingRef.current = false;
      return;
    }

    applyVisualSettings(settings);
    try {
      window.dispatchEvent(new CustomEvent("user_settings_updated", { detail: { settings, sourceId: instanceIdRef.current } }));
    } catch (err) {
      // Ignore event errors for older browsers.
    }
  }, [settings]);

  useEffect(() => {
    const handleSettingsUpdate = (event) => {
      const detail = event?.detail || {};
      if (detail.sourceId && detail.sourceId === instanceIdRef.current) {
        return;
      }

      const nextSettings = normalizeSettings(detail.settings || detail);
      syncingRef.current = true;
      setSettings((prev) => (sameSettings(prev, nextSettings) ? prev : nextSettings));
    };

    const handleStorageChange = (event) => {
      if (![LS_KEYS.theme, LS_KEYS.fontScale, LS_KEYS.allowLocation, LS_KEYS.allowCamera, LS_KEYS.dirty].includes(event.key)) {
        return;
      }
      syncingRef.current = true;
      setSettings(readLocalSettings());
    };

    window.addEventListener("user_settings_updated", handleSettingsUpdate);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("user_settings_updated", handleSettingsUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!isCustomer) {
      setSettings(readLocalSettings());
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    userService
      .getSettings()
      .then(async (data) => {
        if (!mounted) return;

        const remote = normalizeSettings(data);
        const local = readLocalSettings();
        const hasPendingGuestChanges = localStorage.getItem(LS_KEYS.dirty) === "true";

        if (hasPendingGuestChanges) {
          const merged = { ...remote, ...local };
          const updated = normalizeSettings(await userService.updateSettings(merged));
          if (!mounted) return;
          setSettings(updated);
          writeLocalSettings(updated, false);
          return;
        }

        setSettings(remote);
        writeLocalSettings(remote, false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err);
        setSettings(readLocalSettings());
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  // Re-run when auth state or role changes (isCustomer captures both)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomer, auth?.email]);

  const updateSettings = useCallback(
    async (updates) => {
      const nextLocal = normalizeSettings({ ...settings, ...updates });

      // Non-customer roles (staff/manager/owner) have no /api/customer/settings access
      if (!isCustomer) {
        setSettings(nextLocal);
        writeLocalSettings(nextLocal, true);
        return nextLocal;
      }

      if (!isAuthenticated) {
        setSettings(nextLocal);
        writeLocalSettings(nextLocal, true);
        return nextLocal;
      }

      try {
        // Send full settings payload including locationPermissionShown so the
        // backend can persist it correctly.
        const payload = {
          theme: nextLocal.theme,
          fontScale: nextLocal.fontScale,
          allowLocation: nextLocal.allowLocation,
          allowCamera: nextLocal.allowCamera,
          locationPermissionShown: nextLocal.locationPermissionShown,
        };
        const updated = normalizeSettings(await userService.updateSettings(payload));
        setSettings(updated);
        writeLocalSettings(updated, false);
        try {
          window.dispatchEvent(new CustomEvent("customer_camera_permission_updated", {
            detail: { allowCamera: updated.allowCamera, sourceId: instanceIdRef.current }
          }));
        } catch (eventError) {
          // Ignore cross-component event issues.
        }
        return updated;
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [isAuthenticated, isCustomer, settings]
  );

  const refetch = useCallback(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    userService
      .getSettings()
      .then((data) => {
        const normalized = normalizeSettings(data);
        setSettings(normalized);
        writeLocalSettings(normalized, false);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch,
  };
}
