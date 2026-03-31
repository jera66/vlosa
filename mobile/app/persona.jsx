/* ========================================================================== */
/* VLOSA — PERSONA SCREEN (MOBILE)                                            */
/* -------------------------------------------------------------------------- */
/* Backed by Postgres via:                                                    */
/* - GET /api/los/persona                                                     */
/* - PUT /api/los/persona                                                     */
/* ========================================================================== */

// Import router for navigation.
import { useRouter } from "expo-router"; // Router.

// Import React hooks.
import { useEffect, useState } from "react"; // Hooks.

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
import { getLosPersona, updateLosPersona } from "@/utils/losApi"; // API.

// Add current-user hook so we only call /api when authenticated.
import useUser from "@/utils/auth/useUser"; // Current signed-in user.

import useVlosaActionOverlay from "@/utils/useVlosaActionOverlay"; // VLOSA overlay helper.

// Screen component.
export default function PersonaScreen() {
  // Persona.
  const router = useRouter(); // Router.
  const queryClient = useQueryClient(); // Cache.
  const { tokens } = useTheme(); // Tokens.

  // Read the current user so we can avoid 401s before auth is ready.
  const { data: user, loading: userLoading } = useUser(); // User.

  // Only run server queries when we are authenticated.
  const canLoad = !!user && !userLoading; // Enable flag.

  const [tone, setTone] = useState(""); // Tone.
  const [structure, setStructure] = useState(""); // Structure.
  const [values, setValues] = useState(""); // Values.
  const [error, setError] = useState(null); // Error.

  const personaQuery = useQuery({
    queryKey: ["los", "persona"],
    queryFn: getLosPersona,
    enabled: canLoad, // only fetch after login
  }); // Load persona.

  useEffect(() => {
    // When persona loads, copy into local state.
    const p = personaQuery.data; // Data.
    if (!p) {
      return;
    } // Guard.
    setTone(p.tone || ""); // Set.
    setStructure(p.structure || ""); // Set.
    setValues(p.values_and_beliefs || ""); // Set.
  }, [personaQuery.data]); // Re-run when data changes.

  const saveMutation = useMutation({
    // Save persona.
    mutationFn: updateLosPersona, // PUT.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "persona"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    }, // Refresh.
    onError: (e) => setError(e.message || "Could not save persona"), // Error.
  }); // End.

  // NEW: Shared overlay for saving persona.
  const {
    overlay,
    runWithOverlay,
    visible: overlayVisible,
  } = useVlosaActionOverlay(tokens);

  const onSave = async () => {
    // Save persona with overlay.
    setError(null);
    try {
      await runWithOverlay({ nextStatusText: "Saving persona…" }, async () => {
        await saveMutation.mutateAsync({
          tone,
          structure,
          values_and_beliefs: values,
        });
      });
    } catch (e) {
      console.error("[Persona] save failed", e);
      setError(e?.message || "Could not save persona");
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
                Persona
              </Text>{" "}
              {/* Title. */}
              <Text
                style={{ marginTop: 4, fontSize: 14, color: tokens.subtext }}
              >
                Your voice, rules, and tone.
              </Text>{" "}
              {/* Subtitle. */}
            </View>{" "}
            {/* End. */}
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
          <NeuCard title="Edit persona" tokens={tokens}>
            {" "}
            {/* Card. */}
            <Text
              style={{ fontSize: 12, fontWeight: "800", color: tokens.subtext }}
            >
              Tone
            </Text>{" "}
            {/* Label. */}
            <TextInput
              value={tone}
              onChangeText={setTone}
              placeholder="Direct, assertive…"
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
            <Text
              style={{
                marginTop: 12,
                fontSize: 12,
                fontWeight: "800",
                color: tokens.subtext,
              }}
            >
              Structure
            </Text>{" "}
            {/* Label. */}
            <TextInput
              value={structure}
              onChangeText={setStructure}
              placeholder="Bullet points…"
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
            <Text
              style={{
                marginTop: 12,
                fontSize: 12,
                fontWeight: "800",
                color: tokens.subtext,
              }}
            >
              Values & beliefs
            </Text>{" "}
            {/* Label. */}
            <TextInput
              value={values}
              onChangeText={setValues}
              placeholder="Prefers clarity…"
              placeholderTextColor={tokens.subtext}
              multiline
              style={{
                marginTop: 8,
                paddingVertical: 12,
                paddingHorizontal: 14,
                minHeight: 90,
                color: tokens.text,
                ...neuStyle(tokens, { pressed: true, radius: 16 }),
              }}
            />{" "}
            {/* Input. */}
            <View style={{ marginTop: 12 }}>
              {" "}
              {/* Button. */}
              <NeuButton
                label={saveMutation.isPending ? "Saving…" : "Save"}
                tokens={tokens}
                disabled={saveMutation.isPending || overlayVisible}
                onPress={onSave}
              />{" "}
              {/* Save. */}
            </View>{" "}
            {/* End. */}
          </NeuCard>{" "}
          {/* End card. */}
          <NeuCard title="Preview" tokens={tokens}>
            {" "}
            {/* Preview. */}
            <View
              style={{
                padding: 14,
                ...neuStyle(tokens, { pressed: true, radius: 16 }),
              }}
            >
              {" "}
              {/* Box. */}
              <Text
                style={{ fontSize: 13, fontWeight: "800", color: tokens.text }}
              >
                Example reply
              </Text>{" "}
              {/* Title. */}
              <Text
                style={{ marginTop: 8, fontSize: 13, color: tokens.subtext }}
              >
                Thanks for the message. Here’s the quick update, what’s blocked,
                and what I need next.
              </Text>{" "}
              {/* Example. */}
            </View>{" "}
            {/* End box. */}
          </NeuCard>{" "}
          {/* End preview. */}
          <View style={{ height: 18 }} /> {/* Spacer. */}
        </ScrollView>
      </KeyboardAvoidingAnimatedView>

      {overlay}
      {/* VLOSA overlay */}
    </View>
  ); // End return.
}



