/* ========================================================================== */
/* VLOSA — RULES SCREEN (MOBILE)                                              */
/* -------------------------------------------------------------------------- */
/* This screen edits “Rules Engine v1” which is stored in los_settings.rules.  */
/*                                                                            */
/* Backed by Postgres via:                                                     */
/* - GET /api/los/settings                                                     */
/* - PUT /api/los/settings                                                     */
/*                                                                            */
/* Rules implemented here (same as web):                                       */
/* - Never respond to unknown numbers                                          */
/* - Allowed communication window (start/end)                                  */
/* - Never schedule on Saturdays                                               */
/* - Draft emails automatically                                                */
/* - Send emails without approval                                              */
/*                                                                            */
/* Also includes global posture + quiet hours.                                 */
/* ========================================================================== */

/* =============================== Imports ================================== */

import { useRouter } from "expo-router"; // Navigation.

import { useMemo } from "react"; // Memo.
import { useState } from "react"; // State.

import { ScrollView } from "react-native"; // Scroll.
import { Text } from "react-native"; // Text.
import { TextInput } from "react-native"; // Input.
import { TouchableOpacity } from "react-native"; // Pressable.
import { View } from "react-native"; // Layout.

import { useMutation } from "@tanstack/react-query"; // Mutations.
import { useQuery } from "@tanstack/react-query"; // Queries.
import { useQueryClient } from "@tanstack/react-query"; // Cache.

import useUser from "@/utils/auth/useUser"; // User.

import { useTheme } from "@/utils/theme"; // Theme.

import { NeuButton } from "@/utils/neu"; // Button.
import { NeuCard } from "@/utils/neu"; // Card.
import { neuStyle } from "@/utils/neu"; // Style.

import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView"; // Keyboard.

import { getLosSettings } from "@/utils/losApi"; // GET settings.
import { updateLosSettings } from "@/utils/losApi"; // PUT settings.

import useVlosaActionOverlay from "@/utils/useVlosaActionOverlay"; // VLOSA overlay helper.

/* ============================ UI Helpers ================================== */

