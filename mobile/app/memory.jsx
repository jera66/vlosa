/* ========================================================================== */
/* VLOSA — MEMORY SCREEN (MOBILE)                                             */
/* -------------------------------------------------------------------------- */
/* Backed by Postgres via:                                                    */
/* - GET  /api/los/memory                                                     */
/* - POST /api/los/memory                                                     */
/* - PUT  /api/los/memory/:id (pinned)                                        */
/* - DELETE /api/los/memory/:id                                               */
/* ========================================================================== */

// Import router for navigation.
import { useRouter } from "expo-router"; // Router.

// Import React hooks.
import { useState } from "react"; // Hooks.

// Import RN UI primitives.
import { ScrollView, Text, TextInput, View } from "react-native"; // UI.

// Import React Query hooks.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"; // Server state.

// Import theme tokens.
import { useTheme } from "@/utils/theme"; // Theme.

// Import neumorphic helpers.
import { NeuButton, NeuCard, neuStyle } from "@/utils/neu"; // Neumorphism.

// Import keyboard avoiding wrapper.
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView"; // Keyboard handling.

// Import LOS API calls.
import {
  createLosMemory,
  deleteLosMemory,
  listLosMemory,
  updateLosMemory,
} from "@/utils/losApi"; // API.

// Add current-user hook so we only call /api when authenticated.
import useUser from "@/utils/auth/useUser"; // Current signed-in user.

import useVlosaActionOverlay from "@/utils/useVlosaActionOverlay"; // VLOSA overlay helper.

