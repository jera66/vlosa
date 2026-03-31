/* ========================================================================== */
/* VLOSA — AUTH: LOG OUT (WEB)                                                */
/* -------------------------------------------------------------------------- */
/* Purpose:                                                                    */
/* - Provide a sign-out page that works for BOTH web and mobile auth flows.    */
/*                                                                            */
/* Design requirements (your request):                                         */
/* - White / grey / navy palette                                               */
/* - Soft neumorphic 3D look                                                   */
/* - Extremely documented code (literally every line commented)                */
/* ========================================================================== */

// SECTION 1 — Imports

// Import React memo hook.
import { useMemo, useState } from "react"; // React primitives.

// Import Anything auth helper.
import useAuth from "@/utils/useAuth"; // Sign out helper.

// Import neumorphic helpers.
import { NeuButton, neuSurfaceStyle } from "@/utils/neu"; // Soft UI.

// Import theme tokens.
import { useTheme } from "@/utils/theme"; // Theme.

// SECTION 2 — Page

// Export sign-out page.
export default function LogoutPage() {
  // Read theme tokens.
  const { tokens } = useTheme(); // Tokens.

  // Read auth action.
  const { signOut } = useAuth(); // Sign out.

  // Track local errors.
  const [error, setError] = useState(null); // Error.

  // Track loading.
  const [loading, setLoading] = useState(false); // Loading.

  // Page style.
  const pageStyle = useMemo(() => {
    // Style.
    return {
      minHeight: "100vh", // Full.
      display: "grid", // Center.
      placeItems: "center", // Center.
      padding: 16, // Padding.
      backgroundColor: tokens.bg, // Background.
      color: tokens.text, // Text.
    }; // End.
  }, [tokens.bg, tokens.text]); // Deps.

  // Panel style.
  const panelStyle = useMemo(() => {
    // Style.
    return {
      ...neuSurfaceStyle(tokens, { pressed: false, radius: 22 }), // Raised.
      padding: 22, // Inner.
      width: "100%", // Full.
      maxWidth: 420, // Max.
    }; // End.
  }, [tokens]); // Deps.

  // Click handler.
  const onSignOut = async () => {
    // Reset.
    setError(null); // Clear.

    // Start.
    setLoading(true); // Disable.

    try {
      // Ask Anything to sign out.
      await signOut({
        callbackUrl: "/", // Return home.
        redirect: true, // Redirect.
      }); // End call.
    } catch (e) {
      // Log.
      console.error(e); // Console.
      setError("Could not sign out. Please try again."); // UI.
      setLoading(false); // Re-enable.
    }
  }; // End handler.

  // Render.
  return (
    // Wrapper.
    <div style={pageStyle}>
      {/* Panel */}
      <div style={panelStyle}>
        {/* Title */}
        <div className="text-center text-2xl font-extrabold">Sign out</div>

        {/* Subtext */}
        <div
          className="mt-2 text-center text-sm"
          style={{ color: tokens.subtext }}
        >
          End your session on this device.
        </div>

        {/* Error */}
        {error ? (
          <div
            className="mt-5 p-4 text-sm"
            style={{
              ...neuSurfaceStyle(tokens, { pressed: true, radius: 16 }),
              color: "#B91C1C",
            }}
          >
            {error}
          </div>
        ) : null}

        {/* Button */}
        <div className="mt-6">
          <NeuButton disabled={loading} onClick={onSignOut}>
            {loading ? "Signing out…" : "Sign out"}
          </NeuButton>
        </div>
      </div>
    </div>
  );
}



