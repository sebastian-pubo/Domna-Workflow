'use client';

import CalendarView from './CalendarView';
import DashboardView from './DashboardView';
import FilesView from './FilesView';
import KanbanView from './KanbanView';
import MainBoardTable from './MainBoardTable';
import TimelineView from './TimelineView';

export default function WorkspaceViewContent(props) {
  if (props.loading) {
    return <div className="emptyState">Loading board data...</div>;
  }

  if (props.currentWorkspaceView.type === 'kanban') {
    return (
      <KanbanView
        displayedGroups={props.displayedGroups}
        groupBy={props.groupBy}
        draggedTaskId={props.draggedTaskId}
        moveTaskBefore={props.moveTaskBefore}
        setDraggedTaskId={props.setDraggedTaskId}
        openTask={props.openTask}
        toneClass={props.toneClass}
        formatDate={props.formatDate}
      />
    );
  }

  if (props.currentWorkspaceView.type === 'dashboard') {
    return (
      <DashboardView
        dashboardStats={props.dashboardStats}
        stageOverview={props.stageOverview}
        openTask={props.openTask}
        formatDate={props.formatDate}
        notificationSummary={props.notificationSummary}
        boardNotifications={props.boardNotifications}
        boardTasks={props.boardTasks}
        getTaskDependencies={props.getTaskDependencies}
      />
    );
  }

  if (props.currentWorkspaceView.type === 'calendar') {
    return (
      <CalendarView
        calendarSummary={props.calendarSummary}
        calendarGroups={props.calendarGroups}
        draggedTaskId={props.draggedTaskId}
        canEditDeals={props.canEditDeals}
        moveTaskToCalendarDate={props.moveTaskToCalendarDate}
        setDraggedTaskId={props.setDraggedTaskId}
        formatDate={props.formatDate}
        toneClass={props.toneClass}
        updateTaskFieldInline={props.updateTaskFieldInline}
        addDaysToDateString={props.addDaysToDateString}
        openTask={props.openTask}
      />
    );
  }

  if (props.currentWorkspaceView.type === 'timeline') {
    return (
      <TimelineView
        timelineTasks={props.timelineTasks}
        timelineRange={props.timelineRange}
        draggedTaskId={props.draggedTaskId}
        canEditDeals={props.canEditDeals}
        setDraggedTaskId={props.setDraggedTaskId}
        openTask={props.openTask}
        moveTaskToTimelinePosition={props.moveTaskToTimelinePosition}
        toneClass={props.toneClass}
        formatDate={props.formatDate}
      />
    );
  }

  if (props.currentWorkspaceView.type === 'files') {
    return (
      <FilesView
        allBoardAttachments={props.allBoardAttachments}
        formatDateTime={props.formatDateTime}
      />
    );
  }

  return (
    <MainBoardTable
      displayedGroups={props.displayedGroups}
      groupBy={props.groupBy}
      draggedTaskId={props.draggedTaskId}
      canEditDeals={props.canEditDeals}
      moveTaskBefore={props.moveTaskBefore}
      setDraggedTaskId={props.setDraggedTaskId}
      compactMode={props.compactMode}
      boardGridStyle={props.boardGridStyle}
      visibleColumns={props.visibleColumns}
      pinnedColumnOffsets={props.pinnedColumnOffsets}
      draggedColumnId={props.draggedColumnId}
      setDraggedColumnId={props.setDraggedColumnId}
      canEditBoardStructure={props.canEditBoardStructure}
      reorderColumn={props.reorderColumn}
      allDisplayedTaskIds={props.allDisplayedTaskIds}
      selectedTaskIds={props.selectedTaskIds}
      toggleTaskSelection={props.toggleTaskSelection}
      toggleAllDisplayedSelection={props.toggleAllDisplayedSelection}
      renameColumn={props.renameColumn}
      beginColumnResize={props.beginColumnResize}
      showInlineColumnCreator={props.showInlineColumnCreator}
      setShowInlineColumnCreator={props.setShowInlineColumnCreator}
      columnDraftName={props.columnDraftName}
      setColumnDraftName={props.setColumnDraftName}
      columnDraftType={props.columnDraftType}
      setColumnDraftType={props.setColumnDraftType}
      setColumnDraftOptions={props.setColumnDraftOptions}
      setColumnDraftOptionLabel={props.setColumnDraftOptionLabel}
      setColumnDraftOptionColor={props.setColumnDraftOptionColor}
      OPTION_COLORS={props.OPTION_COLORS}
      setColumnDraftLinks={props.setColumnDraftLinks}
      progressEligibleColumns={props.progressEligibleColumns}
      columnDraftLinks={props.columnDraftLinks}
      formulaDraftType={props.formulaDraftType}
      setFormulaDraftType={props.setFormulaDraftType}
      FORMULA_CHOICES={props.FORMULA_CHOICES}
      OPTION_COLOR_CHOICES={props.OPTION_COLOR_CHOICES}
      columnDraftOptionLabel={props.columnDraftOptionLabel}
      setColumnDraftOptionLabelDirect={props.setColumnDraftOptionLabel}
      columnDraftOptionColor={props.columnDraftOptionColor}
      setColumnDraftOptionColorDirect={props.setColumnDraftOptionColor}
      addDraftColumnOption={props.addDraftColumnOption}
      columnDraftOptions={props.columnDraftOptions}
      updateDraftColumnOption={props.updateDraftColumnOption}
      removeDraftColumnOption={props.removeDraftColumnOption}
      addColumn={props.addColumn}
      boardGroups={props.boardGroups}
      assessorDirectory={props.assessorDirectory}
      updateTaskFieldInline={props.updateTaskFieldInline}
      updateIssueDraft={props.updateIssueDraft}
      commitIssueDraft={props.commitIssueDraft}
      updateCustomFieldInline={props.updateCustomFieldInline}
      patchTask={props.patchTask}
      persistTask={props.persistTask}
      openTask={props.openTask}
      getIssuesInputValue={props.getIssuesInputValue}
      getProgressForTask={props.getProgressForTask}
      getFormulaValue={props.getFormulaValue}
      getAttachmentBadge={props.getAttachmentBadge}
      getOptionTone={props.getOptionTone}
      toneClass={props.toneClass}
    />
  );
}
