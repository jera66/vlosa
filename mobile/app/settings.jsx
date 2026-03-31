/* ========================================================================== */
/* VLOSA — SETTINGS SCREEN (MOBILE)                                           */
/* -------------------------------------------------------------------------- */
/* This screen controls:                                                      */
/* - Device theme (System / Light / Dark)                                      */
/* - Machine posture (Approval-first vs Auto-run) (shared via database)        */
/* - Quiet hours (shared via database)                                         */
/* ========================================================================== */

// Import router for back navigation.
import { useRouter } from "expo-router"; // Router.

// Import React hooks.
import { useMemo, useState } from "react"; // Hooks.

// Import RN primitives.
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"; // UI.

// Import React Query hooks.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"; // Server state.

// Import our theme context (device theme).
import { useTheme } from "@/utils/theme"; // Theme.

// Import neumorphic helpers.
import { NeuCard, NeuButton, neuStyle } from "@/utils/neu"; // Neumorphism.

// Import KeyboardAvoiding wrapper (best UX for TextInput).
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView"; // Keyboard handling.

// Import LOS API calls (machine settings).
import { getLosSettings, updateLosSettings } from "@/utils/losApi"; // API client.

// Add current-user hook so we only call /api when authenticated.
import useUser from "@/utils/auth/useUser"; // Current signed-in user.
import useVlosaActionOverlay from "@/utils/useVlosaActionOverlay"; // VLOSA overlay helper.

