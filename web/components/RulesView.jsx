import { NeuCard, neuSurfaceStyle } from "@/utils/neu";

export function RulesView({
  tokens,
  automationPosture,
  quietStart,
  quietEnd,
  ruleNeverUnknown,
  ruleAllowedStart,
  ruleAllowedEnd,
  ruleNoSaturday,
  ruleDraftEmails,
  ruleSendWithoutApproval,
  updateSettingsMutation,
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <NeuCard className="p-5">
        <div className="text-sm font-semibold">Rules engine</div>
        <div className="mt-2 text-sm" style={{ color: tokens.subtext }}>
          These rules are stored in Postgres (shared by web + mobile).
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
              Automation posture
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  updateSettingsMutation.mutate({
                    automation_posture: "approval_first",
                  })
                }
                className="px-3 py-3 text-sm font-extrabold"
                style={{
                  ...neuSurfaceStyle(tokens, {
                    pressed: automationPosture === "approval_first",
                    radius: 14,
                  }),
                  border: "none",
                  cursor: "pointer",
                  color: tokens.text,
                }}
              >
                Approval-first
              </button>
              <button
                type="button"
                onClick={() =>
                  updateSettingsMutation.mutate({
                    automation_posture: "auto_run",
                  })
                }
                className="px-3 py-3 text-sm font-extrabold"
                style={{
                  ...neuSurfaceStyle(tokens, {
                    pressed: automationPosture === "auto_run",
                    radius: 14,
                  }),
                  border: "none",
                  cursor: "pointer",
                  color: tokens.text,
                }}
              >
                Auto-run
              </button>
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
              Quiet hours
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label className="block">
                <div
                  className="mb-2 text-xs font-semibold"
                  style={{ color: tokens.subtext }}
                >
                  Start
                </div>
                <input
                  type="time"
                  value={quietStart}
                  onChange={(e) =>
                    updateSettingsMutation.mutate({
                      quiet_hours_start: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 text-sm outline-none"
                  style={{
                    ...neuSurfaceStyle(tokens, {
                      pressed: true,
                      radius: 16,
                    }),
                    color: tokens.text,
                    border: "none",
                    backgroundColor: tokens.surface,
                  }}
                />
              </label>
              <label className="block">
                <div
                  className="mb-2 text-xs font-semibold"
                  style={{ color: tokens.subtext }}
                >
                  End
                </div>
                <input
                  type="time"
                  value={quietEnd}
                  onChange={(e) =>
                    updateSettingsMutation.mutate({
                      quiet_hours_end: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 text-sm outline-none"
                  style={{
                    ...neuSurfaceStyle(tokens, {
                      pressed: true,
                      radius: 16,
                    }),
                    color: tokens.text,
                    border: "none",
                    backgroundColor: tokens.surface,
                  }}
                />
              </label>
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
              Communication rules
            </div>
            <label className="mt-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={ruleNeverUnknown}
                onChange={(e) =>
                  updateSettingsMutation.mutate({
                    rules: {
                      communications: {
                        neverRespondToUnknownNumbers: e.target.checked,
                      },
                    },
                  })
                }
              />
              <span className="text-sm">Never respond to unknown numbers</span>
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <div
                  className="mb-2 text-xs font-semibold"
                  style={{ color: tokens.subtext }}
                >
                  Allowed start
                </div>
                <input
                  type="time"
                  value={ruleAllowedStart}
                  onChange={(e) =>
                    updateSettingsMutation.mutate({
                      rules: {
                        communications: {
                          allowedWindowStart: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-4 py-3 text-sm outline-none"
                  style={{
                    ...neuSurfaceStyle(tokens, {
                      pressed: true,
                      radius: 16,
                    }),
                    color: tokens.text,
                    border: "none",
                    backgroundColor: tokens.surface,
                  }}
                />
              </label>
              <label className="block">
                <div
                  className="mb-2 text-xs font-semibold"
                  style={{ color: tokens.subtext }}
                >
                  Allowed end
                </div>
                <input
                  type="time"
                  value={ruleAllowedEnd}
                  onChange={(e) =>
                    updateSettingsMutation.mutate({
                      rules: {
                        communications: {
                          allowedWindowEnd: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-4 py-3 text-sm outline-none"
                  style={{
                    ...neuSurfaceStyle(tokens, {
                      pressed: true,
                      radius: 16,
                    }),
                    color: tokens.text,
                    border: "none",
                    backgroundColor: tokens.surface,
                  }}
                />
              </label>
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
              Scheduling rules
            </div>
            <label className="mt-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={ruleNoSaturday}
                onChange={(e) =>
                  updateSettingsMutation.mutate({
                    rules: {
                      scheduling: {
                        neverScheduleOnSaturdays: e.target.checked,
                      },
                    },
                  })
                }
              />
              <span className="text-sm">Never schedule on Saturdays</span>
            </label>
          </div>

          <div
            className="p-4"
            style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
          >
            <div
              className="text-xs font-semibold"
              style={{ color: tokens.subtext }}
            >
              Email automation
            </div>
            <label className="mt-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={ruleDraftEmails}
                onChange={(e) =>
                  updateSettingsMutation.mutate({
                    rules: {
                      email: { draftEmailsAutomatically: e.target.checked },
                    },
                  })
                }
              />
              <span className="text-sm">Draft emails automatically</span>
            </label>
            <label className="mt-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={ruleSendWithoutApproval}
                onChange={(e) =>
                  updateSettingsMutation.mutate({
                    rules: {
                      email: {
                        sendEmailsWithoutApproval: e.target.checked,
                      },
                    },
                  })
                }
              />
              <span className="text-sm">Send emails without approval</span>
            </label>
          </div>
        </div>
      </NeuCard>

      <NeuCard className="p-5">
        <div className="text-sm font-semibold">Notes</div>
        <div className="mt-3 grid gap-3">
          {[
            "Rules are saved in Postgres.",
            "Today they're mostly policy. Next, we enforce them in integrations.",
            "Approval-first is your global safety switch.",
          ].map((line) => (
            <div
              key={line}
              className="p-4 text-sm"
              style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
            >
              {line}
            </div>
          ))}
        </div>
      </NeuCard>
    </div>
  );
}



