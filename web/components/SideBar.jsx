import { neuSurfaceStyle } from "@/utils/neu";

export function Sidebar({
  tokens,
  active,
  onNav,
  automationPosture,
  NAV,
  isAuthed,
  firstName,
}) {
  return (
    <aside className="w-full md:w-[280px]">
      <div className="p-5" style={neuSurfaceStyle(tokens, { pressed: false })}>
        <div className="flex items-center justify-between">
          <div>
            <div
              className="text-sm font-extrabold"
              style={{ color: tokens.accent }}
            >
              {isAuthed ? firstName || "You" : "VLOSA"}
            </div>
            <div className="mt-1 text-xs" style={{ color: tokens.subtext }}>
              VLOSA — Virtual Life Operating System Agent
            </div>
          </div>
          <div
            className="text-xs font-semibold"
            style={{ color: tokens.subtext }}
          >
            v1
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active;
            const itemStyle = neuSurfaceStyle(tokens, {
              pressed: isActive,
              radius: 14,
            });
            const textColor = isActive ? tokens.accent : tokens.text;
            const iconColor = isActive ? tokens.accent : tokens.subtext;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNav(item.key)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-semibold"
                style={{
                  ...itemStyle,
                  border: "none",
                  cursor: "pointer",
                  color: textColor,
                }}
              >
                <Icon size={18} color={iconColor} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <div
            className="text-xs font-semibold"
            style={{ color: tokens.subtext }}
          >
            Safety
          </div>
          <div
            className="mt-2 flex items-center justify-between gap-3 p-3"
            style={neuSurfaceStyle(tokens, { pressed: true, radius: 14 })}
          >
            <div className="text-xs" style={{ color: tokens.subtext }}>
              High-impact actions
            </div>
            <div
              className="rounded-full px-2 py-1 text-[11px] font-semibold"
              style={{
                backgroundColor:
                  tokens.name === "dark"
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.05)",
                color: tokens.accent,
              }}
            >
              {automationPosture === "auto_run" ? "Auto" : "Approval"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}



