import { NeuButton, NeuCard, neuSurfaceStyle } from "@/utils/neu";

export function InboxView({
  tokens,
  inboxItems,
  selectedInboxItem,
  selectedInboxId,
  draftSuggestedReply,
  setSelectedInboxId,
  setDraftSuggestedReply,
  setSaveError,
  createInboxMutation,
  updateInboxMutation,
  deleteInboxMutation,
  DEMO_INBOX_ITEMS,
}) {
  const selectedId = selectedInboxItem?.id || null;
  const detailFrom = selectedInboxItem?.from_name
    ? String(selectedInboxItem.from_name)
    : "(unknown)";
  const detailSubject = selectedInboxItem?.subject
    ? String(selectedInboxItem.subject)
    : "";
  const detailSummary = selectedInboxItem?.ai_summary
    ? String(selectedInboxItem.ai_summary)
    : "(no summary yet)";
  const detailStatus = selectedInboxItem?.status
    ? String(selectedInboxItem.status)
    : "incoming";
  const detailPriority = selectedInboxItem?.priority
    ? String(selectedInboxItem.priority)
    : "routine";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <NeuCard className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">Inbox</div>
          <NeuButton
            variant="secondary"
            disabled={createInboxMutation.isPending}
            onClick={() => {
              setSaveError(null);
              DEMO_INBOX_ITEMS.forEach((payload) =>
                createInboxMutation.mutate(payload),
              );
            }}
          >
            Seed demo
          </NeuButton>
        </div>

        <div className="grid gap-3">
          {inboxItems.map((item) => {
            const isSelected = item.id === selectedId;
            const rowStyle = neuSurfaceStyle(tokens, {
              pressed: isSelected,
              radius: 16,
            });
            const fromName = item.from_name
              ? String(item.from_name)
              : "(unknown)";
            const subject = item.subject ? String(item.subject) : "";
            const topLine = `${fromName} — ${subject}`;
            const meta = `${String(item.priority || "routine")} • ${String(item.status || "incoming")}`;
            const summary = item.ai_summary
              ? `AI: ${String(item.ai_summary)}`
              : "AI: (no summary yet)";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedInboxId(item.id)}
                className="w-full text-left"
                style={{
                  ...rowStyle,
                  padding: 14,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div className="text-sm font-semibold">{topLine}</div>
                <div className="mt-2 text-xs" style={{ color: tokens.subtext }}>
                  {meta}
                </div>
                <div className="mt-1 text-xs" style={{ color: tokens.subtext }}>
                  {summary}
                </div>
              </button>
            );
          })}

          {inboxItems.length === 0 ? (
            <div
              className="p-4 text-sm"
              style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
            >
              No inbox items yet. Click "Seed demo" to create a few.
            </div>
          ) : null}
        </div>
      </NeuCard>

      <NeuCard className="p-5">
        <div className="text-sm font-semibold">Selected item</div>

        {selectedInboxItem ? (
          <div className="mt-3 grid gap-3">
            <div
              className="p-4"
              style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
            >
              <div
                className="text-xs font-semibold"
                style={{ color: tokens.subtext }}
              >
                From
              </div>
              <div className="mt-1 text-sm">{detailFrom}</div>
              <div
                className="mt-2 text-xs font-semibold"
                style={{ color: tokens.subtext }}
              >
                Subject
              </div>
              <div className="mt-1 text-sm">{detailSubject}</div>
              <div
                className="mt-2 text-xs font-semibold"
                style={{ color: tokens.subtext }}
              >
                Status / Priority
              </div>
              <div className="mt-1 text-sm">
                {detailStatus} • {detailPriority}
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
                AI summary
              </div>
              <div className="mt-1 text-sm">{detailSummary}</div>
            </div>

            <div
              className="p-4"
              style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
            >
              <div
                className="text-xs font-semibold"
                style={{ color: tokens.subtext }}
              >
                Suggested reply
              </div>
              <textarea
                value={draftSuggestedReply}
                onChange={(e) => setDraftSuggestedReply(e.target.value)}
                rows={6}
                className="mt-2 w-full resize-none bg-transparent text-sm outline-none"
                style={{ color: tokens.text }}
              />

              <div className="mt-3 flex flex-wrap gap-3">
                <NeuButton
                  onClick={() => {
                    setSaveError(null);
                    updateInboxMutation.mutate({
                      id: selectedInboxItem.id,
                      payload: {
                        suggested_reply: draftSuggestedReply,
                        status: "approved",
                      },
                    });
                  }}
                >
                  Approve
                </NeuButton>
                <NeuButton
                  variant="secondary"
                  onClick={() => {
                    setSaveError(null);
                    updateInboxMutation.mutate({
                      id: selectedInboxItem.id,
                      payload: { suggested_reply: draftSuggestedReply },
                    });
                  }}
                >
                  Save edits
                </NeuButton>
                <NeuButton
                  variant="secondary"
                  onClick={() => {
                    setSaveError(null);
                    updateInboxMutation.mutate({
                      id: selectedInboxItem.id,
                      payload: { status: "archived" },
                    });
                  }}
                >
                  Archive
                </NeuButton>
                <NeuButton
                  variant="secondary"
                  onClick={() => {
                    setSaveError(null);
                    updateInboxMutation.mutate({
                      id: selectedInboxItem.id,
                      payload: { status: "later" },
                    });
                  }}
                >
                  Later
                </NeuButton>
                <NeuButton
                  variant="secondary"
                  onClick={() => {
                    setSaveError(null);
                    deleteInboxMutation.mutate(selectedInboxItem.id);
                  }}
                >
                  Delete
                </NeuButton>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="mt-3 p-4 text-sm"
            style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
          >
            Select an inbox item.
          </div>
        )}
      </NeuCard>
    </div>
  );
}



