/* ========================================================================== */
/* VLOSA — AUTH: SIGN IN (WEB)                                                */
/* -------------------------------------------------------------------------- */
/* This page is used by:                                                      */
/* - Web users directly                                                       */
/* - Mobile users indirectly (inside the AuthWebView modal)                    */
/*                                                                            */
/* IMPORTANT (Anything platform constraint):                                   */
/* - Mobile auth requires a REAL redirect after sign-in.                       */
/* - So we keep redirect:true, and we delay the sign-in call by 3 seconds      */
/*   to let the VLOSA logo spin first (your requirement).                      */
/*                                                                            */
/* Requirements (your request):                                               */
/* - First screen should be login (handled by redirect from /)                */
/* - Show clear, user-visible error messages                                   */
/* - Style errors (neumorphic, red accent)                                    */
/* - Unique VLOSA logo that spins for 3 seconds on submit                      */
/* - Redirect to dashboard AFTER the 3-second spin (when sign-in succeeds)    */
/* - Code is extremely documented: every line commented                        */
/* ========================================================================== */

/* =============================== Imports ================================== */

import { useMemo } from "react"; // React: memo.
import { useRef } from "react"; // React: ref.
import { useState } from "react"; // React: state.

import useAuth from "@/utils/useAuth"; // Anything auth helper.

import { NeuButton } from "@/utils/neu"; // Neumorphic button.
import { NeuInput } from "@/utils/neu"; // Neumorphic input.
import { neuSurfaceStyle } from "@/utils/neu"; // Neumorphic surface styling.

import { useTheme } from "@/utils/theme"; // Theme tokens.

/* =========================== Error Messages =============================== */

const ERROR_MESSAGES = {
  OAuthSignin:
    "Couldn’t start sign-in. Please try again or use a different method.",
  OAuthCallback: "Sign-in failed after redirecting. Please try again.",
  OAuthCreateAccount:
    "Couldn’t create an account with this sign-in method. Try another option.",
  EmailCreateAccount:
    "This email can’t be used to create an account. It may already exist.",
  Callback: "Something went wrong during sign-in. Please try again.",
  OAuthAccountNotLinked:
    "This account is linked to a different sign-in method. Try using that instead.",
  CredentialsSignin: "Incorrect email or password. Try again.",
  AccessDenied: "You don’t have permission to sign in.",
  Configuration: "Sign-in isn’t working right now. Please try again later.",
  Verification: "Your sign-in link has expired. Request a new one.",
}; // End mapping.

/* =============================== Page ===================================== */

