import {
  Activity,
  Brain,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Puzzle,
  Settings,
  Shield,
  User,
} from "lucide-react";

export const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "inbox", label: "Inbox / Triage", icon: Inbox },
  { key: "tasks", label: "Tasks", icon: ListTodo },
  { key: "persona", label: "Persona", icon: User },
  { key: "rules", label: "Rules", icon: Shield },
  { key: "memory", label: "Memory", icon: Brain },
  { key: "activity", label: "Activity Log", icon: Activity },
  { key: "integrations", label: "Integrations", icon: Puzzle },
  { key: "settings", label: "Settings", icon: Settings },
];



