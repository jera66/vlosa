/* ========================================================================== */
/* VLOSA — ACTION OVERLAY (MOBILE)                                            */
/* -------------------------------------------------------------------------- */
/* A full-screen overlay that shows:                                          */
/* - The VLOSA logo (neumorphic)                                              */
/* - A 3-second spin animation (when requested)                               */
/* - A short status line ("Syncing…", "Sending…", etc.)                      */
/*                                                                            */
/* This is meant to be used with the useVlosaActionOverlay hook.              */
/* ========================================================================== */

/* =============================== Imports ================================== */

import { useMemo } from "react"; // React memo.

import { Animated } from "react-native"; // Animation.
import { Text } from "react-native"; // Text.
import { View } from "react-native"; // Layout.

import { neuStyle } from "@/utils/neu"; // Neumorphic helper.

/* =============================== Overlay ================================== */

export default function VlosaActionOverlay({ tokens, rotation, statusText }) {
  // Render overlay.

  const backdropStyle = useMemo(() => {
    // Compute full-screen background.
    // IMPORTANT: make this fully opaque so the underlying screen is effectively gone.
    return {
      position: "absolute", // Overlay.
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: tokens.bg, // Fully cover the screen.
      alignItems: "center", // Center.
      justifyContent: "center", // Center.
      padding: 16, // Breathing room.
    };
  }, [tokens.bg]);

  const logoOuterStyle = useMemo(() => {
    // Outer circle.
    return {
      width: 96,
      height: 96,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tokens.surface,
      ...neuStyle(tokens, { pressed: false, radius: 999 }),
    };
  }, [tokens]);

  const logoInnerStyle = useMemo(() => {
    // Inner engraved circle.
    return {
      width: 76,
      height: 76,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tokens.surface,
      ...neuStyle(tokens, { pressed: true, radius: 999 }),
    };
  }, [tokens]);

  const safeStatus = statusText ? String(statusText) : "Working…"; // Normalize.

  return (
    <View style={backdropStyle}>
      {/* Backdrop */}
      <View style={{ alignItems: "center", gap: 12 }}>
        {/* Center stack */}
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          {/* Animated wrapper */}
          <View style={logoOuterStyle}>
            {/* Outer circle */}
            <View style={logoInnerStyle}>
              {/* Inner circle */}
              <Text
                style={{ fontSize: 36, fontWeight: "900", color: tokens.text }}
              >
                {/* V mark */}V{/* End V mark */}
              </Text>
              {/* End V mark */}
            </View>
            {/* End inner circle */}
          </View>
          {/* End outer circle */}
        </Animated.View>
        {/* End animated wrapper */}

        <Text
          style={{
            fontSize: 13,
            fontWeight: "800",
            color: tokens.subtext,
            textAlign: "center",
          }}
        >
          {/* Status */}
          {safeStatus}
          {/* Status text */}
        </Text>
        {/* End status */}
      </View>
      {/* End center stack */}
    </View>
  );
}



