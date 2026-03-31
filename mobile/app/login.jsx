/* ========================================================================== */ // Banner line 1.
/* VLOSA — LOGIN (MOBILE)                                                     */ // Banner line 2.
/* -------------------------------------------------------------------------- */ // Banner line 3.
/* Requirement (your request):                                                */ // Banner line 4.
/* - This MUST be the first screen.                                           */ // Banner line 5.
/* - After successful login, redirect to the dashboard.                       */ // Banner line 6.
/* - Show user-visible errors, nicely styled.                                 */ // Banner line 7.
/* - Show a unique VLOSA logo that SPINS for 3 seconds when buttons are pressed. */ // Banner line 8.
/*                                                                            */ // Banner line 9.
/* Platform constraint (Anything):                                            */ // Banner line 10.
/* - Mobile auth is web-based in a modal (AuthModal).                         */ // Banner line 11.
/* - We do NOT build native email/password auth on mobile.                    */ // Banner line 12.
/* ========================================================================== */ // Banner line 13.

/* =============================== Imports ================================== */ // Section header.

import { useRouter } from "expo-router"; // Router for navigation.

import { useEffect } from "react"; // Effect hook.
import { useMemo } from "react"; // Memo hook.
import { useRef } from "react"; // Ref hook.
import { useState } from "react"; // State hook.

import { Animated } from "react-native"; // Animated for logo spin.
import { ScrollView } from "react-native"; // Scroll.
import { Text } from "react-native"; // Text.
import { View } from "react-native"; // Layout.

import useUser from "@/utils/auth/useUser"; // Current user (from token).

import { useAuth } from "@/utils/auth/useAuth"; // Anything auth actions.

import { useTheme } from "@/utils/theme"; // Theme tokens.

import { NeuButton } from "@/utils/neu"; // Neumorphic button.
import { neuStyle } from "@/utils/neu"; // Neumorphic surface helper.

/* =============================== Helpers ================================== */ // Section header.

function computeFirstNameFromUser(user) {
  // Compute a human-friendly first name.
  const rawName = user?.name ? String(user.name).trim() : ""; // Name.
  const rawEmail = user?.email ? String(user.email).trim() : ""; // Email.

  if (rawName) {
    // If we have a name...
    const parts = rawName.split(/\s+/).filter(Boolean); // Split.
    return parts.length > 0 ? parts[0] : ""; // First word.
  }

  if (rawEmail) {
    // If we only have an email...
    const local = rawEmail.split("@")[0] || ""; // Local part.
    const token = local.split(/[._-]+/).filter(Boolean)[0] || ""; // First token.
    const pretty = token ? token[0].toUpperCase() + token.slice(1) : ""; // Capitalize.
    return pretty; // Return.
  }

  return ""; // Fallback.
}

function startSpin({ spinValue, setIsSpinning }) {
  // Spin the logo for exactly 3 seconds.
  setIsSpinning(true); // Mark spinning.
  spinValue.setValue(0); // Reset rotation.
  Animated.timing(spinValue, {
    toValue: 1, // One full spin unit.
    duration: 3000, // 3 seconds.
    useNativeDriver: true, // Perform on native thread.
  }).start(() => {
    setIsSpinning(false); // Stop spinning after animation.
  });
}

/* =============================== Screen =================================== */ // Section header.

