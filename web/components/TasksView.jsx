import { NeuButton, NeuCard, NeuInput, neuSurfaceStyle } from "@/utils/neu";

export function TasksView({
  tokens,
  newTaskTitle,
  setNewTaskTitle,
  newTaskPriority,
  setNewTaskPriority,
  setSaveError,
  createTaskMutation,
  updateTaskMutation,
  deleteTaskMutation,
  incomingTasks,
  activeTasks,
  completedTasks,
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <NeuCard className="p-5">
        <div className="text-sm font-semibold">Create task</div>
        <div className="mt-4 grid gap-3">
          <NeuInput
            label="Title"
            value={newTaskTitle}
            onChange={setNewTaskTitle}
            placeholder="e.g. Reply to Steven"
          />

          <label className="block">
            <div
              className="mb-2 text-xs font-semibold"
              style={{ color: tokens.subtext }}
            >
              Priority
            </div>
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none"
              style={{
                ...neuSurfaceStyle(tokens, { pressed: true, radius: 16 }),
                color: tokens.text,
                border: "none",
                backgroundColor: tokens.surface,
              }}
            >
              <option value="urgent">Urgent</option>
              <option value="important">Important</option>
              <option value="routine">Routine</option>
            </select>
          </label>

          <NeuButton
            disabled={!newTaskTitle || createTaskMutation.isPending}
            onClick={() => {
              setSaveError(null);
              createTaskMutation.mutate({
                title: newTaskTitle,
                priority: newTaskPriority,
                status: "incoming",
              });
            }}
          >
            Create
          </NeuButton>
        </div>

        <div className="mt-6 text-sm font-semibold">Incoming</div>
        <div className="mt-3 grid gap-3">
          {incomingTasks.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
              style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
            >
              <div className="text-sm font-semibold">{t.title}</div>
              <div className="flex gap-2">
                <NeuButton
                  onClick={() =>
                    updateTaskMutation.mutate({
                      id: t.id,
                      payload: { status: "active" },
                    })
                  }
                >
                  Approve
                </NeuButton>
                <NeuButton
                  variant="secondary"
                  onClick={() => deleteTaskMutation.mutate(t.id)}
                >
                  Reject
                </NeuButton>
              </div>
            </div>
          ))}
          {incomingTasks.length === 0 ? (
            <div
              className="p-4 text-sm"
              style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
            >
              No incoming tasks.
            </div>
          ) : null}
        </div>
      </NeuCard>

      <div className="grid gap-4">
        <NeuCard className="p-5">
          <div className="text-sm font-semibold">Active</div>
          <div className="mt-3 grid gap-3">
            {activeTasks.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
                style={neuSurfaceStyle(tokens, {
                  pressed: true,
                  radius: 16,
                })}
              >
                <div className="text-sm">{t.title}</div>
                <div className="flex gap-2">
                  <NeuButton
                    onClick={() =>
                      updateTaskMutation.mutate({
                        id: t.id,
                        payload: { status: "completed" },
                      })
                    }
                  >
                    Complete
                  </NeuButton>
                  <NeuButton
                    variant="secondary"
                    onClick={() => deleteTaskMutation.mutate(t.id)}
                  >
                    Delete
                  </NeuButton>
                </div>
              </div>
            ))}
            {activeTasks.length === 0 ? (
              <div
                className="p-4 text-sm"
                style={neuSurfaceStyle(tokens, {
                  pressed: true,
                  radius: 16,
                })}
              >
                No active tasks.
              </div>
            ) : null}
          </div>
        </NeuCard>

        <NeuCard className="p-5">
          <div className="text-sm font-semibold">Completed</div>
          <div className="mt-3 grid gap-3">
            {completedTasks.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
                style={neuSurfaceStyle(tokens, {
                  pressed: true,
                  radius: 16,
                })}
              >
                <div className="text-sm" style={{ color: tokens.subtext }}>
                  {t.title}
                </div>
                <NeuButton
                  variant="secondary"
                  onClick={() => deleteTaskMutation.mutate(t.id)}
                >
                  Delete
                </NeuButton>
              </div>
            ))}
            {completedTasks.length === 0 ? (
              <div
                className="p-4 text-sm"
                style={neuSurfaceStyle(tokens, {
                  pressed: true,
                  radius: 16,
                })}
              >
                No completed tasks.
              </div>
            ) : null}
          </div>
        </NeuCard>
      </div>
    </div>
  );
}



