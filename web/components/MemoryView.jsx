import { NeuButton, NeuCard, NeuInput, neuSurfaceStyle } from "@/utils/neu";

export function MemoryView({
  tokens,
  newMemoryText,
  setNewMemoryText,
  setSaveError,
  createMemoryMutation,
  updateMemoryMutation,
  deleteMemoryMutation,
  memories,
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <NeuCard className="p-5">
        <div className="text-sm font-semibold">Capture memory</div>
        <div className="mt-4 grid gap-3">
          <NeuInput
            label="Memory"
            value={newMemoryText}
            onChange={setNewMemoryText}
            placeholder="e.g. Prefers concise messages"
          />
          <NeuButton
            disabled={!newMemoryText || createMemoryMutation.isPending}
            onClick={() => {
              setSaveError(null);
              createMemoryMutation.mutate({
                content: newMemoryText,
                source: "manual",
              });
            }}
          >
            Save
          </NeuButton>
        </div>
      </NeuCard>

      <NeuCard className="p-5">
        <div className="text-sm font-semibold">Memory inspector</div>
        <div className="mt-4 grid gap-3">
          {memories.map((m) => (
            <div
              key={m.id}
              className="p-4"
              style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
            >
              <div className="text-sm font-semibold">
                {String(m.content || "")}
              </div>
              <div className="mt-1 text-xs" style={{ color: tokens.subtext }}>
                {m.pinned ? "Pinned" : "Unpinned"}
                {m.source ? ` • Source: ${String(m.source)}` : ""}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <NeuButton
                  variant="secondary"
                  onClick={() => deleteMemoryMutation.mutate(m.id)}
                >
                  Forget
                </NeuButton>
                <NeuButton
                  variant="secondary"
                  onClick={() =>
                    updateMemoryMutation.mutate({
                      id: m.id,
                      payload: { pinned: !m.pinned },
                    })
                  }
                >
                  {m.pinned ? "Unpin" : "Pin"}
                </NeuButton>
              </div>
            </div>
          ))}
          {memories.length === 0 ? (
            <div
              className="p-4 text-sm"
              style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
            >
              No memories yet.
            </div>
          ) : null}
        </div>
      </NeuCard>
    </div>
  );
}



