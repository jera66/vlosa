import { NeuCard, neuSurfaceStyle } from "@/utils/neu";

export function IntegrationsView({ tokens }) {
  return (
    <NeuCard className="p-5">
      <div className="text-sm font-semibold">Integrations</div>
      <div className="mt-2 text-sm" style={{ color: tokens.subtext }}>
        Next we can wire Gmail/Outlook + Calendar.
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {[
          "Email (Gmail/Outlook)",
          "Calendar",
          "Contacts",
          "Phone / Voicemail",
          "Payments",
          "Files",
        ].map((name) => (
          <div
            key={name}
            className="p-4 text-sm"
            style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
          >
            {name}
            <div className="mt-1 text-xs" style={{ color: tokens.subtext }}>
              Coming soon
            </div>
          </div>
        ))}
      </div>
    </NeuCard>
  );
}