// Small option pill used for segmented controls.
function OptionPill({ label, active, onPress, tokens }) {
  // Pill.
  const style = useMemo(
    () => ({
      flex: 1,
      paddingVertical: 10,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      ...neuStyle(tokens, { pressed: active, radius: 14 }),
    }),
    [active, tokens],
  ); // Style.
  const fg = active ? tokens.text : tokens.subtext; // Text color.
  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} style={style}>
      <Text style={{ fontSize: 13, fontWeight: "800", color: fg }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Screen component.
export default function SettingsScreen() {
  // Settings screen.
  const router = useRouter(); // Router.
  const queryClient = useQueryClient(); // Query cache.
  const { preference, setPreference, tokens } = useTheme(); // Theme state.

  // Read the current user so we can avoid 401s before auth is ready.
  const { data: user, loading: userLoading } = useUser(); // User.

  // Only run server queries when we are authenticated.
  const canLoad = !!user && !userLoading; // Enable flag.

  const [saveError, setSaveError] = useState(null); // Error message.

  // NEW: Shared overlay for important "save" actions.
  const {
    overlay,
    runWithOverlay,
    visible: overlayVisible,
  } = useVlosaActionOverlay(tokens);

  const subtitle = useMemo(
    () =>
      ({
        system: "Follows your phone's theme",
        light: "Always light",
        dark: "Always dark",
      })[preference] || "",
    [preference],
  ); // Theme subtitle.

  const settingsQuery = useQuery({
    queryKey: ["los", "settings"],
    queryFn: getLosSettings,
    enabled: canLoad, // only fetch after login
  }); // Load machine settings.

  const updateSettingsMutation = useMutation({
    mutationFn: updateLosSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    },
    onError: (error) =>
      setSaveError(error.message || "Could not update settings"),
  });

  const machine = settingsQuery.data || null; // Machine settings row.
  const posture = machine ? machine.automation_posture : "approval_first"; // Posture.
  const quietStart =
    machine && machine.quiet_hours_start
      ? String(machine.quiet_hours_start).slice(0, 5)
      : "22:00"; // Start.
  const quietEnd =
    machine && machine.quiet_hours_end
      ? String(machine.quiet_hours_end).slice(0, 5)
      : "07:00"; // End.

  const runMachineUpdate = async (nextStatusText, payload) => {
    setSaveError(null);
    try {
      await runWithOverlay({ nextStatusText }, async () => {
        await updateSettingsMutation.mutateAsync(payload);
      });
    } catch (e) {
      console.error("[Settings] update failed", e);
      setSaveError(e?.message || "Could not update settings");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
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
              <Text
                style={{ fontSize: 22, fontWeight: "900", color: tokens.text }}
              >
                Settings
              </Text>
              <Text
                style={{ marginTop: 4, fontSize: 14, color: tokens.subtext }}
              >
                Control the machine.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => router.back()}
              disabled={overlayVisible}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                opacity: overlayVisible ? 0.55 : 1,
                ...neuStyle(tokens, { pressed: false, radius: 14 }),
              }}
            >
              <Text
                style={{ fontSize: 13, fontWeight: "800", color: tokens.text }}
              >
                Back
              </Text>
            </TouchableOpacity>
          </View>
          {saveError ? (
            <View
              style={{
                padding: 14,
                ...neuStyle(tokens, { pressed: true, radius: 16 }),
              }}
            >
              <Text
                style={{ fontSize: 13, color: "#B91C1C", fontWeight: "800" }}
              >
                {saveError}
              </Text>
            </View>
          ) : null}
          <NeuCard title="Theme (device)" tokens={tokens}>
            <Text style={{ fontSize: 13, color: tokens.subtext }}>
              {subtitle}
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <OptionPill
                label="System"
                active={preference === "system"}
                onPress={() => setPreference("system")}
                tokens={tokens}
              />
              <OptionPill
                label="Light"
                active={preference === "light"}
                onPress={() => setPreference("light")}
                tokens={tokens}
              />
              <OptionPill
                label="Dark"
                active={preference === "dark"}
                onPress={() => setPreference("dark")}
                tokens={tokens}
              />
            </View>
            <Text
              style={{ marginTop: 12, fontSize: 12, color: tokens.subtext }}
            >
              We keep dark mode charcoal (not pure black) so depth still reads.
            </Text>
          </NeuCard>
          <NeuCard title="Automation posture (shared)" tokens={tokens}>
            <Text style={{ fontSize: 13, color: tokens.subtext }}>
              Approval-first is safest until integrations are proven.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <OptionPill
                label="Approval"
                active={posture === "approval_first"}
                onPress={() =>
                  runMachineUpdate("Updating posture…", {
                    automation_posture: "approval_first",
                  })
                }
                tokens={tokens}
              />
              <OptionPill
                label="Auto-run"
                active={posture === "auto_run"}
                onPress={() =>
                  runMachineUpdate("Updating posture…", {
                    automation_posture: "auto_run",
                  })
                }
                tokens={tokens}
              />
            </View>
            <View style={{ marginTop: 12 }}>
              <NeuButton
                label="Refresh"
                variant="secondary"
                tokens={tokens}
                disabled={overlayVisible}
                onPress={() =>
                  runWithOverlay(
                    { nextStatusText: "Refreshing…" },
                    async () => {
                      await queryClient.invalidateQueries({
                        queryKey: ["los", "settings"],
                      });
                    },
                  )
                }
              />
            </View>
          </NeuCard>
          <NeuCard title="Quiet hours (shared)" tokens={tokens}>
            <Text style={{ fontSize: 13, color: tokens.subtext }}>
              Later we will enforce quiet hours for messaging + email sending.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: tokens.subtext,
                  }}
                >
                  Start (HH:MM)
                </Text>
                <TextInput
                  value={quietStart}
                  onChangeText={(v) =>
                    updateSettingsMutation.mutate({ quiet_hours_start: v })
                  }
                  placeholder="22:00"
                  placeholderTextColor={tokens.subtext}
                  style={{
                    marginTop: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    color: tokens.text,
                    ...neuStyle(tokens, { pressed: true, radius: 16 }),
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: tokens.subtext,
                  }}
                >
                  End (HH:MM)
                </Text>
                <TextInput
                  value={quietEnd}
                  onChangeText={(v) =>
                    updateSettingsMutation.mutate({ quiet_hours_end: v })
                  }
                  placeholder="07:00"
                  placeholderTextColor={tokens.subtext}
                  style={{
                    marginTop: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    color: tokens.text,
                    ...neuStyle(tokens, { pressed: true, radius: 16 }),
                  }}
                />
              </View>
            </View>
          </NeuCard>
          <View style={{ height: 18 }} />
        </ScrollView>
      </KeyboardAvoidingAnimatedView>

      {overlay}
    </View>
  );
}



