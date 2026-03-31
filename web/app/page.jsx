import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useUser from "@/utils/useUser";
import { useTheme } from "@/utils/theme";
import { useHomePageData } from "@/hooks/useHomePageData";
import { useHomePageMutations } from "@/hooks/useHomePageMutations";
import { useNavigation } from "@/hooks/useNavigation";
import {
  safeTimeString,
  computeFirstName,
  computeDisplayName,
  computeAvatarText,
} from "@/utils/homePageHelpers";
import { NAV } from "@/constants/navigation";
import { Sidebar } from "@/components/HomePage/Sidebar";
import { PageHeader } from "@/components/HomePage/PageHeader";
import { ErrorDisplay } from "@/components/HomePage/ErrorDisplay";
import { LoadingDisplay } from "@/components/HomePage/LoadingDisplay";
import { MainContent } from "@/components/HomePage/MainContent";

export default function HomePage() {
  const queryClient = useQueryClient();
  const { tokens } = useTheme();
  const { data: user, loading: userLoading } = useUser();
  const isAuthed = !!user;

  const firstName = useMemo(
    () => computeFirstName(user),
    [user?.email, user?.name],
  );
  const displayName = useMemo(
    () => computeDisplayName(user),
    [user?.email, user?.name],
  );
  const avatarText = useMemo(
    () => computeAvatarText(firstName || displayName),
    [displayName, firstName],
  );

  const { active, onNav } = useNavigation(NAV);

  const [saveError, setSaveError] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("routine");
  const [newMemoryText, setNewMemoryText] = useState("");
  const [selectedInboxId, setSelectedInboxId] = useState(null);
  const [draftSuggestedReply, setDraftSuggestedReply] = useState("");

  const {
    settingsQuery,
    personaQuery,
    tasksQuery,
    memoryQuery,
    inboxQuery,
    activityQuery,
  } = useHomePageData(isAuthed);

  const settings = settingsQuery.data || null;
  const persona = personaQuery.data || null;
  const tasks = tasksQuery.data || [];
  const memories = memoryQuery.data || [];
  const inboxItems = inboxQuery.data || [];
  const activity = activityQuery.data || [];

  const headerTitle = useMemo(() => {
    const match = NAV.find((n) => n.key === active);
    return match ? match.label : "";
  }, [active]);

  const incomingTasks = useMemo(
    () => tasks.filter((t) => t.status === "incoming"),
    [tasks],
  );
  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status === "active"),
    [tasks],
  );
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === "completed"),
    [tasks],
  );

  const automationPosture = settings?.automation_posture || "approval_first";
  const quietStart = safeTimeString(settings?.quiet_hours_start, "22:00");
  const quietEnd = safeTimeString(settings?.quiet_hours_end, "07:00");

  const rules = settings?.rules || {};
  const ruleNeverUnknown =
    !!rules?.communications?.neverRespondToUnknownNumbers;
  const ruleAllowedStart = safeTimeString(
    rules?.communications?.allowedWindowStart,
    "08:00",
  );
  const ruleAllowedEnd = safeTimeString(
    rules?.communications?.allowedWindowEnd,
    "21:00",
  );
  const ruleNoSaturday = !!rules?.scheduling?.neverScheduleOnSaturdays;
  const ruleDraftEmails = rules?.email?.draftEmailsAutomatically !== false;
  const ruleSendWithoutApproval = !!rules?.email?.sendEmailsWithoutApproval;

  const selectedInboxItem = useMemo(() => {
    const first = inboxItems.length > 0 ? inboxItems[0] : null;
    if (!selectedInboxId) {
      return first;
    }
    const found = inboxItems.find((i) => i.id === selectedInboxId) || null;
    return found || first;
  }, [inboxItems, selectedInboxId]);

  useEffect(() => {
    if (!selectedInboxId && inboxItems.length > 0) {
      setSelectedInboxId(inboxItems[0].id);
    }
  }, [inboxItems, selectedInboxId]);

  useEffect(() => {
    const nextText = selectedInboxItem?.suggested_reply
      ? String(selectedInboxItem.suggested_reply)
      : "";
    setDraftSuggestedReply(nextText);
  }, [selectedInboxItem?.id]);

  const showAuthGate = !userLoading && !isAuthed;

  useEffect(() => {
    // Requirement: the first screen must be login.
    if (showAuthGate && typeof window !== "undefined") {
      const next = `/account/signin?callbackUrl=${encodeURIComponent("/")}`;
      window.location.href = next;
    }
  }, [showAuthGate]);

  const isLoadingAny =
    userLoading ||
    (isAuthed &&
      (settingsQuery.isLoading ||
        personaQuery.isLoading ||
        tasksQuery.isLoading ||
        memoryQuery.isLoading ||
        inboxQuery.isLoading ||
        activityQuery.isLoading));

  const anyError =
    settingsQuery.error ||
    personaQuery.error ||
    tasksQuery.error ||
    memoryQuery.error ||
    inboxQuery.error ||
    activityQuery.error;

  const mutations = useHomePageMutations(setSaveError);

  const {
    updateSettingsMutation,
    updatePersonaMutation,
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    createMemoryMutation,
    updateMemoryMutation,
    deleteMemoryMutation,
    createInboxMutation,
    updateInboxMutation,
    deleteInboxMutation,
  } = mutations;

  useEffect(() => {
    if (createTaskMutation.isSuccess) {
      setNewTaskTitle("");
    }
  }, [createTaskMutation.isSuccess]);

  useEffect(() => {
    if (createMemoryMutation.isSuccess) {
      setNewMemoryText("");
    }
  }, [createMemoryMutation.isSuccess]);

  useEffect(() => {
    if (deleteInboxMutation.isSuccess) {
      setSelectedInboxId(null);
    }
  }, [deleteInboxMutation.isSuccess]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
      <Sidebar
        tokens={tokens}
        active={active}
        onNav={onNav}
        automationPosture={automationPosture}
        NAV={NAV}
        isAuthed={isAuthed}
        firstName={firstName}
      />

      <main className="flex-1">
        <PageHeader
          headerTitle={headerTitle}
          firstName={firstName}
          tokens={tokens}
          onRefresh={() => {
            setSaveError(null);
            queryClient.invalidateQueries();
          }}
          onSettings={() => onNav("settings")}
        />

        <ErrorDisplay error={saveError} tokens={tokens} />

        {anyError ? (
          <ErrorDisplay
            error="A data request failed. If you're signed in, check the browser console."
            tokens={tokens}
          />
        ) : null}

        <LoadingDisplay isLoading={isLoadingAny} tokens={tokens} />

        <MainContent
          active={active}
          showAuthGate={showAuthGate}
          tokens={tokens}
          displayName={displayName}
          firstName={firstName}
          avatarText={avatarText}
          inboxItems={inboxItems}
          incomingTasks={incomingTasks}
          activeTasks={activeTasks}
          completedTasks={completedTasks}
          automationPosture={automationPosture}
          quietStart={quietStart}
          quietEnd={quietEnd}
          ruleNeverUnknown={ruleNeverUnknown}
          ruleAllowedStart={ruleAllowedStart}
          ruleAllowedEnd={ruleAllowedEnd}
          ruleNoSaturday={ruleNoSaturday}
          ruleDraftEmails={ruleDraftEmails}
          ruleSendWithoutApproval={ruleSendWithoutApproval}
          selectedInboxItem={selectedInboxItem}
          selectedInboxId={selectedInboxId}
          draftSuggestedReply={draftSuggestedReply}
          setSelectedInboxId={setSelectedInboxId}
          setDraftSuggestedReply={setDraftSuggestedReply}
          setSaveError={setSaveError}
          newTaskTitle={newTaskTitle}
          setNewTaskTitle={setNewTaskTitle}
          newTaskPriority={newTaskPriority}
          setNewTaskPriority={setNewTaskPriority}
          newMemoryText={newMemoryText}
          setNewMemoryText={setNewMemoryText}
          persona={persona}
          memories={memories}
          activity={activity}
          updateSettingsMutation={updateSettingsMutation}
          updatePersonaMutation={updatePersonaMutation}
          createTaskMutation={createTaskMutation}
          updateTaskMutation={updateTaskMutation}
          deleteTaskMutation={deleteTaskMutation}
          createMemoryMutation={createMemoryMutation}
          updateMemoryMutation={updateMemoryMutation}
          deleteMemoryMutation={deleteMemoryMutation}
          createInboxMutation={createInboxMutation}
          updateInboxMutation={updateInboxMutation}
          deleteInboxMutation={deleteInboxMutation}
          onNav={onNav}
          headerTitle={headerTitle}
        />
      </main>
    </div>
  );
}