export default function SignInPage() {
  const { tokens } = useTheme(); // Theme tokens.

  const { signInWithCredentials } = useAuth(); // Sign-in action.

  const [email, setEmail] = useState(""); // Email input.
  const [password, setPassword] = useState(""); // Password input.

  const [error, setError] = useState(null); // Error message.
  const [loading, setLoading] = useState(false); // Loading flag.

  const [spinning, setSpinning] = useState(false); // Logo spinning flag.

  // NEW: A short status line that appears under the logo during the 3s spin.
  const [statusText, setStatusText] = useState(null); // Status line text.

  // NEW: When true, we hide the entire form/panel and show ONLY the logo + status.
  const [showSpinnerOnly, setShowSpinnerOnly] = useState(false); // Spinner-only mode.

  const timeoutRef = useRef(null); // Track scheduled sign-in call.

  const signUpHref = useMemo(() => {
    const search =
      typeof window !== "undefined" ? window.location.search || "" : ""; // Query string.
    return `/account/signup${search}`; // Keep callbackUrl if present.
  }, []); // Run once.

  const canSubmit = useMemo(() => {
    const hasEmail = email.trim().length > 0; // Email present?
    const hasPassword = password.trim().length > 0; // Password present?
    const ok = hasEmail && hasPassword && !loading; // Combined.
    return ok; // Return.
  }, [email, password, loading]); // Dependencies.

  const buttonLabel = useMemo(() => {
    if (loading) {
      return "Signing in…";
    }
    return "Sign in";
  }, [loading]);

  // NEW: Derived status line, shown only while loading/spinning.
  const statusLine = useMemo(() => {
    const shouldShow = Boolean(loading && statusText); // Gate.
    if (!shouldShow) {
      return null; // Hide.
    }
    return statusText; // Show.
  }, [loading, statusText]);

  const startLogoSpin = () => {
    setSpinning(true); // Turn on class.
    setTimeout(() => {
      setSpinning(false); // Turn off class.
    }, 3000); // Exactly 3 seconds.
  };

  const clearPendingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault(); // Stop full page refresh.

    clearPendingTimeout(); // Avoid multiple queued submits.

    setError(null); // Clear error.

    // Spin on every button press (requested).
    startLogoSpin(); // Spin.

    // Validate BEFORE we hide the form.
    if (!email.trim() || !password.trim()) {
      setStatusText(null); // Clear status.
      setShowSpinnerOnly(false); // Ensure form is visible.
      setError("Please fill in all fields."); // Friendly validation.
      return; // Stop.
    }

    // Now that validation passed, switch to spinner-only view.
    setStatusText("Signing in…"); // Status text (under logo).
    setLoading(true); // Disable button.
    setShowSpinnerOnly(true); // Hide the form; show only logo + status.

    timeoutRef.current = setTimeout(async () => {
      try {
        await signInWithCredentials({
          email: email.trim(), // Normalize.
          password: password, // Keep.
          callbackUrl: "/", // Dashboard.
          redirect: true, // REQUIRED for Anything mobile auth flow.
        });
      } catch (err) {
        const key = err?.message ? String(err.message) : ""; // Error key.
        const friendly =
          ERROR_MESSAGES[key] || "Something went wrong. Please try again."; // Friendly.
        setError(friendly); // Show.
        setStatusText(null); // Clear status line.
        setLoading(false); // Re-enable.
        setShowSpinnerOnly(false); // Show the form again.
      }
    }, 3000);
  };

  const pageStyle = useMemo(() => {
    return {
      minHeight: "100vh", // Full screen.
      display: "grid", // Centering layout.
      placeItems: "center", // Center.
      padding: 16, // Space.
      backgroundColor: tokens.bg, // Theme background.
      color: tokens.text, // Theme text.
    }; // End.
  }, [tokens.bg, tokens.text]); // Dependencies.

  const panelStyle = useMemo(() => {
    return {
      ...neuSurfaceStyle(tokens, { pressed: false, radius: 22 }), // Raised card.
      padding: 22, // Inner.
      width: "100%", // Full.
      maxWidth: 420, // Limit.
    }; // End.
  }, [tokens]); // Dependencies.

  const logoOuterStyle = useMemo(() => {
    return {
      width: 92, // Size.
      height: 92, // Size.
      borderRadius: 999, // Circle.
      display: "grid", // Center.
      placeItems: "center", // Center.
      backgroundColor: tokens.surface, // Surface.
      ...neuSurfaceStyle(tokens, { pressed: false, radius: 999 }), // Raised circle.
    }; // End.
  }, [tokens]); // Dependencies.

  const logoCoreStyle = useMemo(() => {
    return {
      width: 74, // Inner.
      height: 74, // Inner.
      borderRadius: 999, // Circle.
      display: "grid", // Center.
      placeItems: "center", // Center.
      backgroundColor: tokens.surface, // Surface.
      ...neuSurfaceStyle(tokens, { pressed: true, radius: 999 }), // Inset.
    }; // End.
  }, [tokens]); // Dependencies.

  const errorStyle = useMemo(() => {
    return {
      ...neuSurfaceStyle(tokens, { pressed: true, radius: 16 }), // Inset.
      color: "#B91C1C", // Red.
      border: "1px solid rgba(185,28,28,0.25)", // Border.
    }; // End.
  }, [tokens]); // Dependencies.

  // NEW: In spinner-only mode, show ONLY the logo + status line, centered.
  if (showSpinnerOnly) {
    return (
      <div style={pageStyle}>
        {/* Page wrapper (spinner-only mode) */}
        <div style={{ display: "grid", placeItems: "center", gap: 10 }}>
          {/* Center stack */}
          <div style={logoOuterStyle}>
            {/* Logo outer surface */}
            <div style={logoCoreStyle} className={spinning ? "vlosa-spin" : ""}>
              {/* Logo core (spins) */}
              <div
                style={{ fontSize: 34, fontWeight: 900, color: tokens.text }}
              >
                {/* V glyph */}V{/* Letter mark */}
              </div>
            </div>
          </div>

          <div
            className="text-center text-sm font-semibold"
            style={{ color: tokens.subtext }}
          >
            {/* Status line */}
            {statusText || "Signing in…"}
            {/* Status text */}
          </div>
        </div>

        <style jsx global>{`
          @keyframes vlosaSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(1080deg); }
          }
          .vlosa-spin {
            animation: vlosaSpin 3000ms ease-in-out 1;
          }
        `}</style>
        {/* Spin animation */}
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Page wrapper */}
      <div style={{ marginBottom: 18, display: "grid", placeItems: "center" }}>
        {/* Logo block */}
        <div style={logoOuterStyle}>
          {/* Logo outer surface */}
          <div style={logoCoreStyle} className={spinning ? "vlosa-spin" : ""}>
            {/* Logo core (spins) */}
            <div style={{ fontSize: 34, fontWeight: 900, color: tokens.text }}>
              {/* V glyph */}V{/* Letter mark */}
            </div>
          </div>
        </div>

        {/* NEW: Status line under the logo during the 3-second spin */}
        {statusLine ? (
          <div
            className="mt-2 text-center text-sm font-semibold"
            style={{ color: tokens.subtext }}
          >
            {/* Status line */}
            {statusLine}
            {/* Status text */}
          </div>
        ) : null}
        {/* End status line */}

        <div className="mt-3 text-center text-lg font-extrabold">
          VLOSA{/* Brand */}
        </div>
        <div
          className="mt-1 text-center text-sm"
          style={{ color: tokens.subtext }}
        >
          {/* Subtitle */}
          Virtual Life Operating System Agent{/* Subtitle text */}
        </div>
      </div>

      <div style={panelStyle}>
        {/* Card */}
        <div className="text-center text-2xl font-extrabold">
          Sign in{/* Title */}
        </div>

        <div
          className="mt-2 text-center text-sm"
          style={{ color: tokens.subtext }}
        >
          {/* Sub */}
          Your digital self, always awake.{/* Sub text */}
        </div>

        <form noValidate onSubmit={onSubmit} className="mt-6 grid gap-4">
          {/* Form */}
          <NeuInput
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />
          {/* Email */}

          <NeuInput
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Your password"
          />
          {/* Password */}

          {error ? (
            <div className="p-4 text-sm" style={errorStyle}>
              {/* Error box */}
              {error}
              {/* Error message */}
            </div>
          ) : null}
          {/* End error */}

          <NeuButton disabled={!canSubmit} onClick={onSubmit}>
            {/* Submit */}
            {buttonLabel}
            {/* Button text */}
          </NeuButton>

          <div
            className="text-center text-sm"
            style={{ color: tokens.subtext }}
          >
            {/* Footer */}
            Don’t have an account?{/* Prompt */}{" "}
            <a
              href={signUpHref}
              className="font-semibold"
              style={{ color: tokens.accent }}
            >
              {/* Link */}
              Sign up{/* Link text */}
            </a>
          </div>
        </form>
      </div>

      <style jsx global>{`
        @keyframes vlosaSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(1080deg); }
        }
        .vlosa-spin {
          animation: vlosaSpin 3000ms ease-in-out 1;
        }
      `}</style>
      {/* Spin animation */}
    </div>
  );
}



