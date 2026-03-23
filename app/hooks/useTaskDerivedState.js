import { useMemo } from 'react';

export function useTaskDerivedState({
  tasks,
  taskMeta,
  commentsByTask,
  boardColumns,
  boardGroupIds,
  deferredSearch,
  assessorFilter,
  priorityFilter,
  qaFilter,
  assessors,
  selectedBoardId,
  makeAssessorId,
  groupBy,
  boardGroups,
  hideEmptyGroups,
  sortMode,
  compareTasks,
  columnValueToText,
  allColumns,
  getTrackedMinutes,
  getTaskDependencies,
  getProgressForTask,
  boardGroupNameById,
  selectedTaskIds,
  formatDate,
}) {
  const enhancedTasks = useMemo(
    () => tasks.map((task) => ({
      ...task,
      archived_at: task.archived_at || null,
      issues: Array.isArray(task.issues) ? task.issues : [],
      issueDraft: taskMeta[task.id]?.issueDraft,
      comments: commentsByTask[task.id] || task.comments || [],
      customFields: taskMeta[task.id]?.customFields || {},
      attachments: taskMeta[task.id]?.attachments || [],
    })),
    [commentsByTask, taskMeta, tasks],
  );

  const filteredTaskList = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    const sortTaskList = (taskList) => {
      const nextTasks = [...taskList];
      if (sortMode === 'priority') {
        const weights = { High: 0, Medium: 1, Low: 2 };
        return nextTasks.sort((left, right) => (weights[left.priority] ?? 3) - (weights[right.priority] ?? 3) || compareTasks(left, right));
      }

      if (sortMode === 'title') {
        return nextTasks.sort((left, right) => (left.title || '').localeCompare(right.title || ''));
      }

      if (sortMode === 'dueDate') {
        return nextTasks.sort((left, right) => {
          const leftDate = left.due_date ? new Date(`${left.due_date}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
          const rightDate = right.due_date ? new Date(`${right.due_date}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
          return leftDate - rightDate || compareTasks(left, right);
        });
      }

      return nextTasks.sort(compareTasks);
    };

    const boardTaskPool = enhancedTasks
      .filter((task) => !task.archived_at)
      .filter((task) => boardGroupIds.has(task.group_id))
      .filter((task) => assessorFilter === 'All' || (task.assessor || 'Unassigned') === assessorFilter)
      .filter((task) => priorityFilter === 'All' || (task.priority || 'Medium') === priorityFilter)
      .filter((task) => qaFilter === 'All' || (task.qa_status || 'Pending') === qaFilter);

    const matchingTasks = !query
      ? boardTaskPool
      : boardTaskPool.filter((task) => {
        const customValues = boardColumns.map((column) => columnValueToText(task.customFields?.[column.id]));
        return [
          task.title,
          task.assessor,
          task.status,
          task.qa_status,
          task.magicplan_status,
          task.notes,
          ...(task.issues || []),
          ...customValues,
        ].join(' ').toLowerCase().includes(query);
      });

    const boardTasks = enhancedTasks.filter((task) => !task.archived_at && boardGroupIds.has(task.group_id));
    const assessorDirectory = (() => {
      const taskNames = Array.from(new Set(tasks.map((task) => task.assessor || 'Unassigned').filter(Boolean)));
      const stored = assessors
        .filter((assessor) => !assessor.boardId || assessor.boardId === selectedBoardId)
        .map((assessor) => ({
          id: assessor.id || makeAssessorId(assessor.name),
          name: assessor.name,
          role: assessor.role || 'Assessor',
        }));
      const missingFromTasks = taskNames
        .filter((name) => !stored.some((assessor) => assessor.name === name))
        .map((name) => ({
          id: makeAssessorId(name),
          name,
          role: name === 'Unassigned' ? 'Unassigned' : 'Assessor',
        }));

      return [...stored, ...missingFromTasks].sort((left, right) => {
        if (left.name === 'Unassigned') return -1;
        if (right.name === 'Unassigned') return 1;
        return left.name.localeCompare(right.name);
      });
    })();

    const displayedGroups = (() => {
      let nextGroups = [];

      if (groupBy === 'assessor') {
        nextGroups = assessorDirectory.map((assessor) => ({
          id: `assessor-${assessor.name}`,
          name: assessor.name,
          ui_class: 'assigned',
          tasks: sortTaskList(matchingTasks.filter((task) => (task.assessor || 'Unassigned') === assessor.name)),
        }));
      } else if (groupBy === 'priority') {
        nextGroups = ['High', 'Medium', 'Low'].map((priority) => ({
          id: `priority-${priority}`,
          name: priority,
          ui_class: priority === 'High' ? 'qa' : priority === 'Medium' ? 'survey' : 'submitted',
          tasks: sortTaskList(matchingTasks.filter((task) => (task.priority || 'Medium') === priority)),
        }));
      } else {
        nextGroups = boardGroups.map((group) => ({
          ...group,
          tasks: sortTaskList(matchingTasks.filter((task) => task.group_id === group.id)),
        }));
      }

      return hideEmptyGroups ? nextGroups.filter((group) => group.tasks.length > 0) : nextGroups;
    })();

    return {
      filteredTaskList: matchingTasks,
      boardTasks,
      assessorDirectory,
      displayedGroups,
    };
  }, [
    assessorFilter,
    assessors,
    boardColumns,
    boardGroupIds,
    boardGroups,
    columnValueToText,
    compareTasks,
    deferredSearch,
    enhancedTasks,
    groupBy,
    hideEmptyGroups,
    makeAssessorId,
    priorityFilter,
    qaFilter,
    selectedBoardId,
    sortMode,
    tasks,
  ]);

  const boardTasks = filteredTaskList.boardTasks;
  const assessorDirectory = filteredTaskList.assessorDirectory;
  const displayedGroups = filteredTaskList.displayedGroups;

  const archivedCurrentTasks = useMemo(
    () => enhancedTasks.filter((task) => task.archived_at && boardGroupIds.has(task.group_id)),
    [boardGroupIds, enhancedTasks],
  );

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: boardTasks.length,
      qaOpen: boardTasks.filter((task) => !['Passed', 'N/A'].includes(task.qa_status)).length,
      highPriority: boardTasks.filter((task) => task.priority === 'High').length,
      dueSoon: boardTasks.filter((task) => {
        if (!task.due_date) return false;
        const diff = Math.round((new Date(`${task.due_date}T00:00:00`).getTime() - today.getTime()) / 86400000);
        return diff >= 0 && diff <= 6;
      }).length,
    };
  }, [boardTasks]);

  const assessorOptions = useMemo(
    () => ['All', ...assessorDirectory.map((assessor) => assessor.name)],
    [assessorDirectory],
  );

  const qaOptions = useMemo(
    () => ['All', ...Array.from(new Set(boardTasks.map((task) => task.qa_status || 'Pending'))).sort()],
    [boardTasks],
  );

  const dashboardStats = useMemo(() => {
    const todayStartMs = new Date().setHours(0, 0, 0, 0);
    const overdue = boardTasks.filter((task) => task.due_date && new Date(`${task.due_date}T00:00:00`).getTime() < todayStartMs).length;
    const qaNeedsAttention = boardTasks.filter((task) => !['Passed', 'N/A'].includes(task.qa_status)).length;
    const dueThisWeek = boardTasks.filter((task) => {
      if (!task.due_date) return false;
      const days = Math.round((new Date(`${task.due_date}T00:00:00`).getTime() - todayStartMs) / 86400000);
      return days >= 0 && days <= 6;
    }).length;
    const highPriority = boardTasks.filter((task) => task.priority === 'High').length;
    const unassigned = boardTasks.filter((task) => !task.assessor || task.assessor === 'Unassigned').length;
    const magicplanOutstanding = boardTasks.filter((task) => !['Yes', 'Mixed'].includes(task.magicplan_status || 'No')).length;
    const workload = assessorDirectory
      .filter((assessor) => assessor.name !== 'Unassigned')
      .map((assessor) => ({
        name: assessor.name,
        count: boardTasks.filter((task) => (task.assessor || 'Unassigned') === assessor.name).length,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);

    const upcoming = [...boardTasks]
      .filter((task) => task.due_date)
      .sort((left, right) => new Date(`${left.due_date}T00:00:00`).getTime() - new Date(`${right.due_date}T00:00:00`).getTime())
      .slice(0, 6);

    const qaQueue = [...boardTasks]
      .filter((task) => !['Passed', 'N/A'].includes(task.qa_status))
      .sort(compareTasks)
      .slice(0, 6);
    const trackedHours = boardTasks.reduce((sum, task) => sum + (getTrackedMinutes(task) / 60), 0);
    const blocked = boardTasks.filter((task) => getTaskDependencies(task).some((dependencyId) => {
      const dependency = boardTasks.find((candidate) => candidate.id === dependencyId);
      return dependency && dependency.status !== 'Submitted';
    })).length;
    const progressColumns = allColumns.filter((column) => column.type === 'progress');
    const averageProgress = progressColumns.length
      ? Math.round(boardTasks.reduce((sum, task) => sum + progressColumns.reduce((taskSum, column) => taskSum + getProgressForTask(task, column), 0) / progressColumns.length, 0) / Math.max(boardTasks.length, 1))
      : 0;

    return { overdue, qaNeedsAttention, dueThisWeek, highPriority, unassigned, magicplanOutstanding, workload, upcoming, qaQueue, trackedHours, blocked, averageProgress };
  }, [allColumns, assessorDirectory, boardTasks, compareTasks, getProgressForTask, getTaskDependencies, getTrackedMinutes]);

  const allBoardAttachments = useMemo(
    () => boardTasks.flatMap((task) => (task.attachments || []).map((attachment) => ({
      ...attachment,
      taskId: task.id,
      taskTitle: task.title,
      groupName: boardGroupNameById[task.group_id] || 'Unassigned',
    }))),
    [boardGroupNameById, boardTasks],
  );

  const calendarSummary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return boardTasks.reduce((summary, task) => {
      if (!task.due_date) {
        summary.noDueDate += 1;
        return summary;
      }

      const dueDate = new Date(`${task.due_date}T00:00:00`);
      if (Number.isNaN(dueDate.getTime())) return summary;
      if (dueDate < today) summary.overdue += 1;
      if (dueDate.getTime() === today.getTime()) summary.today += 1;
      if (dueDate >= today && dueDate <= sevenDaysFromNow) summary.thisWeek += 1;
      return summary;
    }, {
      overdue: 0,
      today: 0,
      thisWeek: 0,
      noDueDate: 0,
    });
  }, [boardTasks]);

  const calendarGroups = useMemo(() => {
    const bucket = {};
    for (const task of boardTasks) {
      const key = task.due_date || 'No due date';
      bucket[key] = [...(bucket[key] || []), task];
    }
    return Object.entries(bucket)
      .sort(([left], [right]) => {
        if (left === 'No due date') return 1;
        if (right === 'No due date') return -1;
        return new Date(`${left}T00:00:00`).getTime() - new Date(`${right}T00:00:00`).getTime();
      })
      .map(([date, tasksForDate]) => ([date, [...tasksForDate].sort((left, right) => {
        const leftPriority = { High: 0, Medium: 1, Low: 2 }[left.priority] ?? 3;
        const rightPriority = { High: 0, Medium: 1, Low: 2 }[right.priority] ?? 3;
        if (leftPriority !== rightPriority) return leftPriority - rightPriority;
        return left.title.localeCompare(right.title);
      })]));
  }, [boardTasks]);

  const timelineTasks = useMemo(
    () => [...boardTasks]
      .filter((task) => task.due_date)
      .sort((left, right) => new Date(`${left.due_date}T00:00:00`).getTime() - new Date(`${right.due_date}T00:00:00`).getTime())
      .slice(0, 18),
    [boardTasks],
  );

  const timelineRange = useMemo(() => {
    if (timelineTasks.length === 0) {
      return {
        startMs: 0,
        endMs: 0,
        totalDays: 1,
        markers: [],
      };
    }

    const startCandidates = timelineTasks.map((task) => {
      const createdMs = task.created_at ? new Date(task.created_at).getTime() : Number.NaN;
      const dueMs = new Date(`${task.due_date}T00:00:00`).getTime();
      if (Number.isNaN(createdMs)) return dueMs - (5 * 24 * 60 * 60 * 1000);
      return Math.min(createdMs, dueMs);
    });
    const endCandidates = timelineTasks.map((task) => new Date(`${task.due_date}T00:00:00`).getTime());
    const startMs = Math.min(...startCandidates);
    const endMs = Math.max(...endCandidates);
    const safeEndMs = endMs <= startMs ? startMs + (24 * 60 * 60 * 1000) : endMs;
    const totalDays = Math.max(1, Math.round((safeEndMs - startMs) / (24 * 60 * 60 * 1000)) + 1);
    const markerCount = Math.min(6, totalDays);
    const markers = Array.from({ length: markerCount }, (_, index) => {
      const ratio = markerCount === 1 ? 0 : index / (markerCount - 1);
      const markerMs = startMs + ((safeEndMs - startMs) * ratio);
      return {
        label: formatDate(new Date(markerMs).toISOString().slice(0, 10)),
        left: `${ratio * 100}%`,
      };
    });

    return {
      startMs,
      endMs: safeEndMs,
      totalDays,
      markers,
    };
  }, [formatDate, timelineTasks]);

  const selectedDeals = useMemo(
    () => boardTasks.filter((task) => selectedTaskIds.includes(task.id)),
    [boardTasks, selectedTaskIds],
  );

  const allDisplayedTaskIds = useMemo(
    () => displayedGroups.flatMap((group) => group.tasks.map((task) => task.id)),
    [displayedGroups],
  );

  return {
    enhancedTasks,
    filteredTaskList: filteredTaskList.filteredTaskList,
    boardTasks,
    archivedCurrentTasks,
    assessorDirectory,
    displayedGroups,
    stats,
    assessorOptions,
    qaOptions,
    dashboardStats,
    allBoardAttachments,
    calendarSummary,
    calendarGroups,
    timelineTasks,
    timelineRange,
    selectedDeals,
    allDisplayedTaskIds,
  };
}
