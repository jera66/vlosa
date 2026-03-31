/* ========================================================================== */
/* VLOSA — ACTIVITY LOG SCREEN (MOBILE)                                       */
/* -------------------------------------------------------------------------- */
/* Backed by Postgres via:                                                    */
/* - GET /api/los/activity                                                    */
/* ========================================================================== */

// Import router for navigation.
import { useRouter } from "expo-router"; // Router.

// Import React.
import { useState } from "react"; // Hooks.

// Import RN UI primitives.
import { ScrollView, Text, View } from "react-native"; // UI.

// Import React Query hook.
import { useQuery } from "@tanstack/react-query"; // Server state.

// Import theme tokens.
import { useTheme } from "@/utils/theme"; // Theme.

// Import neumorphic helpers.
import { NeuButton, NeuCard, neuStyle } from "@/utils/neu"; // Neumorphism.

// Import LOS API call.
import { listLosActivity } from "@/utils/losApi"; // API.

// Add current-user hook so we only call /api when authenticated.
import useUser from "@/utils/auth/useUser"; // Current signed-in user.

// Screen component.
export default function ActivityScreen() {
  // Activity.
  const router = useRouter(); // Router.
  const { tokens } = useTheme(); // Tokens.
  const [error, setError] = useState(null); // Error.

  // Read the current user so we can avoid 401s before auth is ready.
  const { data: user, loading: userLoading } = useUser(); // User.

  // Only run server queries when we are authenticated.
  const canLoad = !!user && !userLoading; // Enable flag.

  const activityQuery = useQuery({
    queryKey: ["los", "activity"],
    queryFn: listLosActivity,
    enabled: canLoad, // only fetch after login
    onError: (e) => setError(e.message || "Could not load activity"),
  }); // Load.

  const rows = activityQuery.data || []; // List.

  return (
    // Render.
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.bg }}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      {" "}
      {/* Page. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {" "}
        {/* Header. */}
        <View>
          {" "}
          {/* Title. */}
          <Text style={{ fontSize: 22, fontWeight: "900", color: tokens.text }}>
            Activity
          </Text>{" "}
          {/* Title. */}
          <Text style={{ marginTop: 4, fontSize: 14, color: tokens.subtext }}>
            Audit trail.
          </Text>{" "}
          {/* Subtitle. */}
        </View>{" "}
        {/* End title. */}
        <NeuButton
          label="Back"
          variant="secondary"
          tokens={tokens}
          onPress={() => router.back()}
        />{" "}
        {/* Back. */}
      </View>{" "}
      {/* End header. */}
      {error ? (
        <View
          style={{
            padding: 14,
            ...neuStyle(tokens, { pressed: true, radius: 16 }),
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#B91C1C" }}>
            {error}
          </Text>
        </View>
      ) : null}{" "}
      {/* Error. */}
      <NeuCard title="Recent" tokens={tokens}>
        {" "}
        {/* Card. */}
        <View style={{ gap: 10 }}>
          {" "}
          {/* List. */}
          {rows.map((r) => (
            <View
              key={String(r.id)}
              style={{
                padding: 14,
                ...neuStyle(tokens, { pressed: true, radius: 16 }),
              }}
            >
              {" "}
              {/* Row. */}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "800",
                  color: tokens.subtext,
                }}
              >
                {new Date(r.created_at).toLocaleString()}
              </Text>{" "}
              {/* Timestamp. */}
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 14,
                  fontWeight: "800",
                  color: tokens.text,
                }}
              >
                {r.message}
              </Text>{" "}
              {/* Message. */}
              <Text
                style={{ marginTop: 4, fontSize: 12, color: tokens.subtext }}
              >
                {r.action_type}
              </Text>{" "}
              {/* Type. */}
            </View> // End row.
          ))}{" "}
          {/* End map. */}
          {rows.length === 0 ? (
            <View
              style={{
                padding: 14,
                ...neuStyle(tokens, { pressed: true, radius: 16 }),
              }}
            >
              <Text style={{ fontSize: 13, color: tokens.subtext }}>
                No activity yet.
              </Text>
            </View>
          ) : null}{" "}
          {/* Empty. */}
        </View>{" "}
        {/* End list. */}
      </NeuCard>{" "}
      {/* End card. */}
      <View style={{ height: 18 }} /> {/* Spacer. */}
    </ScrollView> // End scroll.
  ); // End return.
}



