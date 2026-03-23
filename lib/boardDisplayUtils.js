export function createBoardDisplayUtils(deps) {
  const { isColumnCompleteForTask } = deps;

  function getProgressForTask(task, column) {
    const linkedColumns = Array.isArray(column.options) ? column.options : [];
    if (!linkedColumns.length) return 0;
    const totalWeight = linkedColumns.reduce((sum, linkedColumn) => (
      sum + (Number(linkedColumn.weight) > 0 ? Number(linkedColumn.weight) : 1)
    ), 0);
    if (totalWeight <= 0) return 0;
    const completedWeight = linkedColumns.reduce((sum, linkedColumn) => (
      isColumnCompleteForTask(task, linkedColumn.columnId, linkedColumn.targetValue || '')
        ? sum + (Number(linkedColumn.weight) > 0 ? Number(linkedColumn.weight) : 1)
        : sum
    ), 0);
    return Math.round((completedWeight / totalWeight) * 100);
  }

  function getAttachmentBadge(attachment) {
    const extension = (attachment?.name || '').split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) return { label: 'IMG', tone: 'toneBlue' };
    if (['pdf'].includes(extension)) return { label: 'PDF', tone: 'toneRed' };
    if (['doc', 'docx'].includes(extension)) return { label: 'DOC', tone: 'toneBlue' };
    if (['xls', 'xlsx', 'csv'].includes(extension)) return { label: 'XLS', tone: 'toneGreen' };
    return { label: 'FILE', tone: 'toneNeutral' };
  }

  return {
    getProgressForTask,
    getAttachmentBadge,
  };
}
