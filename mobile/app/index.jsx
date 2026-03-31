/* ========================================================================== */
/* VLOSA — MOBILE CONTROL ROOM (HOME)                                         */
/* -------------------------------------------------------------------------- */
/* This is the mobile “front door” into the Life Operations System.            */
/*                                                                            */
/* Key requirement:                                                            */
/* - After login, show the CURRENT USER (not “Jerathel”)                        */
/*                                                                            */
/* Navigation:                                                                  */
/* - Inbox, Tasks, Persona, Rules, Memory, Activity, Settings                  */
/* ========================================================================== */

/* =============================== Imports ================================== */

import { useRouter } from "expo-router"; // Navigation.

import { useMemo } from "react"; // Memo.
import { useState } from "react"; // State.
import { useEffect } from "react"; // Effect.

import { ScrollView } from "react-native"; // Scroll.
import { Text } from "react-native"; // Text.
import { TouchableOpacity } from "react-native"; // Pressable.
import { View } from "react-native"; // Layout.

import useUser from "@/utils/auth/useUser"; // Current user.

import { useAuth } from "@/utils/auth/useAuth"; // Auth state.

import { useTheme } from "@/utils/theme"; // Theme tokens.

import { NeuButton } from "@/utils/neu"; // Button.
import { NeuCard } from "@/utils/neu"; // Card.
import { neuStyle } from "@/utils/neu"; // Style.

/* =============================== Screen =================================== */

export default function Index() {
  // Home screen.

  const router = useRouter(); // Router.
  const { tokens } = useTheme(); // Theme.

  const { data: user, loading } = useUser(); // User.

  const { isReady, isAuthenticated } = useAuth(); // Auth readiness.

  useEffect(() => {
    // If we're ready and not signed in, go to Login (first screen).
    if (!isReady) {
      return;
    }
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated, router]);

  const firstName = useMemo(() => {
    // Extract first name (preferred) or derive from email.
    const rawName = user?.name ? String(user.name).trim() : ""; // Name.
    const rawEmail = user?.email ? String(user.email).trim() : ""; // Email.

    if (rawName) {
      // If name exists...
      const parts = rawName.split(/\s+/).filter(Boolean); // Split.
      return parts.length > 0 ? parts[0] : ""; // First chunk.
    }

    if (rawEmail) {
      // If only email exists...
      const local = rawEmail.split("@")[0] || ""; // Local part.
      const token = local.split(/[._-]+/).filter(Boolean)[0] || ""; // First token.
      const pretty = token ? token[0].toUpperCase() + token.slice(1) : ""; // Capitalize.
      return pretty; // Return.
    }

    return ""; // Fallback.
  }, [user?.email, user?.name]); // Dependencies.

  const greeting = firstName ? `Hello, ${firstName}` : "Hello"; // Greeting.

  const [down, setDown] = useState(false); // Press state.

  const settingsPillStyle = useMemo(
    () => ({ padding: 12, ...neuStyle(tokens, { pressed: down, radius: 16 }) }),
    [down, tokens],
  ); // Style.

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.bg }}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ fontSize: 22, fontWeight: "900", color: tokens.text }}>
            {firstName ? `Virtual ${firstName}` : "VLOSA"}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 14, color: tokens.subtext }}>
            VLOSA — Virtual Life Operating System Agent
          </Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: tokens.text }}>
            {loading ? "Loading user…" : greeting}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => setDown(true)}
          onPressOut={() => setDown(false)}
          onPress={() => router.push("/settings")}
          style={settingsPillStyle}
        >
          <Text style={{ fontSize: 13, fontWeight: "800", color: tokens.text }}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      <NeuCard title="Today" tokens={tokens}>
        <View style={{ gap: 10 }}>
          {[
            "Approve AI drafts",
            "Pay upcoming bill",
            "Send weekly summary",
          ].map((t) => (
            <View
              key={t}
              style={{
                padding: 14,
                ...neuStyle(tokens, { pressed: true, radius: 16 }),
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "800", color: tokens.text }}
              >
                {t}
              </Text>
              <Text
                style={{ marginTop: 4, fontSize: 13, color: tokens.subtext }}
              >
                Approval-first by default.
              </Text>
            </View>
          ))}
        </View>
      </NeuCard>

      <NeuCard title="Quick actions" tokens={tokens}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <View style={{ flexBasis: "48%" }}>
            <NeuButton
              label="Inbox"
              variant="secondary"
              tokens={tokens}
              onPress={() => router.push("/inbox")}
            />
          </View>
          <View style={{ flexBasis: "48%" }}>
            <NeuButton
              label="Tasks"
              variant="secondary"
              tokens={tokens}
              onPress={() => router.push("/tasks")}
            />
          </View>
          <View style={{ flexBasis: "48%" }}>
            <NeuButton
              label="Persona"
              variant="secondary"
              tokens={tokens}
              onPress={() => router.push("/persona")}
            />
          </View>
          <View style={{ flexBasis: "48%" }}>
            <NeuButton
              label="Rules"
              variant="secondary"
              tokens={tokens}
              onPress={() => router.push("/rules")}
            />
          </View>
          <View style={{ flexBasis: "48%" }}>
            <NeuButton
              label="Memory"
              variant="secondary"
              tokens={tokens}
              onPress={() => router.push("/memory")}
            />
          </View>
          <View style={{ flexBasis: "48%" }}>
            <NeuButton
              label="Activity"
              variant="secondary"
              tokens={tokens}
              onPress={() => router.push("/activity")}
            />
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          <NeuButton
            label="Integrations"
            tokens={tokens}
            onPress={() => router.push("/integrations")}
          />
        </View>
      </NeuCard>

      <NeuCard title="System posture" tokens={tokens}>
        <View style={{ gap: 10 }}>
          <View
            style={{
              padding: 14,
              ...neuStyle(tokens, { pressed: true, radius: 16 }),
            }}
          >
            <Text
              style={{ fontSize: 13, fontWeight: "800", color: tokens.text }}
            >
              High-impact actions
            </Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: tokens.subtext }}>
              Locked behind approval until you explicitly open permissions.
            </Text>
          </View>
        </View>
      </NeuCard>

      <View style={{ height: 18 }} />
    </ScrollView>
  );
}



