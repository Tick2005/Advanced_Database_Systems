import { useEffect, useState, useCallback } from "react";
import { userService } from "../features/users/userService";
import { useAuth } from "../features/auth/useAuth";

/**
 * Custom hook to manage customer settings from backend
 * Fetches and caches settings, provides update method
 * Uses localStorage as fallback but prioritizes backend
 */
export function useCustomerSettings() {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState({
    theme: "light",
    fontScale: "normal",
    allowLocation: true,
    allowCamera: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch settings from backend on mount or when authentication changes
  useEffect(() => {
    if (!isAuthenticated) {
      // Not authenticated - use localStorage defaults
      const stored = {
        theme: localStorage.getItem("ux_theme") || "light",
        fontScale: localStorage.getItem("ux_font_scale") || "normal",
        allowLocation: localStorage.getItem("ux_allow_location") !== "false",
        allowCamera: localStorage.getItem("ux_allow_camera") !== "false",
      };
      setSettings(stored);
      setLoading(false);
      return;
    }

    // Authenticated - fetch from backend
    setLoading(true);
    setError(null);
    
    userService
      .getSettings()
      .then((data) => {
        setSettings({
          theme: data.theme || "light",
          fontScale: data.fontScale || "normal",
          allowLocation: data.allowLocation !== false,
          allowCamera: data.allowCamera !== false,
        });
        // Keep localStorage in sync
        localStorage.setItem("ux_theme", data.theme || "light");
        localStorage.setItem("ux_font_scale", data.fontScale || "normal");
        localStorage.setItem("ux_allow_location", String(data.allowLocation !== false));
        localStorage.setItem("ux_allow_camera", String(data.allowCamera !== false));
      })
      .catch((err) => {
        console.error("Failed to fetch settings:", err);
        setError(err);
        // Fallback to localStorage
        const stored = {
          theme: localStorage.getItem("ux_theme") || "light",
          fontScale: localStorage.getItem("ux_font_scale") || "normal",
          allowLocation: localStorage.getItem("ux_allow_location") !== "false",
          allowCamera: localStorage.getItem("ux_allow_camera") !== "false",
        };
        setSettings(stored);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const updateSettings = useCallback(
    async (updates) => {
      if (!isAuthenticated) {
        // Update only localStorage for guest
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        Object.entries(updates).forEach(([key, value]) => {
          const lsKey = `ux_${key.replace(/([A-Z])/g, "_$1").toLowerCase()}`;
          localStorage.setItem(lsKey, String(value));
        });
        return newSettings;
      }

      // Update backend for authenticated users
      try {
        const updatedSettings = await userService.updateSettings(updates);
        const newSettings = {
          theme: updatedSettings.theme || "light",
          fontScale: updatedSettings.fontScale || "normal",
          allowLocation: updatedSettings.allowLocation !== false,
          allowCamera: updatedSettings.allowCamera !== false,
        };
        setSettings(newSettings);
        
        // Keep localStorage in sync
        localStorage.setItem("ux_theme", newSettings.theme);
        localStorage.setItem("ux_font_scale", newSettings.fontScale);
        localStorage.setItem("ux_allow_location", String(newSettings.allowLocation));
        localStorage.setItem("ux_allow_camera", String(newSettings.allowCamera));
        
        return newSettings;
      } catch (err) {
        console.error("Failed to update settings:", err);
        setError(err);
        throw err;
      }
    },
    [isAuthenticated]
  );

  const refetch = useCallback(() => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    userService
      .getSettings()
      .then((data) => {
        setSettings({
          theme: data.theme || "light",
          fontScale: data.fontScale || "normal",
          allowLocation: data.allowLocation !== false,
          allowCamera: data.allowCamera !== false,
        });
        localStorage.setItem("ux_theme", data.theme || "light");
        localStorage.setItem("ux_font_scale", data.fontScale || "normal");
        localStorage.setItem("ux_allow_location", String(data.allowLocation !== false));
        localStorage.setItem("ux_allow_camera", String(data.allowCamera !== false));
      })
      .catch((err) => {
        console.error("Failed to refetch settings:", err);
        setError(err);
      })
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
