/* ========================================================================== */
/* VLOSA — THEME SYSTEM (MOBILE / EXPO)                                        */
/* -------------------------------------------------------------------------- */
/* What you asked for:                                                         */
/* - Default theme must be LIGHT                                                */
/* - User can switch: Light / Dark / System                                     */
/* - Theme must apply across the whole mobile app                               */
/*                                                                            */
/* Implementation notes:                                                       */
/* - We persist preference using expo-secure-store (survives app restarts).     */
/* - When preference is "system", we follow iOS/Android color scheme.           */
/* ========================================================================== */

/* =============================== Imports ================================== */

import React from "react"; // React core.
import { createContext } from "react"; // Context creator.
import { useCallback } from "react"; // Hook.
import { useEffect } from "react"; // Hook.
import { useMemo } from "react"; // Hook.
import { useState } from "react"; // Hook.
import { useColorScheme } from "react-native"; // System theme detector.
import * as SecureStore from "expo-secure-store"; // Persistent secure storage.

/* =============================== Constants ================================= */

const STORAGE_KEY = "vlosa_theme_preference"; // New key (VLOSA).
const LEGACY_STORAGE_KEY = "vj_theme_preference"; // Old key kept for migration.
const ALLOWED_PREFERENCES = ["system", "light", "dark"]; // Allowed values.

/* ============================ Token Factory ================================ */

function getTokens(actualTheme) {
  // Convert a theme string into a token object.
  if (actualTheme === "light") {
    // Light.
    return {
      name: "light", // Name.
      bg: "#F5F6FA", // Background.
      surface: "#F5F6FA", // Surface.
      text: "#0B1220", // Text.
      subtext: "#4B5563", // Subtext.
      accent: "#0A0F2A", // Navy.
      shadowColor: "#000000", // Shadow base.
    }; // Return.
  }
  return {
    // Dark.
    name: "dark", // Name.
    bg: "#0B1220", // Background.
    surface: "#0F172A", // Surface.
    text: "rgba(255,255,255,0.92)", // Text.
    subtext: "rgba(255,255,255,0.68)", // Subtext.
    accent: "#E5E7EB", // Accent.
    shadowColor: "#000000", // Shadow base.
  }; // Return.
}

/* ============================== Context =================================== */

const ThemeContext = createContext(null); // Context instance.

export function useTheme() {
  // Hook to read theme state.
  const ctx = React.useContext(ThemeContext); // Read context.
  if (!ctx) {
    // Validate.
    throw new Error("useTheme must be used inside <ThemeProvider>"); // Fail fast.
  }
  return ctx; // Return.
}

/* ============================== Provider ================================== */

export function ThemeProvider({ children }) {
  // Provider for the mobile app.
  const [preference, setPreference] = useState("light"); // Default LIGHT (your requirement).
  const [loaded, setLoaded] = useState(false); // Flag: did we load SecureStore?
  const systemScheme = useColorScheme(); // "light" | "dark" | null.
  const systemTheme = systemScheme === "dark" ? "dark" : "light"; // Normalize.

  useEffect(() => {
    // Load stored preference once.
    let alive = true; // Cancel flag.
    const run = async () => {
      try {
        // 1) Prefer new key.
        const stored = await SecureStore.getItemAsync(STORAGE_KEY);
        const isAllowed = ALLOWED_PREFERENCES.includes(stored);

        if (alive && isAllowed) {
          setPreference(stored);
          return;
        }

        // 2) Legacy fallback.
        const legacy = await SecureStore.getItemAsync(LEGACY_STORAGE_KEY);
        const legacyAllowed = ALLOWED_PREFERENCES.includes(legacy);

        if (alive && legacyAllowed) {
          setPreference(legacy);
          await SecureStore.setItemAsync(STORAGE_KEY, legacy);
          await SecureStore.deleteItemAsync(LEGACY_STORAGE_KEY);
        }
      } catch (error) {
        console.error("[ThemeProvider] Failed reading SecureStore", error);
      } finally {
        if (alive) {
          setLoaded(true);
        }
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, []); // Run once.

  useEffect(() => {
    // Persist when preference changes.
    if (!loaded) {
      // Avoid overwriting before initial read.
      return; // Skip.
    }
    const run = async () => {
      // Async saver.
      try {
        // Try write.
        await SecureStore.setItemAsync(STORAGE_KEY, preference); // Persist.
      } catch (error) {
        // Handle error.
        console.error("[ThemeProvider] Failed writing SecureStore", error); // Log.
      }
    }; // End run.
    run(); // Start.
  }, [loaded, preference]); // Dependencies.

  const actualTheme = preference === "system" ? systemTheme : preference; // Resolve.
  const tokens = useMemo(() => getTokens(actualTheme), [actualTheme]); // Tokens.

  const setThemePreference = useCallback((nextPreference) => {
    // Safe setter.
    const isAllowed = ALLOWED_PREFERENCES.includes(nextPreference); // Validate.
    if (!isAllowed) {
      // If invalid...
      console.error(
        `[ThemeProvider] Ignoring invalid theme preference: ${String(nextPreference)}`,
      ); // Log.
      return; // Stop.
    }
    setPreference(nextPreference); // Set.
  }, []); // No deps.

  const value = useMemo(
    () => ({
      preference, // User choice.
      actualTheme, // Resolved.
      tokens, // Tokens.
      setPreference: setThemePreference, // Setter.
    }),
    [actualTheme, preference, setThemePreference, tokens],
  ); // Memoize context.

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  ); // End return.
}



