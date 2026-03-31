/* ========================================================================== */
/* VLOSA — NEUMORPHIC UI HELPERS (WEB)                                         */
/* -------------------------------------------------------------------------- */
/* This file contains the "soft 3D" styling rules and tiny reusable UI pieces. */
/* ========================================================================== */

// Import React for hooks and JSX.
import { useMemo, useState } from "react"; // React primitives.

// Import theme tokens so neumorphism matches light/dark.
import { useTheme } from "@/utils/theme"; // Global theme.

// Compute a neumorphic surface style object.
export function neuSurfaceStyle(tokens, { pressed = false, radius = 18 } = {}) {
  // Helper for cards/inputs.
  const outer = `10px 10px 22px ${tokens.shadowDark}, -10px -10px 22px ${tokens.shadowLight}`; // Raised shadow.
  const inner = `inset 10px 10px 22px ${tokens.shadowDark}, inset -10px -10px 22px ${tokens.shadowLight}`; // Pressed shadow.
  const boxShadow = pressed ? inner : outer; // Choose shadow.
  return { backgroundColor: tokens.surface, borderRadius: radius, boxShadow }; // Return style.
}

// A neumorphic card wrapper.
export function NeuCard({ children, className }) {
  // Card wrapper.
  const { tokens } = useTheme(); // Get theme tokens.
  return (
    <div
      className={className}
      style={neuSurfaceStyle(tokens, { pressed: false })}
    >
      {" "}
      {/* Raised surface. */}
      {children} {/* Render children inside the card. */}
    </div> // End card.
  ); // End return.
}

// A neumorphic text input.
export function NeuInput({ value, onChange, placeholder, label }) {
  // Input wrapper.
  const { tokens } = useTheme(); // Get theme tokens.
  return (
    <label className="block w-full">
      {" "}
      {/* Wrap input so label is clickable. */}
      {label ? (
        <div
          className="mb-2 text-xs font-semibold"
          style={{ color: tokens.subtext }}
        >
          {" "}
          {/* Label text. */}
          {label} {/* Render label string. */}
        </div> // End label.
      ) : null}{" "}
      {/* If no label, render nothing. */}
      <input
        value={value} // Controlled value.
        onChange={(e) => onChange(e.target.value)} // Push changes up.
        placeholder={placeholder} // Placeholder hint.
        className="w-full px-4 py-3 text-sm outline-none" // Basic spacing.
        style={{
          ...neuSurfaceStyle(tokens, { pressed: true, radius: 16 }),
          color: tokens.text,
          border: "none",
          backgroundColor: tokens.surface,
        }} // Pressed surface.
      />{" "}
      {/* End input. */}
    </label> // End wrapper.
  ); // End return.
}

// A pressable neumorphic button.
export function NeuButton({
  children,
  onClick,
  variant = "primary",
  disabled,
}) {
  // Button wrapper.
  const { actualTheme, tokens } = useTheme(); // Get theme context.
  const [isDown, setIsDown] = useState(false); // Track press state.
  const isPrimary = variant === "primary"; // Determine variant.
  const buttonBg = isPrimary ? tokens.accent : tokens.surface; // Background.
  const fg = isPrimary
    ? actualTheme === "dark"
      ? "#0B1220"
      : "#FFFFFF"
    : tokens.text; // Text color.
  const baseStyle = useMemo(() => {
    // Memoize computed style.
    if (isPrimary) {
      // Special shadow for primary.
      const outer = `10px 10px 22px ${tokens.shadowDark}, -10px -10px 22px ${tokens.shadowLight}`; // Raised.
      const inner = `inset 10px 10px 22px rgba(0,0,0,0.22), inset -10px -10px 22px rgba(255,255,255,0.12)`; // Pressed.
      const boxShadow = isDown ? inner : outer; // Choose.
      return { backgroundColor: buttonBg, borderRadius: 16, boxShadow }; // Return.
    }
    return neuSurfaceStyle(tokens, { pressed: isDown, radius: 16 }); // Secondary uses normal surface.
  }, [buttonBg, isDown, isPrimary, tokens]); // Dependencies.
  const opacity = disabled ? 0.55 : 1; // Disabled look.
  return (
    <button
      type="button" // Prevent form submit.
      disabled={disabled} // Native disabled.
      onMouseDown={() => setIsDown(true)} // Press in.
      onMouseUp={() => setIsDown(false)} // Press out.
      onMouseLeave={() => setIsDown(false)} // Cancel.
      onTouchStart={() => setIsDown(true)} // Touch in.
      onTouchEnd={() => setIsDown(false)} // Touch out.
      onClick={disabled ? undefined : onClick} // Do nothing if disabled.
      className="px-4 py-3 text-sm font-semibold" // Size + weight.
      style={{
        ...baseStyle,
        color: fg,
        opacity,
        cursor: disabled ? "not-allowed" : "pointer",
        border: "none",
      }} // Final style.
    >
      {children} {/* Button label content. */}
    </button> // End button.
  ); // End return.
}

// A 3-way theme picker (System / Light / Dark).
export function SegmentedThemePicker() {
  // Theme picker.
  const { preference, setPreference, tokens } = useTheme(); // Theme state.
  const options = [
    // Available options.
    { key: "system", label: "System" }, // Follow OS.
    { key: "light", label: "Light" }, // Always light.
    { key: "dark", label: "Dark" }, // Always dark.
  ]; // End list.
  return (
    <div className="grid grid-cols-3 gap-3">
      {" "}
      {/* 3 segments. */}
      {options.map((opt) => {
        // Render each option.
        const isActive = opt.key === preference; // Determine active.
        const style = neuSurfaceStyle(tokens, {
          pressed: isActive,
          radius: 14,
        }); // Press active.
        const color = isActive ? tokens.text : tokens.subtext; // Color text.
        return (
          <button
            key={opt.key} // Stable key.
            type="button" // Not submit.
            onClick={() => setPreference(opt.key)} // Update preference.
            className="px-3 py-3 text-sm font-extrabold" // Segment style.
            style={{ ...style, border: "none", cursor: "pointer", color }} // Final style.
          >
            {opt.label} {/* Segment label. */}
          </button> // End segment button.
        ); // End return.
      })}{" "}
      {/* End map. */}
    </div> // End wrapper.
  ); // End return.
}



