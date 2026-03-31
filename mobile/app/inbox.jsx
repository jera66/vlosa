/* ========================================================================== */ // Banner 1.
/* VLOSA — INBOX / TRIAGE (MOBILE)                                            */ // Banner 2.
/* -------------------------------------------------------------------------- */ // Banner 3.
/* This screen is DB-backed (real):                                            */ // Banner 4.
/* - Lists los_inbox_items via GET /api/los/inbox                              */ // Banner 5.
/* - Updates items via PUT /api/los/inbox/:id                                  */ // Banner 6.
/* - Deletes items via DELETE /api/los/inbox/:id                               */ // Banner 7.
/*                                                                            */ // Banner 8.
/* Gmail hookup (v1):                                                          */ // Banner 9.
/* - We can sync Gmail messages into the Inbox via POST /api/integrations/...  */ // Banner 10.
/*                                                                            */ // Banner 11.
/* Safety:                                                                     */ // Banner 12.
/* - Even with Gmail, we treat "send" as approval-first.                       */ // Banner 13.
/* ========================================================================== */ // Banner 14.

/* =============================== Imports ================================== */ // Section header.

import { useRouter } from "expo-router"; // Import router.

import { useEffect } from "react"; // Import effect.
import { useMemo } from "react"; // Import memo.
import { useState } from "react"; // Import state.

import { ScrollView } from "react-native"; // Import ScrollView.
import { Text } from "react-native"; // Import Text.
import { TextInput } from "react-native"; // Import TextInput.
import { View } from "react-native"; // Import View.

import { useMutation } from "@tanstack/react-query"; // Import mutation.
import { useQuery } from "@tanstack/react-query"; // Import query.
import { useQueryClient } from "@tanstack/react-query"; // Import cache.

import useUser from "@/utils/auth/useUser"; // Import user hook.

import { useTheme } from "@/utils/theme"; // Import theme.

import { NeuButton } from "@/utils/neu"; // Import button.
import { NeuCard } from "@/utils/neu"; // Import card.
import { neuStyle } from "@/utils/neu"; // Import style helper.

import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView"; // Import keyboard wrapper.

import { createLosInboxItem } from "@/utils/losApi"; // Import create.
import { deleteLosInboxItem } from "@/utils/losApi"; // Import delete.
import { generateInboxAiDraft } from "@/utils/losApi"; // Import AI draft generator.
import { listLosInboxItems } from "@/utils/losApi"; // Import list.
import { sendInboxReplyGmail } from "@/utils/losApi"; // Import Gmail send.
import { syncGmail } from "@/utils/losApi"; // Import gmail sync.
import { updateLosInboxItem } from "@/utils/losApi"; // Import update.

import useVlosaActionOverlay from "@/utils/useVlosaActionOverlay"; // VLOSA overlay helper.

/* ============================= Seed Data ================================== */ // Section header.

const DEMO = [
  // Demo inbox items.
  {
    // Item 1.
    subject: "Steven — Update needed", // Subject.
    from_name: "Steven", // From name.
    priority: "urgent", // Priority.
    status: "incoming", // Status.
    ai_summary: "Steven needs a concise project update today.", // Summary.
    suggested_reply:
      "Hey Steven — quick update: we’re on track, blocked by X, next step is Y.", // Reply.
  }, // End item 1.
  {
    // Item 2.
    subject: "Bank — Account alert", // Subject.
    from_name: "Bank", // From.
    priority: "important", // Priority.
    status: "incoming", // Status.
    ai_summary: "Routine alert. Review and file if expected.", // Summary.
    suggested_reply:
      "Thanks — I’ve received the alert. Please confirm if any action is required on my end.", // Reply.
  }, // End item 2.
  {
    // Item 3.
    subject: "Promo — Sale ends soon", // Subject.
    from_name: "Promo", // From.
    priority: "routine", // Priority.
    status: "incoming", // Status.
    ai_summary: "Marketing email. Likely safe to archive.", // Summary.
    suggested_reply: "No thanks — please unsubscribe me from this list.", // Reply.
  }, // End item 3.
]; // End DEMO.

/* =============================== Screen =================================== */ // Section header.

