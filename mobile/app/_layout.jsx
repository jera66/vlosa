/* ========================================================================== */
/* VLOSA — MOBILE ROOT LAYOUT (EXPO)                                          */
/* -------------------------------------------------------------------------- */
/* This file wraps the entire mobile app.                                      */
/*                                                                            */
/* What it does:                                                               */
/* - Creates ONE React Query client for the whole app                          */
/* - Provides the ThemeProvider (default LIGHT, user can change)               */
/* - Boots Anything mobile auth (and shows AuthModal when needed)              */
/* - Sets StatusBar style based on the resolved theme                          */
/* - Defines the stack routes                                                   */
/*                                                                            */
/* NOTE: Mobile auth in Anything works via a webview modal (AuthModal).        */
/* ========================================================================== */

/* =============================== Imports ================================== */

import { useEffect } from "react"; // React hook.

import { Stack } from "expo-router"; // Expo Router stack.

import * as SplashScreen from "expo-splash-screen"; // Splash controller.

import { StatusBar } from "expo-status-bar"; // Status bar.

import { GestureHandlerRootView } from "react-native-gesture-handler"; // Gesture root.

import { View } from "react-native"; // RN view.

import { QueryClient } from "@tanstack/react-query"; // React Query client.
import { QueryClientProvider } from "@tanstack/react-query"; // React Query provider.

import { useAuth } from "@/utils/auth/useAuth"; // Anything mobile auth hook.
// import { useRequireAuth } from "@/utils/auth/useAuth"; // Auto-open auth modal. (REMOVED: we want login screen first)

import { AuthModal } from "@/utils/auth/useAuthModal.jsx"; // The auth modal UI.

import { ThemeProvider } from "@/utils/theme"; // Theme provider.
import { useTheme } from "@/utils/theme"; // Theme hook.

/* =========================== Splash Screen ================================= */

SplashScreen.preventAutoHideAsync(); // Keep splash visible until we say so.

/* ============================ React Query ================================= */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
}); // Single instance.

/* =============================== Layout =================================== */

export default function RootLayout() {
  // Root providers wrapper.
  return (
    <QueryClientProvider client={queryClient}>
      {/* Provide React Query */}
      <ThemeProvider>
        {/* Provide theme */}
        <RootLayoutInner />
        {/* Inner layout that uses hooks */}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/* ============================ Inner Layout ================================ */

function RootLayoutInner() {
  // Inner layout.

  const { actualTheme, tokens } = useTheme(); // Read resolved theme.

  const { initiate, isReady } = useAuth(); // Boot auth state.

  useEffect(() => {
    initiate();
  }, [initiate]); // Start auth bootstrap.

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]); // Hide splash after auth storage loads.

  // useRequireAuth(); // If not signed in, automatically open AuthModal. (REMOVED)

  if (!isReady) {
    return null;
  } // Keep splash.

  const statusBarStyle = actualTheme === "dark" ? "light" : "dark"; // Pick status bar.

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Gesture handler root */}
      <View style={{ flex: 1, backgroundColor: tokens.bg }}>
        {/* Global background */}
        <StatusBar style={statusBarStyle} />
        {/* Status bar */}
        <AuthModal />
        {/* Auth modal (opened explicitly from /login) */}
        <Stack screenOptions={{ headerShown: false }} initialRouteName="login">
          {/* Router stack */}
          <Stack.Screen name="login" />
          {/* Login (FIRST screen) */}
          <Stack.Screen name="index" />
          {/* Dashboard */}
          <Stack.Screen name="settings" />
          {/* Settings */}
          <Stack.Screen name="tasks" />
          {/* Tasks */}
          <Stack.Screen name="memory" />
          {/* Memory */}
          <Stack.Screen name="activity" />
          {/* Activity */}
          <Stack.Screen name="persona" />
          {/* Persona */}
          <Stack.Screen name="rules" />
          {/* Rules */}
          <Stack.Screen name="inbox" />
          {/* Inbox */}
          <Stack.Screen name="integrations" />
          {/* Integrations */}
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
}



