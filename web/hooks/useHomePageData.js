import { useQuery } from "@tanstack/react-query";
import {
  getLosPersona,
  getLosSettings,
  listLosActivity,
  listLosInboxItems,
  listLosMemory,
  listLosTasks,
} from "@/utils/losApi";

export function useHomePageData(isAuthed) {
  const settingsQuery = useQuery({
    queryKey: ["los", "settings"],
    queryFn: getLosSettings,
    enabled: isAuthed,
  });

  const personaQuery = useQuery({
    queryKey: ["los", "persona"],
    queryFn: getLosPersona,
    enabled: isAuthed,
  });

  const tasksQuery = useQuery({
    queryKey: ["los", "tasks"],
    queryFn: () => listLosTasks(),
    enabled: isAuthed,
  });

  const memoryQuery = useQuery({
    queryKey: ["los", "memory"],
    queryFn: listLosMemory,
    enabled: isAuthed,
  });

  const inboxQuery = useQuery({
    queryKey: ["los", "inbox"],
    queryFn: () => listLosInboxItems(),
    enabled: isAuthed,
  });

  const activityQuery = useQuery({
    queryKey: ["los", "activity"],
    queryFn: () => listLosActivity({ limit: 50 }),
    enabled: isAuthed,
  });

  return {
    settingsQuery,
    personaQuery,
    tasksQuery,
    memoryQuery,
    inboxQuery,
    activityQuery,
  };
}



