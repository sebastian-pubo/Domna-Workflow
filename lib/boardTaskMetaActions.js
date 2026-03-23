export function createBoardTaskMetaActions(deps) {
  const {
    canEditDeals,
    taskMeta,
    patchTaskMeta,
    logTaskActivity,
    formatDuration,
    usingDemoMode,
    supabase,
    setErrorText,
    getTaskDependencies,
  } = deps;

  async function toggleTimeTracking(task) {
    if (!canEditDeals()) return;
    if (!task) return;
    const timerStartedAt = taskMeta[task.id]?.timerStartedAt || null;
    if (!timerStartedAt) {
      patchTaskMeta(task.id, (current) => ({
        ...current,
        timerStartedAt: new Date().toISOString(),
      }));
      logTaskActivity(task.id, { type: 'time', title: 'Timer started', description: 'Time tracking started for this deal.' });
      return;
    }

    const minutes = Math.max(1, Math.round((Date.now() - new Date(timerStartedAt).getTime()) / 60000));
    const entryId = `time-${Date.now()}`;
    const endedAt = new Date().toISOString();
    patchTaskMeta(task.id, (current) => ({
      ...current,
      timerStartedAt: null,
      timeEntries: [
        {
          id: entryId,
          startedAt: timerStartedAt,
          endedAt,
          minutes,
        },
        ...(current.timeEntries || []),
      ],
    }));
    logTaskActivity(task.id, { type: 'time', title: 'Timer stopped', description: `Tracked ${formatDuration(minutes)} on this deal.` });

    if (usingDemoMode || !supabase) return;
    const { data, error } = await supabase.from('task_time_entries').insert({
      task_id: task.id,
      started_at: timerStartedAt,
      ended_at: endedAt,
      minutes,
    }).select().single();
    if (error) {
      setErrorText(error.message);
      return;
    }
    patchTaskMeta(task.id, (current) => ({
      ...current,
      timeEntries: (current.timeEntries || []).map((entry) => (
        entry.id === entryId
          ? {
              ...entry,
              id: data.id,
              startedAt: data.started_at,
              endedAt: data.ended_at,
              minutes: data.minutes,
            }
          : entry
      )),
    }));
  }

  async function updateTaskDependencies(taskId, nextDependencies) {
    if (!canEditDeals()) return;
    const previousDependencies = getTaskDependencies({ id: taskId });
    patchTaskMeta(taskId, (current) => ({
      ...current,
      dependencies: nextDependencies,
    }));
    logTaskActivity(taskId, {
      type: 'dependency',
      title: 'Dependencies updated',
      description: `${nextDependencies.length} linked deal${nextDependencies.length === 1 ? '' : 's'} now tracked.`,
    });

    if (usingDemoMode || !supabase) return;

    const removedIds = previousDependencies.filter((id) => !nextDependencies.includes(id));
    const addedIds = nextDependencies.filter((id) => !previousDependencies.includes(id));

    if (removedIds.length > 0) {
      const { error } = await supabase.from('task_dependencies').delete().eq('task_id', taskId).in('depends_on_task_id', removedIds);
      if (error) {
        setErrorText(error.message);
        return;
      }
    }

    if (addedIds.length > 0) {
      const { error } = await supabase.from('task_dependencies').upsert(
        addedIds.map((dependencyId) => ({
          task_id: taskId,
          depends_on_task_id: dependencyId,
        })),
        { onConflict: 'task_id,depends_on_task_id' },
      );
      if (error) {
        setErrorText(error.message);
      }
    }
  }

  return {
    toggleTimeTracking,
    updateTaskDependencies,
  };
}
