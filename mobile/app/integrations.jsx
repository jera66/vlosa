/* ========================================================================== */ // Banner line 1.
/* VLOSA — INTEGRATIONS SCREEN (MOBILE)                                       */ // Banner line 2.
/* -------------------------------------------------------------------------- */ // Banner line 3.
/* What this screen does (v1):                                                 */ // Banner line 4.
/* - Shows Gmail connection status                                              */ // Banner line 5.
/* - Lets the user connect Gmail (OAuth)                                        */ // Banner line 6.
/* - Lets the user sync the latest messages into Inbox                          */ // Banner line 7.
/* - Lets the user disconnect Gmail                                             */ // Banner line 8.
/*                                                                            */ // Banner line 9.
/* Why this matters:                                                           */ // Banner line 10.
/* - Inbox/Triage becomes REAL once emails are flowing in automatically.        */ // Banner line 11.
/*                                                                            */ // Banner line 12.
/* Safety posture:                                                             */ // Banner line 13.
/* - Even after syncing, we keep approval-first for high-impact actions.        */ // Banner line 14.
/* ========================================================================== */ // Banner line 15.

/* =============================== Imports ================================== */ // Section header.

import { useRouter } from "expo-router"; // Import router for navigation.

import * as Linking from "expo-linking"; // Import Linking to open OAuth URLs.

import { useMemo } from "react"; // Import useMemo for derived values.
import { useState } from "react"; // Import useState for local UI state.

import { ScrollView } from "react-native"; // Import ScrollView for scrolling.
import { Text } from "react-native"; // Import Text for text rendering.
import { View } from "react-native"; // Import View for layout.

import { useMutation } from "@tanstack/react-query"; // Import mutation hook.
import { useQuery } from "@tanstack/react-query"; // Import query hook.
import { useQueryClient } from "@tanstack/react-query"; // Import query cache.

import useUser from "@/utils/auth/useUser"; // Import current user hook.

import { useTheme } from "@/utils/theme"; // Import theme tokens.

import { NeuButton } from "@/utils/neu"; // Import neumorphic button.
import { NeuCard } from "@/utils/neu"; // Import neumorphic card.
import { neuStyle } from "@/utils/neu"; // Import style helper.

import { disconnectGmail } from "@/utils/losApi"; // Import disconnect API.
import { getGmailConnectUrl } from "@/utils/losApi"; // Import connect URL API.
import { getGmailStatus } from "@/utils/losApi"; // Import status API.
import { syncGmail } from "@/utils/losApi"; // Import sync API.

import useVlosaActionOverlay from "@/utils/useVlosaActionOverlay"; // VLOSA overlay helper.

/* =============================== Screen =================================== */ // Section header.

