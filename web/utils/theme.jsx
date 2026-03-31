/* ========================================================================== */
/* VLOSA — THEME SYSTEM (WEB)                                                  */
/* -------------------------------------------------------------------------- */
/* What you asked for:                                                         */
/* - Default theme must be LIGHT                                                */
/* - User can switch: Light / Dark / System                                     */
/* - Entire app uses the same tokens (bg, surface, shadows, text)               */
/*                                                                            */
/* Junior-friendly note:                                                        */
/* - “Tokens” are named colors/values that the rest of the app uses.           */
/* - That way, we don’t hardcode random hex codes everywhere.                  */
/* ========================================================================== */

/* =============================== Imports ================================== */

import React from "react"; // Import React itself.
import { createContext } from "react"; // Import context creator.
import { useCallback } from "react"; // Import memoized callback hook.
import { useEffect } from "react"; // Import effect hook.
import { useMemo } from "react"; // Import memoization hook.
import { useState } from "react"; // Import state hook.

/* =============================== Constants ================================= */

const STORAGE_KEY = "vlosa_theme_preference"; // New key (VLOSA).
const LEGACY_STORAGE_KEY = "vj_theme_preference"; // Old key kept only for migration.
const ALLOWED_PREFERENCES = ["system", "light", "dark"]; // Allowed preference values.

/* ============================ Token Factory ================================ */

function getTokens(actualTheme) {
  // Convert an actual theme (light/dark) into a token object.
  if (actualTheme === "light") {
    // Light theme tokens.
    return {
      name: "light", // Name.
      bg: "#F5F6FA", // Background.
      surface: "#F5F6FA", // Surface background.
      shadowLight: "#FFFFFF", // Highlight shadow.
      shadowDark: "#D6DCE8", // Soft dark shadow.
      text: "#0B1220", // Main text.
      subtext: "#4B5563", // Secondary text.
      accent: "#0A0F2A", // Navy accent.
    }; // Return.
  }
  return {
    // Dark theme tokens (charcoal navy, not pure black).
    name: "dark", // Name.
    bg: "#0B1220", // Background.
    surface: "#0F172A", // Surface.
    shadowLight: "rgba(255,255,255,0.06)", // Highlight edge.
    shadowDark: "rgba(0,0,0,0.55)", // Dark shadow.
    text: "rgba(255,255,255,0.92)", // Main text.
    subtext: "rgba(255,255,255,0.68)", // Secondary text.
    accent: "#E5E7EB", // Accent.
  }; // Return.
}

/* ============================== Context =================================== */

const ThemeContext = createContext(null); // Create context holder.

export function useTheme() {
  // Public hook to read theme state.
  const ctx = React.useContext(ThemeContext); // Read context.
  if (!ctx) {
    // If hook used outside provider...
    throw new Error("useTheme must be used inside <ThemeProvider>"); // Fail fast.
  }
  return ctx; // Return context.
}

/* ============================== Provider ================================== */

export function ThemeProvider({ children }) {
  // Provider component that wraps the entire web app.
  const [preference, setPreference] = useState("light"); // Default to LIGHT (your requirement).
  const [systemTheme, setSystemTheme] = useState("light"); // Track OS theme (only used when preference=system).

  useEffect(() => {
    // Load persisted preference + subscribe to OS theme changes.
    if (typeof window === "undefined") {
      // SSR safety.
      return; // Skip on the server.
    }

    try {
      // 1) Prefer new key.
      const stored = window.localStorage.getItem(STORAGE_KEY); // Read.
      const isAllowed = ALLOWED_PREFERENCES.includes(stored); // Validate.

      if (isAllowed) {
        // If valid...
        setPreference(stored); // Use it.
      } else {
        // 2) Fallback: legacy key.
        const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY); // Read legacy.
        const legacyAllowed = ALLOWED_PREFERENCES.includes(legacy); // Validate legacy.

        if (legacyAllowed) {
          // If legacy value is valid...
          setPreference(legacy); // Use it.
          window.localStorage.setItem(STORAGE_KEY, legacy); // Migrate.
          window.localStorage.removeItem(LEGACY_STORAGE_KEY); // Cleanup.
        }
      }
    } catch (error) {
      console.error("[ThemeProvider] Failed reading localStorage", error);
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)"); // Watch OS theme.

    const update = () => {
      // Update handler.
      setSystemTheme(media.matches ? "dark" : "light"); // Set system theme.
    }; // End handler.

    update(); // Initialize immediately.

    if (typeof media.addEventListener === "function") {
      // Modern browsers.
      media.addEventListener("change", update); // Subscribe.
      return () => media.removeEventListener("change", update); // Cleanup.
    }

    media.addListener(update); // Old Safari fallback.
    return () => media.removeListener(update); // Cleanup for old Safari.
  }, []); // Run once.

  useEffect(() => {
    // Persist preference when it changes.
    if (typeof window === "undefined") {
      // SSR safety.
      return; // Skip.
    }
    try {
      // Try to persist.
      window.localStorage.setItem(STORAGE_KEY, preference); // Write.
    } catch (error) {
      // If write fails...
      console.error("[ThemeProvider] Failed writing localStorage", error); // Log.
    }
  }, [preference]); // Re-run on preference change.

  const actualTheme = preference === "system" ? systemTheme : preference; // Resolve system -> real theme.
  const tokens = useMemo(() => getTokens(actualTheme), [actualTheme]); // Compute tokens.

  const setThemePreference = useCallback((nextPreference) => {
    // Safe setter for preference.
    const isAllowed = ALLOWED_PREFERENCES.includes(nextPreference); // Validate.
    if (!isAllowed) {
      // If invalid...
      console.error(
        `[ThemeProvider] Ignoring invalid theme preference: ${String(nextPreference)}`,
      ); // Log.
      return; // Stop.
    }
    setPreference(nextPreference); // Save state.
  }, []); // No deps.

  const value = useMemo(
    () => ({
      preference, // Raw preference (system/light/dark).
      actualTheme, // Resolved theme (light/dark).
      tokens, // Token object.
      setPreference: setThemePreference, // Setter.
    }),
    [actualTheme, preference, setThemePreference, tokens],
  ); // Memoize context.

  const rootClassName =
    actualTheme === "dark"
      ? "min-h-screen w-full font-inter dark"
      : "min-h-screen w-full font-inter"; // Tailwind dark mode class.

  return (
    <ThemeContext.Provider value={value}>
      {/* Provide theme to all children */}
      <div
        className={rootClassName}
        style={{ backgroundColor: tokens.bg, color: tokens.text }}
      >
        {/* Global background + default text color */}
        {children}
        {/* Render the app */}
      </div>
    </ThemeContext.Provider>
  ); // End return.
}



