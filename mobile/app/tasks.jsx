/* ========================================================================== */
/* VLOSA — TASKS SCREEN (MOBILE)                                              */
/* -------------------------------------------------------------------------- */
/* This screen is backed by Postgres via:                                     */
/* - GET  /api/los/tasks                                                      */
/* - POST /api/los/tasks                                                      */
/* - PUT  /api/los/tasks/:id                                                  */
/* - DELETE /api/los/tasks/:id                                                */
/* ========================================================================== */

// Import router for navigation.
import { useRouter } from "expo-router"; // Router.

// Import React hooks.
import { useMemo, useState } from "react"; // Hooks.

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
  createLosTask,
  deleteLosTask,
  listLosTasks,
  updateLosTask,
} from "@/utils/losApi"; // API.

// Add current-user hook so we only call /api when authenticated.
import useUser from "@/utils/auth/useUser"; // Current signed-in user.

// Import VLOSA action overlay helper.
import useVlosaActionOverlay from "@/utils/useVlosaActionOverlay"; // VLOSA overlay helper.

// Screen component.
export default function TasksScreen() {
  // Tasks.
  const router = useRouter(); // Router.
  const queryClient = useQueryClient(); // Cache.
  const { tokens } = useTheme(); // Tokens.

  // Read the current user so we can avoid 401s before auth is ready.
  const { data: user, loading: userLoading } = useUser(); // User.

  // Only run server queries when we are authenticated.
  const canLoad = !!user && !userLoading; // Enable flag.

  const [title, setTitle] = useState(""); // New task title.
  const [priority, setPriority] = useState("routine"); // New task priority.
  const [error, setError] = useState(null); // Error message.

  // NEW: Shared full-screen overlay for important actions.
  const {
    overlay,
    runWithOverlay,
    visible: overlayVisible,
  } = useVlosaActionOverlay(tokens);

  const tasksQuery = useQuery({
    queryKey: ["los", "tasks"],
    queryFn: listLosTasks,
    enabled: canLoad, // only fetch after login
  }); // Load tasks.

  const createMutation = useMutation({
    // Create task.
    mutationFn: createLosTask, // POST.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
      setTitle("");
    }, // Refresh.
    onError: (e) => setError(e.message || "Could not create task"), // Error.
  }); // End.

  const updateMutation = useMutation({
    // Update task.
    mutationFn: ({ id, payload }) => updateLosTask(id, payload), // PUT.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    }, // Refresh.
    onError: (e) => setError(e.message || "Could not update task"), // Error.
  }); // End.

  const deleteMutation = useMutation({
    // Delete task.
    mutationFn: deleteLosTask, // DELETE.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    }, // Refresh.
    onError: (e) => setError(e.message || "Could not delete task"), // Error.
  }); // End.

  const tasks = tasksQuery.data || []; // Tasks list.

  const incoming = useMemo(
    () => tasks.filter((t) => t.status === "incoming"),
    [tasks],
  ); // Incoming.
  const active = useMemo(
    () => tasks.filter((t) => t.status === "active"),
    [tasks],
  ); // Active.
  const completed = useMemo(
    () => tasks.filter((t) => t.status === "completed"),
    [tasks],
  ); // Completed.

  const onCreate = async () => {
    // Create task with a full-screen overlay.
    setError(null);
    try {
      await runWithOverlay({ nextStatusText: "Creating task…" }, async () => {
        await createMutation.mutateAsync({
          title,
          priority,
          status: "incoming",
        });
      });
    } catch (e) {
      console.error("[Tasks] create failed", e);
      setError(e?.message || "Could not create task");
    }
  };

  const onUpdateStatus = async (id, nextStatus) => {
    // Update task with an overlay.
    setError(null);
    const statusTextMap = {
      active: "Approving task…",
      completed: "Completing task…",
    };
    const nextStatusText = statusTextMap[nextStatus] || "Updating task…";

    try {
      await runWithOverlay({ nextStatusText }, async () => {
        await updateMutation.mutateAsync({
          id,
          payload: { status: nextStatus },
        });
      });
    } catch (e) {
      console.error("[Tasks] update failed", e);
      setError(e?.message || "Could not update task");
    }
  };

  const onDelete = async (id) => {
    // Delete task with an overlay.
    setError(null);
    try {
      await runWithOverlay({ nextStatusText: "Deleting task…" }, async () => {
        await deleteMutation.mutateAsync(id);
      });
    } catch (e) {
      console.error("[Tasks] delete failed", e);
      setError(e?.message || "Could not delete task");
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
          {/* Page. */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {" "}
            {/* Header row. */}
            <View>
              {" "}
              {/* Title. */}
              <Text
                style={{ fontSize: 22, fontWeight: "900", color: tokens.text }}
              >
                Tasks
              </Text>{" "}
              {/* Title text. */}
              <Text
                style={{ marginTop: 4, fontSize: 14, color: tokens.subtext }}
              >
                Approval-first pipeline.
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
          <NeuCard title="Create task" tokens={tokens}>
            {" "}
            {/* Create card. */}
            <Text
              style={{ fontSize: 12, fontWeight: "800", color: tokens.subtext }}
            >
              Title
            </Text>{" "}
            {/* Label. */}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Reply to Steven"
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
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              {" "}
              {/* Priority options. */}
              <NeuButton
                label="Urgent"
                variant="secondary"
                tokens={tokens}
                onPress={() => setPriority("urgent")}
              />{" "}
              {/* Urgent. */}
              <NeuButton
                label="Important"
                variant="secondary"
                tokens={tokens}
                onPress={() => setPriority("important")}
              />{" "}
              {/* Important. */}
              <NeuButton
                label="Routine"
                variant="secondary"
                tokens={tokens}
                onPress={() => setPriority("routine")}
              />{" "}
              {/* Routine. */}
            </View>{" "}
            {/* End options. */}
            <View style={{ marginTop: 12 }}>
              {" "}
              {/* Create button. */}
              <NeuButton
                label={
                  createMutation.isPending
                    ? "Creating…"
                    : `Create (${priority})`
                }
                tokens={tokens}
                disabled={!title || createMutation.isPending || overlayVisible}
                onPress={onCreate}
              />{" "}
              {/* Create. */}
            </View>{" "}
            {/* End create. */}
          </NeuCard>{" "}
          {/* End create card. */}
          <NeuCard title="Incoming" tokens={tokens}>
            {" "}
            {/* Incoming card. */}
            <View style={{ gap: 10 }}>
              {" "}
              {/* List. */}
              {incoming.map((t) => (
                <View
                  key={t.id}
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
                    {t.title}
                  </Text>{" "}
                  {/* Title. */}
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: tokens.subtext,
                    }}
                  >
                    Priority: {t.priority}
                  </Text>{" "}
                  {/* Meta. */}
                  <View
                    style={{ flexDirection: "row", gap: 10, marginTop: 12 }}
                  >
                    {" "}
                    {/* Buttons. */}
                    <NeuButton
                      label="Approve"
                      tokens={tokens}
                      disabled={overlayVisible}
                      onPress={() => onUpdateStatus(t.id, "active")}
                    />{" "}
                    {/* Approve. */}
                    <NeuButton
                      label="Reject"
                      variant="secondary"
                      tokens={tokens}
                      disabled={overlayVisible}
                      onPress={() => onDelete(t.id)}
                    />{" "}
                    {/* Reject. */}
                  </View>{" "}
                  {/* End buttons. */}
                </View> // End row.
              ))}{" "}
              {/* End map. */}
              {incoming.length === 0 ? (
                <View
                  style={{
                    padding: 14,
                    ...neuStyle(tokens, { pressed: true, radius: 16 }),
                  }}
                >
                  <Text style={{ fontSize: 13, color: tokens.subtext }}>
                    No incoming tasks.
                  </Text>
                </View>
              ) : null}{" "}
              {/* Empty. */}
            </View>{" "}
            {/* End list. */}
          </NeuCard>{" "}
          {/* End incoming. */}
          <NeuCard title="Active" tokens={tokens}>
            {" "}
            {/* Active card. */}
            <View style={{ gap: 10 }}>
              {" "}
              {/* List. */}
              {active.map((t) => (
                <View
                  key={t.id}
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
                    {t.title}
                  </Text>{" "}
                  {/* Title. */}
                  <View
                    style={{ flexDirection: "row", gap: 10, marginTop: 12 }}
                  >
                    {" "}
                    {/* Buttons. */}
                    <NeuButton
                      label="Complete"
                      tokens={tokens}
                      disabled={overlayVisible}
                      onPress={() => onUpdateStatus(t.id, "completed")}
                    />{" "}
                    {/* Complete. */}
                    <NeuButton
                      label="Delete"
                      variant="secondary"
                      tokens={tokens}
                      disabled={overlayVisible}
                      onPress={() => onDelete(t.id)}
                    />{" "}
                    {/* Delete. */}
                  </View>{" "}
                  {/* End buttons. */}
                </View> // End row.
              ))}{" "}
              {/* End map. */}
              {active.length === 0 ? (
                <View
                  style={{
                    padding: 14,
                    ...neuStyle(tokens, { pressed: true, radius: 16 }),
                  }}
                >
                  <Text style={{ fontSize: 13, color: tokens.subtext }}>
                    No active tasks.
                  </Text>
                </View>
              ) : null}{" "}
              {/* Empty. */}
            </View>{" "}
            {/* End list. */}
          </NeuCard>{" "}
          {/* End active. */}
          <NeuCard title="Completed" tokens={tokens}>
            {" "}
            {/* Completed card. */}
            <View style={{ gap: 10 }}>
              {" "}
              {/* List. */}
              {completed.map((t) => (
                <View
                  key={t.id}
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
                      color: tokens.subtext,
                    }}
                  >
                    {t.title}
                  </Text>{" "}
                  {/* Title. */}
                  <View style={{ marginTop: 12 }}>
                    <NeuButton
                      label="Delete"
                      variant="secondary"
                      tokens={tokens}
                      disabled={overlayVisible}
                      onPress={() => onDelete(t.id)}
                    />
                  </View>{" "}
                  {/* Delete. */}
                </View> // End row.
              ))}{" "}
              {/* End map. */}
              {completed.length === 0 ? (
                <View
                  style={{
                    padding: 14,
                    ...neuStyle(tokens, { pressed: true, radius: 16 }),
                  }}
                >
                  <Text style={{ fontSize: 13, color: tokens.subtext }}>
                    No completed tasks.
                  </Text>
                </View>
              ) : null}{" "}
              {/* Empty. */}
            </View>{" "}
            {/* End list. */}
          </NeuCard>{" "}
          {/* End completed. */}
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



