/* ========================================================================== */
/* VLOSA — useVlosaActionOverlay (MOBILE)                                     */
/* -------------------------------------------------------------------------- */
/* A tiny helper that makes "important buttons" feel consistent:              */
/* - On press: show the centered VLOSA overlay + status line                   */
/* - Spin for at least 3 seconds (even if the request is fast)                 */
/* - Keep the overlay up until the action finishes                             */
/* - If it fails: hide overlay and let the screen show the error               */
/*                                                                            */
/* Use cases (we'll apply these gradually):                                    */
/* - Gmail connect / sync / disconnect                                         */
/* - Generate AI draft                                                         */
/* - Send email                                                                */
/* ========================================================================== */

/* =============================== Imports ================================== */

import { useCallback } from "react"; // React hook.
import { useMemo } from "react"; // React hook.
import { useRef } from "react"; // React hook.
import { useState } from "react"; // React hook.

import { Animated } from "react-native"; // Animated timing.

import VlosaActionOverlay from "@/components/VlosaActionOverlay"; // Overlay UI.

/* ================================ Hook ==================================== */

export default function useVlosaActionOverlay(tokens) {
  // Create the overlay controller.

  const [visible, setVisible] = useState(false); // Is overlay showing?
  const [statusText, setStatusText] = useState(null); // Status line.

  const spinValue = useRef(new Animated.Value(0)).current; // Spin animation value.

  const rotation = useMemo(() => {
    // Convert 0..1 into degrees.
    return spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "1080deg"], // 3 turns.
    });
  }, [spinValue]);

  const startSpin = useCallback(() => {
    // Spin for exactly 3 seconds.
    spinValue.setValue(0); // Reset.
    Animated.timing(spinValue, {
      toValue: 1, // End.
      duration: 3000, // 3 seconds.
      useNativeDriver: true, // Smooth.
    }).start();
  }, [spinValue]);

  const runWithOverlay = useCallback(
    async ({ nextStatusText }, action) => {
      // Wrap an async action.

      // Guard: must have an action.
      if (typeof action !== "function") {
        throw new Error("Internal error: action must be a function");
      }

      // Prevent double-click actions.
      if (visible) {
        return;
      }

      setVisible(true); // Show overlay.
      setStatusText(nextStatusText || "Working…"); // Set status.

      startSpin(); // Start the 3s spin.

      const minSpinPromise = new Promise((resolve) => {
        // Force at least 3 seconds visible.
        setTimeout(resolve, 3000);
      });

      try {
        // Run action AND keep overlay for at least 3 seconds.
        const result = await Promise.all([minSpinPromise, action()]).then(
          (arr) => arr[1],
        );

        setVisible(false); // Hide overlay.
        setStatusText(null); // Clear.

        return result; // Return action result.
      } catch (e) {
        // On error, hide overlay so the screen can show a message.
        setVisible(false); // Hide overlay.
        setStatusText(null); // Clear.
        throw e; // Bubble.
      }
    },
    [startSpin, visible],
  );

  const overlay = useMemo(() => {
    // Build overlay element.
    if (!visible) {
      return null;
    }

    return (
      <VlosaActionOverlay
        tokens={tokens}
        rotation={rotation}
        statusText={statusText}
      />
    );
  }, [rotation, statusText, tokens, visible]);

  return {
    overlay,
    runWithOverlay,
    visible,
  };
}