export default function IntegrationsScreen() {
  // Define the screen function.
  // Integrations screen. // Explain.

  const router = useRouter(); // Create router instance.
  const queryClient = useQueryClient(); // Create query cache instance.
  const { tokens } = useTheme(); // Read theme tokens.

  const { data: user, loading: userLoading } = useUser(); // Read current user.

  const canLoad = !!user && !userLoading; // Only call APIs after login.

  const [error, setError] = useState(null); // Store UI error text.

  // NEW: Shared overlay for "important" actions (connect/sync/disconnect).
  const {
    overlay,
    runWithOverlay,
    visible: overlayVisible,
  } = useVlosaActionOverlay(tokens); // Overlay controller.

  /* ============================== Queries ================================= */ // Section header.

  const gmailStatusQuery = useQuery({
    // Create a query to read Gmail status.
    queryKey: ["integrations", "gmail", "status"], // Cache key.
    queryFn: getGmailStatus, // Loader.
    enabled: canLoad, // Only run when authenticated.
  }); // End query.

  const gmailStatus = gmailStatusQuery.data || null; // Normalize status payload.

  const connected = !!gmailStatus?.connected; // Derive boolean.

  const connectedEmail = gmailStatus?.email_address
    ? String(gmailStatus.email_address)
    : ""; // Derive email display.

  /* ============================ Mutations ================================= */ // Section header.

  // CHANGE: keep mutations, but use mutateAsync in our own handlers so we can
  // wrap the whole action in the VLOSA overlay.

  const connectMutation = useMutation({
    // Start Gmail connect.
    mutationFn: getGmailConnectUrl, // Calls GET /connect and returns URL.
  }); // End connect mutation.

  const syncMutation = useMutation({
    // Start Gmail sync.
    mutationFn: () => syncGmail({ limit: 20 }), // Sync last 20 messages.
    onSuccess: () => {
      // After sync...
      queryClient.invalidateQueries({
        queryKey: ["integrations", "gmail", "status"],
      }); // Refresh status.
      queryClient.invalidateQueries({ queryKey: ["los", "inbox"] }); // Refresh inbox.
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] }); // Refresh audit.
    },
  }); // End sync mutation.

  const disconnectMutation = useMutation({
    // Disconnect Gmail.
    mutationFn: disconnectGmail, // Calls POST /disconnect.
    onSuccess: () => {
      // After disconnect...
      queryClient.invalidateQueries({
        queryKey: ["integrations", "gmail", "status"],
      }); // Refresh.
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] }); // Refresh audit.
    },
  }); // End disconnect mutation.

  /* ============================= Handlers ================================= */

  const onPressConnect = async () => {
    // Connect Gmail with VLOSA overlay.
    setError(null); // Clear.
    try {
      await runWithOverlay({ nextStatusText: "Opening Gmail…" }, async () => {
        const url = await connectMutation.mutateAsync();
        if (!url) {
          throw new Error("Could not start Gmail connect");
        }
        await Linking.openURL(url);
      });
    } catch (e) {
      console.error("[Integrations] connect failed", e);
      setError(e?.message || "Could not start Gmail connect");
    }
  };

  const onPressSync = async () => {
    // Sync Gmail with VLOSA overlay.
    setError(null); // Clear.
    try {
      await runWithOverlay({ nextStatusText: "Syncing Gmail…" }, async () => {
        await syncMutation.mutateAsync();
      });
    } catch (e) {
      console.error("[Integrations] sync failed", e);
      setError(e?.message || "Could not sync Gmail");
    }
  };

  const onPressDisconnect = async () => {
    // Disconnect Gmail with VLOSA overlay.
    setError(null); // Clear.
    try {
      await runWithOverlay({ nextStatusText: "Disconnecting…" }, async () => {
        await disconnectMutation.mutateAsync();
      });
    } catch (e) {
      console.error("[Integrations] disconnect failed", e);
      setError(e?.message || "Could not disconnect Gmail");
    }
  };

  /* ============================ Derived UI ================================ */ // Section header.

  const statusTitle = connected ? "Connected" : "Not connected"; // Title text.

  const statusDetail = useMemo(() => {
    // Build a short detail line.
    // Memoized detail text. // Explain.
    if (connected && connectedEmail) {
      // If connected and we have an email...
      return connectedEmail; // Show email.
    } // End if.
    if (connected) {
      // If connected but no email...
      return "Connected account"; // Fallback.
    } // End if.
    return "Connect to start syncing inbox items"; // Not connected.
  }, [connected, connectedEmail]); // Dependencies.

  /* =============================== Render ================================= */ // Section header.

  return (
    // Begin JSX return.
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      {/* Root wrapper (so the overlay can absolutely position itself) */}

      <ScrollView
        style={{ flex: 1, backgroundColor: tokens.bg }}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* End ScrollView props. */}
        <View // Header row.
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }} // Header layout.
        >
          {/* End header style. */}
          <View>
            {/* Left header column. */}
            <Text
              style={{ fontSize: 22, fontWeight: "900", color: tokens.text }}
            >
              Integrations
            </Text>
            {/* Title. */}
            <Text style={{ marginTop: 4, fontSize: 14, color: tokens.subtext }}>
              Connect the outside world.
            </Text>
            {/* Subtitle. */}
          </View>
          {/* End left header column. */}
          <NeuButton // Back button.
            label="Back" // Button label.
            variant="secondary" // Secondary style.
            tokens={tokens} // Theme.
            onPress={() => router.back()} // Go back.
          />
          {/* End Back button. */}
        </View>
        {/* End header row. */}

        {error ? ( // If there is an error...
          <View // Error container.
            style={{
              padding: 14,
              ...neuStyle(tokens, { pressed: true, radius: 16 }),
            }} // Neumorphic pressed style.
          >
            {/* End error container. */}
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#B91C1C" }}>
              {error}
            </Text>
            {/* Error text. */}
          </View> // End error container.
        ) : null}
        {/* End error conditional. */}

        <NeuCard title="Email (Gmail)" tokens={tokens}>
          {/* Gmail card. */}
          <View // Inner box.
            style={{
              padding: 14,
              ...neuStyle(tokens, { pressed: true, radius: 16 }),
            }} // Pressed look.
          >
            {/* End inner box. */}
            <Text
              style={{ fontSize: 13, fontWeight: "900", color: tokens.text }}
            >
              {statusTitle}
            </Text>
            {/* Status. */}
            <Text style={{ marginTop: 6, fontSize: 13, color: tokens.subtext }}>
              {statusDetail}
            </Text>
            {/* Detail. */}
            <Text
              style={{ marginTop: 10, fontSize: 12, color: tokens.subtext }}
            >
              Syncing creates Inbox items. Drafts/sending stays approval-first
              by default.
            </Text>
            {/* Note. */}
          </View>
          {/* End inner box. */}

          <View style={{ marginTop: 12, gap: 10 }}>
            {/* Actions stack. */}
            {!connected ? (
              <NeuButton
                label={connectMutation.isPending ? "Opening…" : "Connect Gmail"}
                tokens={tokens}
                disabled={overlayVisible || connectMutation.isPending}
                onPress={onPressConnect}
              />
            ) : (
              <View style={{ gap: 10 }}>
                {/* Connected actions. */}
                <NeuButton
                  label={syncMutation.isPending ? "Syncing…" : "Sync now"}
                  variant="secondary"
                  tokens={tokens}
                  disabled={overlayVisible || syncMutation.isPending}
                  onPress={onPressSync}
                />
                <NeuButton
                  label={
                    disconnectMutation.isPending
                      ? "Disconnecting…"
                      : "Disconnect Gmail"
                  }
                  variant="secondary"
                  tokens={tokens}
                  disabled={overlayVisible || disconnectMutation.isPending}
                  onPress={onPressDisconnect}
                />
              </View>
            )}

            <NeuButton
              label="Go to Inbox"
              variant="secondary"
              tokens={tokens}
              disabled={overlayVisible}
              onPress={() => router.push("/inbox")}
            />
          </View>
          {/* End actions stack. */}
        </NeuCard>
        {/* End Gmail card. */}

        <NeuCard title="Safety note" tokens={tokens}>
          {/* Safety card. */}
          <View // Box.
            style={{
              padding: 14,
              ...neuStyle(tokens, { pressed: true, radius: 16 }),
            }} // Pressed.
          >
            {/* End box. */}
            <Text style={{ fontSize: 13, color: tokens.subtext }}>
              {/* Text wrapper. */}
              We keep the system approval-first by default. Even when Gmail is
              connected, the machine should draft and propose — not silently
              send. {/* Copy. */}
            </Text>
            {/* End text. */}
          </View>
          {/* End box. */}
        </NeuCard>
        {/* End safety card. */}

        <View style={{ height: 18 }} />
        {/* Spacer at bottom. */}
      </ScrollView>

      {overlay}
      {/* VLOSA overlay */}
    </View>
  ); // End return.
} // End screen.



