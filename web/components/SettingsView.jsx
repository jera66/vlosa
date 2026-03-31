import {
  NeuButton,
  NeuCard,
  SegmentedThemePicker,
  neuSurfaceStyle,
} from "@/utils/neu";

export function SettingsView({ tokens, firstName }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <NeuCard className="p-5">
        <div className="text-sm font-semibold">Settings</div>
        <div className="mt-2 text-sm" style={{ color: tokens.subtext }}>
          Theme is per device. Rules + posture are shared.
        </div>
        <div className="mt-4 grid gap-3">
          <div
            className="p-4"
            style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
          >
            <div
              className="text-xs font-semibold"
              style={{ color: tokens.subtext }}
            >
              Theme
            </div>
            <div className="mt-2">
              <SegmentedThemePicker />
            </div>
          </div>
          <div
            className="p-4"
            style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
          >
            <div
              className="text-xs font-semibold"
              style={{ color: tokens.subtext }}
            >
              Signed in as
            </div>
            <div className="mt-1 text-sm">{firstName || "(unknown)"}</div>
            <div className="mt-3">
              <a href="/account/logout" className="inline-block">
                <NeuButton variant="secondary">Sign out</NeuButton>
              </a>
            </div>
          </div>
        </div>
      </NeuCard>

      <NeuCard className="p-5">
        <div className="text-sm font-semibold">System health</div>
        <div className="mt-3 grid gap-3">
          <div
            className="p-4 text-sm"
            style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
          >
            Database: connected
          </div>
          <div
            className="p-4 text-sm"
            style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
          >
            Auth: required
          </div>
          <div
            className="p-4 text-sm"
            style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
          >
            Rules + Inbox: live + audit-logged
          </div>
        </div>
      </NeuCard>
    </div>
  );
}