// Screen component.
export default function MemoryScreen() {
  // Memory.
  const router = useRouter(); // Router.
  const queryClient = useQueryClient(); // Cache.
  const { tokens } = useTheme(); // Tokens.

  // Read the current user so we can avoid 401s before auth is ready.
  const { data: user, loading: userLoading } = useUser(); // User.

  // Only run server queries when we are authenticated.
  const canLoad = !!user && !userLoading; // Enable flag.

  const [text, setText] = useState(""); // New memory text.
  const [error, setError] = useState(null); // Error.

  // NEW: Shared overlay for important actions (save/pin/forget).
  const {
    overlay,
    runWithOverlay,
    visible: overlayVisible,
  } = useVlosaActionOverlay(tokens);

  const memoryQuery = useQuery({
    queryKey: ["los", "memory"],
    queryFn: listLosMemory,
    enabled: canLoad, // only fetch after login
  }); // Load.

  const createMutation = useMutation({
    // Create.
    mutationFn: createLosMemory, // POST.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "memory"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
      setText("");
    }, // Refresh.
    onError: (e) => setError(e.message || "Could not save memory"), // Error.
  }); // End.

  const updateMutation = useMutation({
    // Update pinned.
    mutationFn: ({ id, payload }) => updateLosMemory(id, payload), // PUT.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "memory"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    }, // Refresh.
    onError: (e) => setError(e.message || "Could not update memory"), // Error.
  }); // End.

  const deleteMutation = useMutation({
    // Delete.
    mutationFn: deleteLosMemory, // DELETE.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "memory"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    }, // Refresh.
    onError: (e) => setError(e.message || "Could not delete memory"), // Error.
  }); // End.

  const memories = memoryQuery.data || []; // List.

  const onSave = async () => {
    // Save memory with overlay.
    setError(null);
    try {
      await runWithOverlay({ nextStatusText: "Saving memory…" }, async () => {
        await createMutation.mutateAsync({ content: text, source: "manual" });
      });
    } catch (e) {
      console.error("[Memory] save failed", e);
      setError(e?.message || "Could not save memory");
    }
  };

  const onTogglePin = async (m) => {
    // Toggle pin with overlay.
    setError(null);
    const nextPinned = !m.pinned;
    try {
      await runWithOverlay(
        { nextStatusText: nextPinned ? "Pinning…" : "Unpinning…" },
        async () => {
          await updateMutation.mutateAsync({
            id: m.id,
            payload: { pinned: nextPinned },
          });
        },
      );
    } catch (e) {
      console.error("[Memory] pin toggle failed", e);
      setError(e?.message || "Could not update memory");
    }
  };

  const onForget = async (m) => {
    // Forget memory with overlay.
    setError(null);
    try {
      await runWithOverlay({ nextStatusText: "Forgetting…" }, async () => {
        await deleteMutation.mutateAsync(m.id);
      });
    } catch (e) {
      console.error("[Memory] forget failed", e);
      setError(e?.message || "Could not delete memory");
    }
  };

  return (
    // Render.
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      {/* Root wrapper so overlay can cover everything */}

      <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
        {/* Keyboard safe. */}
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
              <Text
                style={{ fontSize: 22, fontWeight: "900", color: tokens.text }}
              >
                Memory
              </Text>{" "}
              {/* Title. */}
              <Text
                style={{ marginTop: 4, fontSize: 14, color: tokens.subtext }}
              >
                What VLOSA remembers.
              </Text>{" "}
              {/* Subtitle. */}
            </View>{" "}
            {/* End title. */}
            <NeuButton
              label="Back"
              variant="secondary"
              tokens={tokens}
              disabled={overlayVisible}
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
              <Text
                style={{ fontSize: 13, fontWeight: "800", color: "#B91C1C" }}
              >
                {error}
              </Text>
            </View>
          ) : null}{" "}
          {/* Error. */}
          <NeuCard title="Capture memory" tokens={tokens}>
            {" "}
            {/* Capture card. */}
            <Text
              style={{ fontSize: 12, fontWeight: "800", color: tokens.subtext }}
            >
              Memory
            </Text>{" "}
            {/* Label. */}
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="e.g. Prefers concise messages"
              placeholderTextColor={tokens.subtext}
              style={{
                marginTop: 8,
                paddingVertical: 12,
                paddingHorizontal: 14,
                color: tokens.text,
                ...neuStyle(tokens, { pressed: true, radius: 16 }),
              }}
            />{" "}
            {/* Input. */}
            <View style={{ marginTop: 12 }}>
              {" "}
              {/* Button. */}
              <NeuButton
                label={createMutation.isPending ? "Saving…" : "Save"}
                tokens={tokens}
                disabled={!text || createMutation.isPending || overlayVisible}
                onPress={onSave}
              />{" "}
              {/* Save. */}
            </View>{" "}
            {/* End button. */}
          </NeuCard>{" "}
          {/* End capture. */}
          <NeuCard title="Stored memories" tokens={tokens}>
            {" "}
            {/* List card. */}
            <View style={{ gap: 10 }}>
              {" "}
              {/* List. */}
              {memories.map((m) => (
                <View
                  key={m.id}
                  style={{
                    padding: 14,
                    ...neuStyle(tokens, { pressed: true, radius: 16 }),
                  }}
                >
                  {" "}
                  {/* Row. */}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "800",
                      color: tokens.text,
                    }}
                  >
                    {m.content}
                  </Text>{" "}
                  {/* Text. */}
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: tokens.subtext,
                    }}
                  >
                    {m.pinned ? "Pinned" : "Unpinned"}
                    {m.source ? ` • ${m.source}` : ""}
                  </Text>{" "}
                  {/* Meta. */}
                  <View
                    style={{ flexDirection: "row", gap: 10, marginTop: 12 }}
                  >
                    {" "}
                    {/* Buttons. */}
                    <NeuButton
                      label={m.pinned ? "Unpin" : "Pin"}
                      variant="secondary"
                      tokens={tokens}
                      disabled={overlayVisible}
                      onPress={() => onTogglePin(m)}
                    />{" "}
                    {/* Toggle. */}
                    <NeuButton
                      label="Forget"
                      variant="secondary"
                      tokens={tokens}
                      disabled={overlayVisible}
                      onPress={() => onForget(m)}
                    />{" "}
                    {/* Delete. */}
                  </View>{" "}
                  {/* End buttons. */}
                </View> // End row.
              ))}{" "}
              {/* End map. */}
              {memories.length === 0 ? (
                <View
                  style={{
                    padding: 14,
                    ...neuStyle(tokens, { pressed: true, radius: 16 }),
                  }}
                >
                  <Text style={{ fontSize: 13, color: tokens.subtext }}>
                    No memories yet.
                  </Text>
                </View>
              ) : null}{" "}
              {/* Empty. */}
            </View>{" "}
            {/* End list. */}
          </NeuCard>{" "}
          {/* End list card. */}
          <View style={{ height: 18 }} /> {/* Spacer. */}
        </ScrollView>{" "}
        {/* End scroll. */}
      </KeyboardAvoidingAnimatedView>
      {/* End wrapper. */}

      {overlay}
      {/* VLOSA overlay */}
    </View>
  ); // End return.
}