export default function LoginScreen() {
  // Define login screen.

  const router = useRouter(); // Router instance.
  const { tokens } = useTheme(); // Theme tokens.

  const { data: user, loading: userLoading } = useUser(); // Current user.

  const { signIn, signUp, isReady, isAuthenticated } = useAuth(); // Auth actions.

  const firstName = useMemo(() => computeFirstNameFromUser(user), [user]); // First name.

  const [error, setError] = useState(null); // Error message.

  // NEW: When true, we hide the entire "actions" area and show ONLY the logo + status.
  const [showSpinnerOnly, setShowSpinnerOnly] = useState(false); // Spinner-only mode.

  // NEW: Track whether the user is mid "sign in" or "sign up".
  const [pendingAuthMode, setPendingAuthMode] = useState(null); // 'signin' | 'signup'.

  // NEW: A short status line that appears under the logo during the 3s spin.
  const [statusText, setStatusText] = useState(null); // "Signing in…" / "Signing up…".

  const spinValue = useRef(new Animated.Value(0)).current; // Spin value.

  const [isSpinning, setIsSpinning] = useState(false); // UI spin flag.

  const rotation = spinValue.interpolate({
    inputRange: [0, 1], // Normalized.
    outputRange: ["0deg", "1080deg"], // 3 full rotations looks nice.
  });

  // NEW: Decide what to show under the logo (only when spinning + we have a status).
  const statusLine = useMemo(() => {
    const shouldShow = Boolean(isSpinning && statusText); // Gate.
    if (!shouldShow) {
      return null; // Hide.
    }
    return statusText; // Show.
  }, [isSpinning, statusText]);

  useEffect(() => {
    // When auth is ready AND we are already signed in, leave login.
    if (!isReady) {
      return; // Still booting.
    }
    if (isAuthenticated) {
      // If signed in...

      // NEW: In the "redirect" phase, hide everything except the logo + status.
      setShowSpinnerOnly(true); // Spinner-only view.

      // NEW: If the user pressed "Create account", show Signing up… here.
      const nextStatus =
        pendingAuthMode === "signup" ? "Signing up…" : "Signing in…"; // Message.

      setStatusText(nextStatus); // Show under the logo.

      startSpin({ spinValue, setIsSpinning }); // Spin before redirect.

      const timeout = setTimeout(() => {
        router.replace("/"); // Dashboard.
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, isReady, pendingAuthMode, router, spinValue]);

  const logoOuterStyle = useMemo(() => {
    // Create a neumorphic circle container.
    return {
      width: 92,
      height: 92,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tokens.surface,
      ...neuStyle(tokens, { pressed: false, radius: 999 }),
    };
  }, [tokens]);

  const logoInnerStyle = useMemo(() => {
    // Inner “engraved” circle.
    return {
      width: 74,
      height: 74,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tokens.surface,
      ...neuStyle(tokens, { pressed: true, radius: 999 }),
    };
  }, [tokens]);

  const errorBoxStyle = useMemo(() => {
    // Error box styling.
    return {
      padding: 14,
      ...neuStyle(tokens, { pressed: true, radius: 16 }),
      borderWidth: 1,
      borderColor: "rgba(185,28,28,0.25)",
    };
  }, [tokens]);

  const onPressSignIn = () => {
    // Open sign-in modal.

    setError(null); // Clear errors.

    setPendingAuthMode("signin"); // Track mode.

    setStatusText("Signing in…"); // Status line.

    setShowSpinnerOnly(true); // Hide buttons while we spin.

    startSpin({ spinValue, setIsSpinning }); // Spin immediately on button press.

    const timeout = setTimeout(() => {
      try {
        signIn(); // Open AuthModal in sign-in mode.
        setShowSpinnerOnly(false); // Show buttons again (modal is now up).
      } catch (e) {
        setStatusText(null); // Clear status.
        setShowSpinnerOnly(false); // Restore UI.
        setError("Could not open sign-in. Please try again.");
      }
    }, 3000);

    return () => clearTimeout(timeout);
  };

  const onPressSignUp = () => {
    // Open sign-up modal.

    setError(null); // Clear errors.

    setPendingAuthMode("signup"); // Track mode.

    setStatusText("Signing up…"); // Status line.

    setShowSpinnerOnly(true); // Hide buttons while we spin.

    startSpin({ spinValue, setIsSpinning }); // Spin immediately.

    const timeout = setTimeout(() => {
      try {
        signUp(); // Open AuthModal in sign-up mode.
        setShowSpinnerOnly(false); // Show buttons again (modal is now up).
      } catch (e) {
        setStatusText(null); // Clear status.
        setShowSpinnerOnly(false); // Restore UI.
        setError("Could not open sign-up. Please try again.");
      }
    }, 3000);

    return () => clearTimeout(timeout);
  };

  // NEW: In spinner-only mode, show ONLY the centered logo + status line.
  if (showSpinnerOnly) {
    return (
      <View
        style={{
          flex: 1, // Fill screen.
          backgroundColor: tokens.bg, // Theme background.
          alignItems: "center", // Center horizontally.
          justifyContent: "center", // Center vertically.
          padding: 16, // Breathing room.
          gap: 12, // Space between logo and text.
        }}
      >
        {/* Spinner-only wrapper */}
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          {/* Animated logo wrapper */}
          <View style={logoOuterStyle}>
            {/* Outer logo surface */}
            <View style={logoInnerStyle}>
              {/* Inner logo surface */}
              <Text
                style={{ fontSize: 34, fontWeight: "900", color: tokens.text }}
              >
                {/* V mark */}V{/* End V mark */}
              </Text>
              {/* End V mark */}
            </View>
            {/* End inner surface */}
          </View>
          {/* End outer surface */}
        </Animated.View>
        {/* End animated wrapper */}

        <Text
          style={{
            fontSize: 13, // Size.
            fontWeight: "700", // Emphasis.
            color: tokens.subtext, // Subtle color.
            textAlign: "center", // Center.
          }}
        >
          {/* Status line */}
          {statusText || "Working…"}
          {/* Status text */}
        </Text>
        {/* End status line */}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.bg }} // Screen background.
      contentContainerStyle={{ padding: 16, paddingTop: 26, gap: 14 }} // Layout.
      showsVerticalScrollIndicator={false} // Clean look.
    >
      {/* Header / branding block */}
      <View style={{ alignItems: "center", gap: 12 }}>
        {/* Animated logo wrapper */}
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          {/* Outer logo surface */}
          <View style={logoOuterStyle}>
            {/* Inner logo surface */}
            <View style={logoInnerStyle}>
              {/* V mark */}
              <Text
                style={{ fontSize: 34, fontWeight: "900", color: tokens.text }}
              >
                V
              </Text>
              {/* End V mark */}
            </View>
            {/* End inner surface */}
          </View>
          {/* End outer surface */}
        </Animated.View>
        {/* End animated wrapper */}

        {/* NEW: Status text under the logo while spinning */}
        {statusLine ? (
          <Text
            style={{
              fontSize: 13, // Size.
              fontWeight: "700", // Emphasis.
              color: tokens.subtext, // Subtle color.
              textAlign: "center", // Center.
            }}
          >
            {statusLine}
          </Text>
        ) : null}
        {/* End status text */}

        {/* App title */}
        <Text style={{ fontSize: 22, fontWeight: "900", color: tokens.text }}>
          VLOSA
        </Text>
        {/* End app title */}

        {/* Subtitle */}
        <Text
          style={{ fontSize: 14, color: tokens.subtext, textAlign: "center" }}
        >
          Virtual Life Operating System Agent
        </Text>
        {/* End subtitle */}

        {/* Loading / context */}
        <Text style={{ fontSize: 13, color: tokens.text, textAlign: "center" }}>
          {userLoading
            ? "Loading…"
            : firstName
              ? `Welcome, ${firstName}.`
              : "Welcome."}
        </Text>
        {/* End context */}
      </View>
      {/* End header */}

      {/* Error message block */}
      {error ? (
        <View style={errorBoxStyle}>
          {/* Error title */}
          <Text style={{ fontSize: 13, fontWeight: "900", color: "#B91C1C" }}>
            {error}
          </Text>
          {/* End error title */}
        </View>
      ) : null}
      {/* End error message block */}

      {/* Actions card */}
      <View
        style={{
          padding: 16,
          ...neuStyle(tokens, { pressed: false, radius: 18 }),
        }}
      >
        {/* Card title */}
        <Text style={{ fontSize: 16, fontWeight: "900", color: tokens.text }}>
          Sign in to your machine
        </Text>
        {/* End card title */}

        {/* Card subtitle */}
        <Text style={{ marginTop: 6, fontSize: 13, color: tokens.subtext }}>
          Your data is private and tied to your account.
        </Text>
        {/* End card subtitle */}

        {/* Button stack */}
        <View style={{ marginTop: 14, gap: 10 }}>
          {/* Sign in button */}
          <NeuButton
            label={isSpinning ? "Working…" : "Sign in"}
            tokens={tokens}
            disabled={!isReady || isSpinning}
            onPress={onPressSignIn}
          />
          {/* End sign in button */}

          {/* Sign up button */}
          <NeuButton
            label={isSpinning ? "Working…" : "Create account"}
            variant="secondary"
            tokens={tokens}
            disabled={!isReady || isSpinning}
            onPress={onPressSignUp}
          />
          {/* End sign up button */}
        </View>
        {/* End button stack */}
      </View>
      {/* End actions card */}

      {/* Footer note */}
      <Text
        style={{ fontSize: 12, color: tokens.subtext, textAlign: "center" }}
      >
        {isReady ? "" : "Preparing authentication…"}
      </Text>
      {/* End footer note */}

      {/* Bottom spacing */}
      <View style={{ height: 18 }} />
      {/* End bottom spacing */}
    </ScrollView>
  );
}



