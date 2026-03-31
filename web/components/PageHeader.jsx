import { NeuButton } from "@/utils/neu";

export function PageHeader({
  headerTitle,
  firstName,
  tokens,
  onRefresh,
  onSettings,
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-lg font-extrabold">{headerTitle}</div>
        <div className="mt-1 text-sm" style={{ color: tokens.subtext }}>
          Signed in as: {firstName || "(loading…)"}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <NeuButton variant="secondary" onClick={onRefresh}>
          Refresh all
        </NeuButton>
        <NeuButton variant="secondary" onClick={onSettings}>
          Settings
        </NeuButton>
      </div>
    </div>
  );
}



