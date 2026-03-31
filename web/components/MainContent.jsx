import { useMemo } from "react";
import { NeuCard, neuSurfaceStyle } from "@/utils/neu";
import { AuthGate } from "./AuthGate";
import { DashboardView } from "./DashboardView";
import { RulesView } from "./RulesView";
import { InboxView } from "./InboxView";
import { TasksView } from "./TasksView";
import { PersonaView } from "./PersonaView";
import { MemoryView } from "./MemoryView";
import { ActivityView } from "./ActivityView";
import { IntegrationsView } from "./IntegrationsView";
import { SettingsView } from "./SettingsView";
import { DEMO_INBOX_ITEMS } from "@/constants/seedData";

export function MainContent({
  active,
  showAuthGate,
  tokens,
  displayName,
  firstName,
  avatarText,
  inboxItems,
  incomingTasks,
  activeTasks,
  completedTasks,
  automationPosture,
  quietStart,
  quietEnd,
  ruleNeverUnknown,
  ruleAllowedStart,
  ruleAllowedEnd,
  ruleNoSaturday,
  ruleDraftEmails,
  ruleSendWithoutApproval,
  selectedInboxItem,
  selectedInboxId,
  draftSuggestedReply,
  setSelectedInboxId,
  setDraftSuggestedReply,
  setSaveError,
  newTaskTitle,
  setNewTaskTitle,
  newTaskPriority,
  setNewTaskPriority,
  newMemoryText,
  setNewMemoryText,
  persona,
  memories,
  activity,
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
  onNav,
  headerTitle,
}) {
  const main = useMemo(() => {
    if (showAuthGate) {
      return <AuthGate tokens={tokens} />;
    }

    if (active === "dashboard") {
      const openTaskCount = incomingTasks.length + activeTasks.length;
      const inboxCount = inboxItems.length;
      return (
        <DashboardView
          tokens={tokens}
          firstName={firstName}
          avatarText={avatarText}
          inboxCount={inboxCount}
          openTaskCount={openTaskCount}
          automationPosture={automationPosture}
          quietStart={quietStart}
          quietEnd={quietEnd}
          onNav={onNav}
        />
      );
    }

    if (active === "rules") {
      return (
        <RulesView
          tokens={tokens}
          automationPosture={automationPosture}
          quietStart={quietStart}
          quietEnd={quietEnd}
          ruleNeverUnknown={ruleNeverUnknown}
          ruleAllowedStart={ruleAllowedStart}
          ruleAllowedEnd={ruleAllowedEnd}
          ruleNoSaturday={ruleNoSaturday}
          ruleDraftEmails={ruleDraftEmails}
          ruleSendWithoutApproval={ruleSendWithoutApproval}
          updateSettingsMutation={updateSettingsMutation}
        />
      );
    }

    if (active === "inbox") {
      return (
        <InboxView
          tokens={tokens}
          inboxItems={inboxItems}
          selectedInboxItem={selectedInboxItem}
          selectedInboxId={selectedInboxId}
          draftSuggestedReply={draftSuggestedReply}
          setSelectedInboxId={setSelectedInboxId}
          setDraftSuggestedReply={setDraftSuggestedReply}
          setSaveError={setSaveError}
          createInboxMutation={createInboxMutation}
          updateInboxMutation={updateInboxMutation}
          deleteInboxMutation={deleteInboxMutation}
          DEMO_INBOX_ITEMS={DEMO_INBOX_ITEMS}
        />
      );
    }

    if (active === "tasks") {
      return (
        <TasksView
          tokens={tokens}
          newTaskTitle={newTaskTitle}
          setNewTaskTitle={setNewTaskTitle}
          newTaskPriority={newTaskPriority}
          setNewTaskPriority={setNewTaskPriority}
          setSaveError={setSaveError}
          createTaskMutation={createTaskMutation}
          updateTaskMutation={updateTaskMutation}
          deleteTaskMutation={deleteTaskMutation}
          incomingTasks={incomingTasks}
          activeTasks={activeTasks}
          completedTasks={completedTasks}
        />
      );
    }

    if (active === "persona") {
      return (
        <PersonaView
          tokens={tokens}
          persona={persona}
          updatePersonaMutation={updatePersonaMutation}
        />
      );
    }

    if (active === "memory") {
      return (
        <MemoryView
          tokens={tokens}
          newMemoryText={newMemoryText}
          setNewMemoryText={setNewMemoryText}
          setSaveError={setSaveError}
          createMemoryMutation={createMemoryMutation}
          updateMemoryMutation={updateMemoryMutation}
          deleteMemoryMutation={deleteMemoryMutation}
          memories={memories}
        />
      );
    }

    if (active === "activity") {
      return <ActivityView tokens={tokens} activity={activity} />;
    }

    if (active === "integrations") {
      return <IntegrationsView tokens={tokens} />;
    }

    if (active === "settings") {
      return <SettingsView tokens={tokens} firstName={firstName} />;
    }

    return (
      <NeuCard className="p-5">
        <div className="text-sm font-semibold">{headerTitle}</div>
        <div className="mt-2 text-sm" style={{ color: tokens.subtext }}>
          This section is a placeholder.
        </div>
      </NeuCard>
    );
  }, [
    active,
    activeTasks,
    activity,
    automationPosture,
    avatarText,
    completedTasks,
    createInboxMutation,
    createMemoryMutation,
    createTaskMutation,
    deleteInboxMutation,
    deleteMemoryMutation,
    deleteTaskMutation,
    displayName,
    draftSuggestedReply,
    headerTitle,
    inboxItems,
    incomingTasks,
    memories,
    newMemoryText,
    newTaskPriority,
    newTaskTitle,
    onNav,
    persona,
    quietEnd,
    quietStart,
    ruleAllowedEnd,
    ruleAllowedStart,
    ruleDraftEmails,
    ruleNeverUnknown,
    ruleNoSaturday,
    ruleSendWithoutApproval,
    selectedInboxId,
    selectedInboxItem,
    setDraftSuggestedReply,
    setNewMemoryText,
    setNewTaskPriority,
    setNewTaskTitle,
    setSaveError,
    setSelectedInboxId,
    showAuthGate,
    tokens,
    updateInboxMutation,
    updateMemoryMutation,
    updatePersonaMutation,
    updateSettingsMutation,
    updateTaskMutation,
    firstName,
  ]);

  return main;
}



