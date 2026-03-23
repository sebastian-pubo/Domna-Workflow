export function createBoardColumnDraftActions(deps) {
  const {
    canEditBoardStructure,
    selectedBoardId,
    columnDraftName,
    columnDraftType,
    columnDraftOptions,
    columnDraftOptionLabel,
    columnDraftOptionColor,
    columnDraftLinks,
    formulaDraftType,
    customColumns,
    allColumns,
    OPTION_COLORS,
    usingDemoMode,
    supabase,
    setErrorText,
    setCustomColumns,
    setColumnDraftName,
    setColumnDraftType,
    setColumnDraftOptions,
    setColumnDraftOptionLabel,
    setColumnDraftOptionColor,
    setColumnDraftLinks,
    setFormulaDraftType,
    makeOption,
    normalizeColumnOptions,
    normalizeProgressLinks,
    normalizeFormulaConfig,
    normalizeColumnType,
  } = deps;

  function resetColumnDraft() {
    setColumnDraftName('');
    setColumnDraftType('text');
    setColumnDraftOptions([]);
    setColumnDraftOptionLabel('');
    setColumnDraftOptionColor(OPTION_COLORS[0]);
    setColumnDraftLinks([]);
    setFormulaDraftType('days_until_due');
  }

  function addDraftColumnOption() {
    const nextLabel = columnDraftOptionLabel.trim();
    if (!nextLabel) return;
    setColumnDraftOptions((prev) => [...prev, makeOption(nextLabel, columnDraftOptionColor, prev.length)]);
    setColumnDraftOptionLabel('');
    setColumnDraftOptionColor(OPTION_COLORS[0]);
  }

  function updateDraftColumnOption(index, patch) {
    setColumnDraftOptions((prev) => prev.map((option, optionIndex) => (
      optionIndex === index ? { ...option, ...patch } : option
    )));
  }

  function removeDraftColumnOption(index) {
    setColumnDraftOptions((prev) => prev.filter((_, optionIndex) => optionIndex !== index));
  }

  async function addColumn() {
    if (!canEditBoardStructure()) return;
    const name = columnDraftName.trim();
    if (!name || !selectedBoardId) return;
    setErrorText('');
    const pendingDraftOption = columnDraftOptionLabel.trim()
      ? [makeOption(columnDraftOptionLabel, columnDraftOptionColor, columnDraftOptions.length)]
      : [];
    const options = ['select', 'status', 'multi_select'].includes(columnDraftType)
      ? normalizeColumnOptions([...columnDraftOptions, ...pendingDraftOption])
      : columnDraftType === 'progress'
        ? normalizeProgressLinks(columnDraftLinks.map((columnId) => {
          const linkedColumn = allColumns.find((column) => column.id === columnId);
          return { columnId, label: linkedColumn?.label || linkedColumn?.name || columnId, targetValue: '', weight: 1 };
        }))
        : columnDraftType === 'formula'
          ? normalizeFormulaConfig({ formula: formulaDraftType })
          : [];
    if (['select', 'status', 'multi_select'].includes(columnDraftType) && options.length === 0) {
      setErrorText('Add at least one option before creating this column.');
      return;
    }
    if (columnDraftType === 'progress' && options.length === 0) {
      setErrorText('Link at least one column before creating this progress column.');
      return;
    }

    if (usingDemoMode || !supabase) {
      setCustomColumns((prev) => [...prev, {
        id: `column-${Date.now()}`,
        boardId: selectedBoardId,
        name,
        type: columnDraftType,
        options,
        position: prev.filter((column) => column.boardId === selectedBoardId).length,
      }]);
      resetColumnDraft();
      return;
    }

    const nextPosition = customColumns.filter((column) => column.boardId === selectedBoardId).length;
    const { data, error } = await supabase.from('board_columns').insert({
      board_id: selectedBoardId,
      name,
      column_type: normalizeColumnType(columnDraftType),
      options_json: options,
      position: nextPosition,
    }).select().single();

    if (error) {
      setErrorText(error.message);
      return;
    }

    setCustomColumns((prev) => [
      ...prev,
      {
        id: data.id,
        boardId: data.board_id,
        name: data.name,
        type: normalizeColumnType(data.column_type),
        options: normalizeColumnType(data.column_type) === 'progress'
          ? normalizeProgressLinks(data.options_json)
          : normalizeColumnType(data.column_type) === 'formula'
            ? normalizeFormulaConfig(data.options_json)
            : normalizeColumnOptions(data.options_json),
        position: data.position || nextPosition,
      },
    ]);
    resetColumnDraft();
  }

  return {
    resetColumnDraft,
    addDraftColumnOption,
    updateDraftColumnOption,
    removeDraftColumnOption,
    addColumn,
  };
}