export default function InboxScreen() {
  // Define screen.
  // Screen. // Explain.

  const router = useRouter(); // Create router.
  const queryClient = useQueryClient(); // Create cache.
  const { tokens } = useTheme(); // Read theme tokens.

  const { data: user, loading: userLoading } = useUser(); // Read user.

  const canLoad = !!user && !userLoading; // Only query after login.

  const [selectedId, setSelectedId] = useState(null); // Selected item id.
  const [draftReply, setDraftReply] = useState(""); // Draft reply text.
  const [error, setError] = useState(null); // UI error.

  // NEW: VLOSA overlay for important actions (Gmail sync, AI draft, send).
  const {
    overlay,
    runWithOverlay,
    visible: overlayVisible,
  } = useVlosaActionOverlay(tokens); // Overlay controller.

  /* ============================== Queries ================================= */ // Section header.

  const inboxQuery = useQuery({
    // Load inbox list.
    queryKey: ["los", "inbox"], // Cache key.
    queryFn: listLosInboxItems, // Loader.
    enabled: canLoad, // Only when logged in.
  }); // End query.

  const items = inboxQuery.data || []; // Normalize to array.

  const selected = useMemo(() => {
    // Compute selected item.
    // Find selected item. // Explain.
    const first = items.length > 0 ? items[0] : null; // First fallback.
    if (!selectedId) {
      // If no explicit selection...
      return first; // Use first.
    } // End if.
    const found = items.find((i) => i.id === selectedId) || null; // Find by id.
    return found || first; // Fallback to first.
  }, [items, selectedId]); // Dependencies.

  useEffect(() => {
    // Keep selection in sync.
    // Auto select first item when list loads. // Explain.
    if (!selectedId && items.length > 0) {
      // If none selected...
      setSelectedId(items[0].id); // Select first.
    } // End if.
  }, [items, selectedId]); // Dependencies.

  useEffect(() => {
    // Sync draft reply when selection changes.
    // Sync draft when selection changes. // Explain.
    const next = selected?.suggested_reply
      ? String(selected.suggested_reply)
      : ""; // Next draft.
    setDraftReply(next); // Apply.
  }, [selected?.id]); // Only when selected item changes.

  /* ============================ Mutations ================================= */ // Section header.

  const seedMutation = useMutation({
    // Create items.
    mutationFn: createLosInboxItem, // POST.
    onSuccess: () => {
      // After success...
      queryClient.invalidateQueries({ queryKey: ["los", "inbox"] }); // Refresh list.
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] }); // Refresh log.
    }, // End onSuccess.
    onError: (e) => setError(e.message || "Could not create inbox item"), // Error.
  }); // End mutation.

  const updateMutation = useMutation({
    // Update item.
    mutationFn: ({ id, payload }) => updateLosInboxItem(id, payload), // PUT.
    onSuccess: () => {
      // After update...
      queryClient.invalidateQueries({ queryKey: ["los", "inbox"] }); // Refresh list.
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] }); // Refresh log.
    }, // End onSuccess.
    onError: (e) => setError(e.message || "Could not update inbox item"), // Error.
  }); // End mutation.

  const deleteMutation = useMutation({
    // Delete item.
    mutationFn: (id) => deleteLosInboxItem(id), // DELETE.
    onSuccess: () => {
      // After delete...
      queryClient.invalidateQueries({ queryKey: ["los", "inbox"] }); // Refresh list.
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] }); // Refresh log.
      setSelectedId(null); // Reset selection.
    }, // End onSuccess.
    onError: (e) => setError(e.message || "Could not delete inbox item"), // Error.
  }); // End mutation.

  const gmailSyncMutation = useMutation({
    // Gmail sync.
    mutationFn: () => syncGmail({ limit: 20 }), // Call sync.
    onSuccess: () => {
      // After sync...
      queryClient.invalidateQueries({ queryKey: ["los", "inbox"] }); // Refresh list.
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] }); // Refresh log.
    }, // End.
    onError: (e) => setError(e.message || "Could not sync Gmail"), // Error.
  }); // End gmail sync.

  const aiDraftMutation = useMutation({
    // AI draft generator.
    mutationFn: (id) => generateInboxAiDraft(id), // Call backend draft generator.
    onSuccess: (updated) => {
      // After draft...
      queryClient.invalidateQueries({ queryKey: ["los", "inbox"] }); // Refresh list.
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] }); // Refresh log.
      const nextDraft = updated?.suggested_reply
        ? String(updated.suggested_reply)
        : ""; // Pull new reply.
      setDraftReply(nextDraft); // Update editor.
    }, // End.
    onError: (e) => setError(e.message || "Could not generate AI draft"), // Error.
  }); // End AI draft.

  const sendMutation = useMutation({
    // Send the approved reply via Gmail.
    mutationFn: (id) => sendInboxReplyGmail(id), // POST /api/los/inbox/:id/send.
    onSuccess: () => {
      // After send succeeds...
      queryClient.invalidateQueries({ queryKey: ["los", "inbox"] }); // Refresh list.
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] }); // Refresh log.
    },
    onError: (e) => setError(e.message || "Could not send email"),
  });

  /* ============================ Handlers ================================= */

  const onPressGmailSync = async () => {
    // Sync Gmail and show VLOSA overlay.
    setError(null);
    try {
      await runWithOverlay({ nextStatusText: "Syncing Gmail…" }, async () => {
        await gmailSyncMutation.mutateAsync();
      });
    } catch (e) {
      console.error("[Inbox] gmail sync failed", e);
      setError(e?.message || "Could not sync Gmail");
    }
  };

  const onPressGenerateDraft = async () => {
    // Generate AI draft with VLOSA overlay.
    if (!selected?.id) {
      return;
    }
    setError(null);
    try {
      await runWithOverlay({ nextStatusText: "Drafting reply…" }, async () => {
        await aiDraftMutation.mutateAsync(selected.id);
      });
    } catch (e) {
      console.error("[Inbox] ai draft failed", e);
      setError(e?.message || "Could not generate AI draft");
    }
  };

  const onPressSend = async () => {
    // Send email with VLOSA overlay.
    if (!selected?.id) {
      return;
    }
    setError(null);
    try {
      await runWithOverlay({ nextStatusText: "Sending email…" }, async () => {
        await sendMutation.mutateAsync(selected.id);
      });
    } catch (e) {
      console.error("[Inbox] send failed", e);
      setError(e?.message || "Could not send email");
    }
  };

  /* ============================ Derived UI ================================ */ // Section header.

  const fromText = selected?.from_name
    ? String(selected.from_name)
    : "(unknown)"; // From.
  const subjectText = selected?.subject ? String(selected.subject) : ""; // Subject.
  const summaryText = selected?.ai_summary
    ? String(selected.ai_summary)
    : "(no summary yet)"; // Summary.
  const statusText = selected?.status ? String(selected.status) : "incoming"; // Status.
  const priorityText = selected?.priority
    ? String(selected.priority)
    : "routine"; // Priority.
  const sourceText = selected?.source ? String(selected.source) : "manual"; // Source.

  /* =============================== Render ================================= */ // Section header.

  return (
    // Begin return.
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      {/* Keyboard wrapper. */}
      <View style={{ flex: 1 }}>
        {/* Root wrapper (so the overlay can absolutely position itself) */}

        <ScrollView
          style={{ flex: 1, backgroundColor: tokens.bg }}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Page scroll. */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Header row. */}
            <View>
              {/* Left header column. */}
              <Text
                style={{ fontSize: 22, fontWeight: "900", color: tokens.text }}
              >
                Inbox
              </Text>
              {/* Title. */}
              <Text
                style={{ marginTop: 4, fontSize: 14, color: tokens.subtext }}
              >
                Triage and approvals.
              </Text>
              {/* Subtitle. */}
            </View>
            {/* End left header. */}
            <NeuButton
              label="Back"
              variant="secondary"
              tokens={tokens}
              onPress={() => router.back()}
            />
            {/* Back. */}
          </View>
          {/* End header. */}

          {error ? ( // If error...
            <View
              style={{
                padding: 14,
                ...neuStyle(tokens, { pressed: true, radius: 16 }),
              }}
            >
              {/* Error box. */}
              <Text
                style={{ fontSize: 13, fontWeight: "800", color: "#B91C1C" }}
              >
                {error}
              </Text>
              {/* Error text. */}
            </View> // End error box.
          ) : null}
          {/* End error conditional. */}

          <NeuCard title="Inbox items" tokens={tokens}>
            {/* List card. */}
            <Text style={{ fontSize: 13, color: tokens.subtext }}>
              {items.length} items • tap one to open.
            </Text>
            {/* Count. */}

            <View style={{ marginTop: 12, gap: 10 }}>
              {/* List container. */}
              {items.map((item) => {
                // Map items.
                const isSelected = item.id === selected?.id; // Selected?
                const who = String(item.from_name || "(unknown)"); // From.
                const subj = String(item.subject || ""); // Subject.
                const row = `${who} — ${subj}`; // Row title.
                const metaA = String(item.priority || "routine"); // Priority.
                const metaB = String(item.status || "incoming"); // Status.
                const metaC = String(item.source || "manual"); // Source.
                const meta = `${metaA} • ${metaB} • ${metaC}`; // Meta line.
                return (
                  // Return row.
                  <View
                    key={item.id}
                    style={{
                      padding: 14,
                      ...neuStyle(tokens, { pressed: isSelected, radius: 16 }),
                    }}
                  >
                    {/* Row surface. */}
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "900",
                        color: tokens.text,
                      }}
                    >
                      {row}
                    </Text>
                    {/* Row title. */}
                    <Text
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        color: tokens.subtext,
                      }}
                    >
                      {meta}
                    </Text>
                    {/* Meta. */}
                    <View style={{ marginTop: 10 }}>
                      {/* Button row. */}
                      <NeuButton
                        label="Open"
                        variant="secondary"
                        tokens={tokens}
                        onPress={() => setSelectedId(item.id)}
                      />
                      {/* Open. */}
                    </View>
                    {/* End button row. */}
                  </View> // End row.
                ); // End return.
              })}
              {/* End map. */}

              {items.length === 0 ? ( // If empty...
                <View
                  style={{
                    padding: 14,
                    ...neuStyle(tokens, { pressed: true, radius: 16 }),
                  }}
                >
                  {/* Empty state box. */}
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: tokens.text,
                    }}
                  >
                    No inbox items yet.
                  </Text>
                  {/* Title. */}
                  <Text
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      color: tokens.subtext,
                    }}
                  >
                    Use “Seed demo” or “Sync Gmail”.
                  </Text>
                  {/* Hint. */}
                </View> // End empty.
              ) : null}
              {/* End empty conditional. */}

              <NeuButton // Gmail sync button.
                label={
                  gmailSyncMutation.isPending
                    ? "Syncing Gmail…"
                    : "Sync Gmail (last 20)"
                } // Label.
                variant="secondary" // Secondary.
                tokens={tokens} // Theme.
                disabled={overlayVisible || gmailSyncMutation.isPending}
                onPress={onPressGmailSync}
              />
              {/* End Gmail sync button. */}

              <NeuButton // Seed demo button.
                label={seedMutation.isPending ? "Seeding…" : "Seed demo"} // Label.
                tokens={tokens} // Theme.
                onPress={() => {
                  setError(null);
                  DEMO.forEach((p) => seedMutation.mutate(p));
                }} // Create.
              />
              {/* End Seed demo. */}
            </View>
            {/* End list container. */}
          </NeuCard>
          {/* End list card. */}

          <NeuCard title="Selected" tokens={tokens}>
            {/* Selected card. */}
            <View
              style={{
                padding: 14,
                ...neuStyle(tokens, { pressed: true, radius: 16 }),
              }}
            >
              {/* Selected inner. */}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "800",
                  color: tokens.subtext,
                }}
              >
                From
              </Text>
              {/* Label. */}
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  fontWeight: "900",
                  color: tokens.text,
                }}
              >
                {fromText}
              </Text>
              {/* Value. */}

              <Text
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  fontWeight: "800",
                  color: tokens.subtext,
                }}
              >
                Subject
              </Text>
              {/* Label. */}
              <Text style={{ marginTop: 4, fontSize: 13, color: tokens.text }}>
                {subjectText}
              </Text>
              {/* Value. */}

              <Text
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  fontWeight: "800",
                  color: tokens.subtext,
                }}
              >
                Status / Priority / Source
              </Text>
              {/* Label. */}
              <Text style={{ marginTop: 4, fontSize: 13, color: tokens.text }}>
                {statusText} • {priorityText} • {sourceText}
              </Text>
              {/* Value. */}

              <Text
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  fontWeight: "800",
                  color: tokens.subtext,
                }}
              >
                AI summary
              </Text>
              {/* Label. */}
              <Text style={{ marginTop: 4, fontSize: 13, color: tokens.text }}>
                {summaryText}
              </Text>
              {/* Value. */}

              <Text
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  fontWeight: "800",
                  color: tokens.subtext,
                }}
              >
                Suggested reply
              </Text>
              {/* Label. */}
              <TextInput // Reply editor.
                value={draftReply} // Current.
                onChangeText={setDraftReply} // Update.
                placeholder="(no suggested reply yet)" // Placeholder.
                placeholderTextColor={tokens.subtext} // Placeholder color.
                multiline={true} // Multi-line.
                style={{
                  marginTop: 8,
                  minHeight: 110,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  color: tokens.text,
                  ...neuStyle(tokens, { pressed: true, radius: 16 }),
                }} // Neumorphic input.
              />
              {/* End TextInput. */}

              <View
                style={{
                  marginTop: 12,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                {/* Action grid. */}
                <View style={{ flexBasis: "48%" }}>
                  {/* Col. */}
                  <NeuButton
                    label="Approve"
                    tokens={tokens}
                    onPress={() => {
                      if (!selected?.id) {
                        return;
                      }
                      setError(null);
                      updateMutation.mutate({
                        id: selected.id,
                        payload: {
                          suggested_reply: draftReply,
                          status: "approved",
                        },
                      });
                    }}
                  />
                  {/* Approve. */}
                </View>
                {/* End col. */}
                <View style={{ flexBasis: "48%" }}>
                  {/* Col. */}
                  <NeuButton
                    label="Save edits"
                    variant="secondary"
                    tokens={tokens}
                    onPress={() => {
                      if (!selected?.id) {
                        return;
                      }
                      setError(null);
                      updateMutation.mutate({
                        id: selected.id,
                        payload: { suggested_reply: draftReply },
                      });
                    }}
                  />
                  {/* Save. */}
                </View>
                {/* End col. */}
                <View style={{ flexBasis: "48%" }}>
                  {/* Col. */}
                  <NeuButton
                    label="Archive"
                    variant="secondary"
                    tokens={tokens}
                    onPress={() => {
                      if (!selected?.id) {
                        return;
                      }
                      setError(null);
                      updateMutation.mutate({
                        id: selected.id,
                        payload: { status: "archived" },
                      });
                    }}
                  />
                  {/* Archive. */}
                </View>
                {/* End col. */}
                <View style={{ flexBasis: "48%" }}>
                  {/* Col. */}
                  <NeuButton
                    label="Later"
                    variant="secondary"
                    tokens={tokens}
                    onPress={() => {
                      if (!selected?.id) {
                        return;
                      }
                      setError(null);
                      updateMutation.mutate({
                        id: selected.id,
                        payload: { status: "later" },
                      });
                    }}
                  />
                  {/* Later. */}
                </View>
                {/* End col. */}
                <View style={{ flexBasis: "100%" }}>
                  {/* Full row. */}
                  <NeuButton
                    label="Generate AI draft"
                    variant="secondary"
                    tokens={tokens}
                    disabled={overlayVisible || aiDraftMutation.isPending}
                    onPress={onPressGenerateDraft}
                  />
                  {/* Generate. */}
                </View>
                {/* End row. */}
                <View style={{ flexBasis: "100%" }}>
                  {/* Full row. */}
                  <NeuButton
                    label={
                      sendMutation.isPending
                        ? "Sending…"
                        : "Send via Gmail (requires approval)"
                    }
                    variant="secondary"
                    tokens={tokens}
                    disabled={overlayVisible || sendMutation.isPending}
                    onPress={onPressSend}
                  />
                  {/* Send. */}
                </View>
                {/* End row. */}
                <View style={{ flexBasis: "100%" }}>
                  {/* Full row. */}
                  <NeuButton
                    label="Delete"
                    variant="secondary"
                    tokens={tokens}
                    onPress={() => {
                      if (!selected?.id) {
                        return;
                      }
                      setError(null);
                      deleteMutation.mutate(selected.id);
                    }}
                  />
                  {/* Delete. */}
                </View>
                {/* End row. */}
              </View>
              {/* End action grid. */}
            </View>
            {/* End selected inner. */}
          </NeuCard>
          {/* End selected card. */}

          <View style={{ height: 18 }} />
          {/* Bottom spacer. */}
        </ScrollView>
        {/* End scroll. */}

        {overlay}
        {/* VLOSA overlay */}
      </View>
      {/* End root wrapper. */}
    </KeyboardAvoidingAnimatedView> // End keyboard wrapper.
  ); // End return.
} // End screen.



