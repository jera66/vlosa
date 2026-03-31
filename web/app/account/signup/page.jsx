/* ========================================================================== */
/* VLOSA — AUTH: SIGN UP (WEB)                                                */
/* -------------------------------------------------------------------------- */
/* This page is used by:                                                      */
/* - Web users directly                                                       */
/* - Mobile users indirectly (inside the AuthWebView modal)                    */
/*                                                                            */
/* IMPORTANT (Anything platform constraint):                                   */
/* - Mobile auth requires a REAL redirect after sign-up.                       */
/* - So we keep redirect:true, and we delay the sign-up call by 3 seconds      */
/*   to let the VLOSA logo spin first (your requirement).                      */
/*                                                                            */
/* Requirements (your request):                                               */
/* - Show clear, user-visible error messages                                   */
/* - Style errors (neumorphic, red accent)                                    */
/* - Unique VLOSA logo that spins for 3 seconds on submit                      */
/* - Redirect to dashboard AFTER the 3-second spin (when sign-up succeeds)    */
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
    "Couldn’t start sign-up. Please try again or use a different method.",
  OAuthCallback: "Sign-up failed after redirecting. Please try again.",
  OAuthCreateAccount:
    "Couldn’t create an account with this sign-up option. Try another one.",
  EmailCreateAccount: "This email can’t be used. It may already be registered.",
  Callback: "Something went wrong during sign-up. Please try again.",
  OAuthAccountNotLinked:
    "This account is linked to a different sign-in method. Try using that instead.",
  CredentialsSignin:
    "Invalid email or password. If you already have an account, try signing in instead.",
  AccessDenied: "You don’t have permission to sign up.",
  Configuration: "Sign-up isn’t working right now. Please try again later.",
  Verification: "Your sign-up link has expired. Request a new one.",
}; // End mapping.

/* =============================== Page ===================================== */

export default function SignUpPage() {
  const { tokens } = useTheme(); // Theme tokens.

  const { signUpWithCredentials } = useAuth(); // Sign-up action.

  // NEW: extra fields collected at registration time.
  const [firstName, setFirstName] = useState(""); // First name input.
  const [lastName, setLastName] = useState(""); // Last name input.
  const [phone, setPhone] = useState(""); // Phone number input.

  const [email, setEmail] = useState(""); // Email input.
  const [password, setPassword] = useState(""); // Password input.

  const [error, setError] = useState(null); // Error message.
  const [loading, setLoading] = useState(false); // Loading flag.

  const [spinning, setSpinning] = useState(false); // Logo spinning flag.

  // NEW: A short status line that appears under the logo during the 3s spin.
  const [statusText, setStatusText] = useState(null); // Status line text.

  // NEW: When true, we hide the entire form/panel and show ONLY the logo + status.
  const [showSpinnerOnly, setShowSpinnerOnly] = useState(false); // Spinner-only mode.

  const timeoutRef = useRef(null); // Track scheduled sign-up call.

  const signInHref = useMemo(() => {
    const search =
      typeof window !== "undefined" ? window.location.search || "" : ""; // Query string.
    return `/account/signin${search}`; // Keep callbackUrl if present.
  }, []); // Run once.

  const canSubmit = useMemo(() => {
    const hasFirst = firstName.trim().length > 0; // First name present?
    const hasLast = lastName.trim().length > 0; // Last name present?
    const hasPhone = phone.trim().length > 0; // Phone present?
    const hasEmail = email.trim().length > 0; // Email present?
    const hasPassword = password.trim().length > 0; // Password present?
    const ok =
      hasFirst && hasLast && hasPhone && hasEmail && hasPassword && !loading; // Combined.
    return ok; // Return.
  }, [email, firstName, lastName, loading, password, phone]); // Dependencies.

  const buttonLabel = useMemo(() => {
    if (loading) {
      return "Signing up…";
    }
    return "Sign up";
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
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setStatusText(null); // Clear status.
      setShowSpinnerOnly(false); // Ensure form is visible.
      setError("Please enter first name, last name, and phone number."); // Friendly validation.
      return; // Stop.
    }

    if (!email.trim() || !password.trim()) {
      setStatusText(null); // Clear status.
      setShowSpinnerOnly(false); // Ensure form is visible.
      setError("Please enter email and password."); // Friendly validation.
      return; // Stop.
    }

    // Now that validation passed, switch to spinner-only view.
    setStatusText("Signing up…"); // Status text (under logo).
    setLoading(true); // Disable button.
    setShowSpinnerOnly(true); // Hide the form; show only logo + status.

    timeoutRef.current = setTimeout(async () => {
      try {
        // 1) Save extra profile fields keyed by email (works even before auth exists).
        const profileResponse = await fetch("/api/los/user-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
          }),
        });

        if (!profileResponse.ok) {
          let message = `Could not save your profile details (HTTP ${profileResponse.status}).`;
          try {
            const payload = await profileResponse.json();
            if (payload?.error) {
              message = String(payload.error);
            }
          } catch {
            // Ignore JSON parse failures.
          }
          throw new Error(message);
        }

        // 2) Create the auth account (this redirect is REQUIRED for Anything mobile auth).
        await signUpWithCredentials({
          email: email.trim(), // Normalize.
          password: password, // Keep.
          name: `${firstName.trim()} ${lastName.trim()}`.trim(), // Send name into auth system.
          callbackUrl: "/", // Dashboard.
          redirect: true, // REQUIRED for Anything mobile auth flow.
        });
      } catch (err) {
        const key = err?.message ? String(err.message) : ""; // Error key.
        const friendly =
          ERROR_MESSAGES[key] ||
          key ||
          "Something went wrong. Please try again."; // Friendly.
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
            {statusText || "Signing up…"}
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
          Create account{/* Title */}
        </div>

        <div
          className="mt-2 text-center text-sm"
          style={{ color: tokens.subtext }}
        >
          {/* Sub */}
          Build your digital twin, safely.{/* Sub text */}
        </div>

        <form noValidate onSubmit={onSubmit} className="mt-6 grid gap-4">
          {/* Form */}
          <NeuInput
            label="First name"
            value={firstName}
            onChange={setFirstName}
            placeholder="Jane"
          />
          {/* First name */}

          <NeuInput
            label="Last name"
            value={lastName}
            onChange={setLastName}
            placeholder="Doe"
          />
          {/* Last name */}

          <NeuInput
            label="Phone number"
            value={phone}
            onChange={setPhone}
            placeholder="(555) 123-4567"
          />
          {/* Phone */}

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
            placeholder="Create a password"
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
            Already have an account?{/* Prompt */}{" "}
            <a
              href={signInHref}
              className="font-semibold"
              style={{ color: tokens.accent }}
            >
              {/* Link */}
              Sign in{/* Link text */}
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