function OptionPill(props) {
  // Segmented control pill.
  const label = props.label; // Label.
  const active = props.active; // Active.
  const onPress = props.onPress; // Handler.
  const tokens = props.tokens; // Theme.

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
  );

  const fg = active ? tokens.text : tokens.subtext; // Text color.

  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} style={style}>
      <Text style={{ fontSize: 13, fontWeight: "800", color: fg }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function RuleToggleRow(props) {
  // Toggle row.
  const label = props.label; // Label.
  const value = props.value; // Boolean.
  const onToggle = props.onToggle; // Handler.
  const tokens = props.tokens; // Theme.

  const boxText = value ? "✓" : ""; // Checkmark.
  const boxStyle = useMemo(
    () => ({
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      ...neuStyle(tokens, { pressed: value, radius: 8 }),
    }),
    [tokens, value],
  );

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onToggle}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 6,
      }}
    >
      <View style={boxStyle}>
        <Text style={{ fontSize: 14, fontWeight: "900", color: tokens.text }}>
          {boxText}
        </Text>
      </View>
      <Text style={{ fontSize: 13, color: tokens.text, fontWeight: "800" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function safeTime(value, fallback) {
  // Normalize to HH:MM.
  const text = value === null || value === undefined ? "" : String(value);
  const trimmed = text.trim();
  const base = trimmed.length >= 5 ? trimmed.slice(0, 5) : trimmed;
  return base || fallback;
}

/* =============================== Screen =================================== */

export default function RulesScreen() {
  // Screen.

  const router = useRouter(); // Router.
  const queryClient = useQueryClient(); // Cache.
  const { tokens } = useTheme(); // Theme.

  const { data: user, loading: userLoading } = useUser(); // User.
  const canLoad = !!user && !userLoading; // Enable flag.

  const [error, setError] = useState(null); // Error.

  // NEW: Shared overlay for important rule updates.
  const {
    overlay,
    runWithOverlay,
    visible: overlayVisible,
  } = useVlosaActionOverlay(tokens);

  const settingsQuery = useQuery({
    queryKey: ["los", "settings"],
    queryFn: getLosSettings,
    enabled: canLoad,
  });

  const updateMutation = useMutation({
    mutationFn: updateLosSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    },
    onError: (e) => setError(e.message || "Could not update rules"),
  });

  const machine = settingsQuery.data || null; // Settings.
  const posture = machine?.automation_posture || "approval_first"; // Posture.

  const quietStart = safeTime(machine?.quiet_hours_start, "22:00"); // Quiet start.
  const quietEnd = safeTime(machine?.quiet_hours_end, "07:00"); // Quiet end.

  const rules = machine?.rules || {}; // Rules.

  const neverUnknown = !!rules?.communications?.neverRespondToUnknownNumbers; // Rule.
  const allowedStart = safeTime(
    rules?.communications?.allowedWindowStart,
    "08:00",
  ); // Rule.
  const allowedEnd = safeTime(rules?.communications?.allowedWindowEnd, "21:00"); // Rule.
  const noSaturday = !!rules?.scheduling?.neverScheduleOnSaturdays; // Rule.
  const draftEmails = rules?.email?.draftEmailsAutomatically !== false; // Rule.
  const sendWithoutApproval = !!rules?.email?.sendEmailsWithoutApproval; // Rule.

  const runRulesUpdate = async (nextStatusText, payload) => {
    // Apply a rules/settings update with the VLOSA overlay.
    setError(null);
    try {
      await runWithOverlay({ nextStatusText }, async () => {
        await updateMutation.mutateAsync(payload);
      });
    } catch (e) {
      console.error("[Rules] update failed", e);
      setError(e?.message || "Could not update rules");
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
                Rules
              </Text>
              <Text
                style={{ marginTop: 4, fontSize: 14, color: tokens.subtext }}
              >
                Boundaries and safety posture.
              </Text>
            </View>
            <NeuButton
              label="Back"
              variant="secondary"
              tokens={tokens}
              disabled={overlayVisible}
              onPress={() => router.back()}
            />
          </View>

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
          ) : null}

          <NeuCard title="Automation posture" tokens={tokens}>
            <Text style={{ fontSize: 13, color: tokens.subtext }}>
              Approval-first blocks high-impact actions until you allow
              auto-run.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <OptionPill
                label="Approval"
                active={posture === "approval_first"}
                onPress={() =>
                  runRulesUpdate("Updating posture…", {
                    automation_posture: "approval_first",
                  })
                }
                tokens={tokens}
              />
              <OptionPill
                label="Auto-run"
                active={posture === "auto_run"}
                onPress={() =>
                  runRulesUpdate("Updating posture…", {
                    automation_posture: "auto_run",
                  })
                }
                tokens={tokens}
              />
            </View>
          </NeuCard>

          <NeuCard title="Quiet hours" tokens={tokens}>
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
                    updateMutation.mutate({ quiet_hours_start: v })
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
                    updateMutation.mutate({ quiet_hours_end: v })
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

          <NeuCard title="Communication" tokens={tokens}>
            <Text style={{ fontSize: 13, color: tokens.subtext }}>
              These rules will be enforced once integrations are connected.
            </Text>
            <View style={{ marginTop: 10 }}>
              <RuleToggleRow
                label="Never respond to unknown numbers"
                value={neverUnknown}
                onToggle={() =>
                  runRulesUpdate("Updating rule…", {
                    rules: {
                      communications: {
                        neverRespondToUnknownNumbers: !neverUnknown,
                      },
                    },
                  })
                }
                tokens={tokens}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: tokens.subtext,
                  }}
                >
                  Allowed start (HH:MM)
                </Text>
                <TextInput
                  value={allowedStart}
                  onChangeText={(v) =>
                    updateMutation.mutate({
                      rules: { communications: { allowedWindowStart: v } },
                    })
                  }
                  placeholder="08:00"
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
                  Allowed end (HH:MM)
                </Text>
                <TextInput
                  value={allowedEnd}
                  onChangeText={(v) =>
                    updateMutation.mutate({
                      rules: { communications: { allowedWindowEnd: v } },
                    })
                  }
                  placeholder="21:00"
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

          <NeuCard title="Scheduling" tokens={tokens}>
            <Text style={{ fontSize: 13, color: tokens.subtext }}>
              Scheduling rules apply to calendar actions.
            </Text>
            <View style={{ marginTop: 10 }}>
              <RuleToggleRow
                label="Never schedule on Saturdays"
                value={noSaturday}
                onToggle={() =>
                  runRulesUpdate("Updating rule…", {
                    rules: {
                      scheduling: { neverScheduleOnSaturdays: !noSaturday },
                    },
                  })
                }
                tokens={tokens}
              />
            </View>
          </NeuCard>

          <NeuCard title="Email automation" tokens={tokens}>
            <Text style={{ fontSize: 13, color: tokens.subtext }}>
              Drafting is low-risk; sending can be high-impact.
            </Text>
            <View style={{ marginTop: 10, gap: 6 }}>
              <RuleToggleRow
                label="Draft emails automatically"
                value={draftEmails}
                onToggle={() =>
                  runRulesUpdate("Updating rule…", {
                    rules: {
                      email: { draftEmailsAutomatically: !draftEmails },
                    },
                  })
                }
                tokens={tokens}
              />
              <RuleToggleRow
                label="Send emails without approval"
                value={sendWithoutApproval}
                onToggle={() =>
                  runRulesUpdate("Updating rule…", {
                    rules: {
                      email: {
                        sendEmailsWithoutApproval: !sendWithoutApproval,
                      },
                    },
                  })
                }
                tokens={tokens}
              />
            </View>
          </NeuCard>

          <View style={{ height: 18 }} />
        </ScrollView>
      </KeyboardAvoidingAnimatedView>

      {overlay}
      {/* VLOSA overlay */}
    </View>
  );
}



