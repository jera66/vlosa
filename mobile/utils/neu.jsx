/* ========================================================================== */
/* VLOSA — NEUMORPHIC UI HELPERS (MOBILE)                                      */
/* -------------------------------------------------------------------------- */
/* React Native can't do true inset shadows like web, but we can get a clean    */
/* soft 3D feel using shadow + elevation.                                      */
/* ========================================================================== */

// Import React for hooks.
import { useMemo, useState } from "react"; // React primitives.

// Import basic React Native pieces.
import { Text, TouchableOpacity, View } from "react-native"; // UI primitives.

// Build a soft 3D surface style (raised or "pressed").
export function neuStyle(tokens, { pressed = false, radius = 18 } = {}) {
  // Neumorphism helper.
  const base = { backgroundColor: tokens.surface, borderRadius: radius }; // Base surface.
  const isDark = tokens.name === "dark"; // Dark mode flag.
  if (pressed) {
    // Pressed style.
    return {
      ...base,
      shadowColor: tokens.shadowColor,
      shadowOpacity: isDark ? 0.18 : 0.06,
      shadowRadius: 6,
      shadowOffset: { width: -2, height: -2 },
      elevation: 2,
    }; // Softer.
  }
  return {
    ...base,
    shadowColor: tokens.shadowColor,
    shadowOpacity: isDark ? 0.35 : 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 6, height: 6 },
    elevation: 4,
  }; // Raised.
}

// A neumorphic card container.
export function NeuCard({ title, children, tokens }) {
  // Card component.
  return (
    // Render card.
    <View
      style={{
        padding: 16,
        ...neuStyle(tokens, { pressed: false, radius: 18 }),
      }}
    >
      {" "}
      {/* Outer surface. */}
      {title ? (
        <Text style={{ fontSize: 14, fontWeight: "800", color: tokens.text }}>
          {title}
        </Text>
      ) : null}{" "}
      {/* Optional title. */}
      <View style={{ marginTop: title ? 12 : 0 }}>{children}</View>{" "}
      {/* Body area. */}
    </View> // End card.
  ); // End return.
}

// A pressable neumorphic button.
export function NeuButton({
  label,
  onPress,
  variant = "primary",
  tokens,
  disabled,
}) {
  // Button component.
  const [down, setDown] = useState(false); // Press state.
  const isPrimary = variant === "primary"; // Variant.
  const bgColor = isPrimary ? tokens.accent : tokens.surface; // Background.
  const fgColor = isPrimary
    ? tokens.name === "dark"
      ? "#0B1220"
      : "#FFFFFF"
    : tokens.text; // Foreground.
  const opacity = disabled ? 0.55 : 1; // Disabled opacity.
  const buttonStyle = useMemo(
    () => ({
      ...neuStyle(tokens, { pressed: down, radius: 16 }),
      backgroundColor: bgColor,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
      opacity,
    }),
    [bgColor, down, opacity, tokens],
  ); // Style.
  return (
    // Render.
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      onPress={disabled ? undefined : onPress}
      style={buttonStyle}
    >
      {" "}
      {/* Touchable. */}
      <Text style={{ fontSize: 13, fontWeight: "800", color: fgColor }}>
        {label}
      </Text>{" "}
      {/* Label. */}
    </TouchableOpacity> // End.
  ); // End return.
}



