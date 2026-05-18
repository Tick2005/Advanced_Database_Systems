/**
 * settingsStore.jsx
 *
 * Thin compatibility wrapper around useCustomerSettings.
 * The canonical settings system is useCustomerSettings (hooks/useCustomerSettings.js)
 * which reads/writes MongoDB via /api/customer/settings and applies CSS variables
 * via data-theme / data-font-scale attributes on <html>.
 *
 * This provider is kept so legacy imports of useSettings() still work, but it
 * delegates all real work to useCustomerSettings.
 */
import { createContext, useCallback, useContext } from "react";
import { useCustomerSettings } from "../hooks/useCustomerSettings";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  // All state lives in useCustomerSettings — this provider just exposes a
  // compatible API surface for any legacy consumers.
  return (
    <SettingsContext.Provider value={null}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Legacy hook — delegates to useCustomerSettings.
 * New code should import useCustomerSettings directly.
 */
export function useSettings() {
  const { settings, loading, error, updateSettings, refetch } = useCustomerSettings();

  const updateSettingsLocally = useCallback(
    (updates) => updateSettings(updates),
    [updateSettings]
  );

  const fetchSettings = useCallback(() => refetch(), [refetch]);

  return {
    settings,
    isLoading: loading,
    error: error?.message || null,
    fetchSettings,
    updateSettings,
    updateSettingsLocally,
    resetSettings: () => updateSettings({
      theme: "light",
      fontScale: "normal",
      allowLocation: false,
      allowCamera: false,
    }),
  };
}
