import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createLosInboxItem,
  createLosMemory,
  createLosTask,
  deleteLosInboxItem,
  deleteLosMemory,
  deleteLosTask,
  updateLosInboxItem,
  updateLosMemory,
  updateLosPersona,
  updateLosSettings,
  updateLosTask,
} from "@/utils/losApi";

export function useHomePageMutations(setSaveError) {
  const queryClient = useQueryClient();

  const updateSettingsMutation = useMutation({
    mutationFn: updateLosSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    },
    onError: (error) =>
      setSaveError(error.message || "Could not update settings"),
  });

  const updatePersonaMutation = useMutation({
    mutationFn: updateLosPersona,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "persona"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    },
    onError: (error) =>
      setSaveError(error.message || "Could not update persona"),
  });

  const createTaskMutation = useMutation({
    mutationFn: createLosTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    },
    onError: (error) => setSaveError(error.message || "Could not create task"),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, payload }) => updateLosTask(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    },
    onError: (error) => setSaveError(error.message || "Could not update task"),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => deleteLosTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    },
    onError: (error) => setSaveError(error.message || "Could not delete task"),
  });

  const createMemoryMutation = useMutation({
    mutationFn: createLosMemory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "memory"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    },
    onError: (error) =>
      setSaveError(error.message || "Could not create memory"),
  });

  const updateMemoryMutation = useMutation({
    mutationFn: ({ id, payload }) => updateLosMemory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "memory"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    },
    onError: (error) =>
      setSaveError(error.message || "Could not update memory"),
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: (id) => deleteLosMemory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "memory"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    },
    onError: (error) =>
      setSaveError(error.message || "Could not delete memory"),
  });

  const createInboxMutation = useMutation({
    mutationFn: createLosInboxItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "inbox"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    },
    onError: (error) =>
      setSaveError(error.message || "Could not create inbox item"),
  });

  const updateInboxMutation = useMutation({
    mutationFn: ({ id, payload }) => updateLosInboxItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "inbox"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    },
    onError: (error) =>
      setSaveError(error.message || "Could not update inbox item"),
  });

  const deleteInboxMutation = useMutation({
    mutationFn: (id) => deleteLosInboxItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["los", "inbox"] });
      queryClient.invalidateQueries({ queryKey: ["los", "activity"] });
    },
    onError: (error) =>
      setSaveError(error.message || "Could not delete inbox item"),
  });

  return {
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
  };
}



