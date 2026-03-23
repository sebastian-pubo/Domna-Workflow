'use client';

export default function QuickAddDealPanel({
  quickAddInputRef,
  newTaskTitle,
  setNewTaskTitle,
  newTaskGroupId,
  setNewTaskGroupId,
  boardGroups,
  newTaskAssessor,
  setNewTaskAssessor,
  assessorDirectory,
  selectedTemplateId,
  setSelectedTemplateId,
  boardTemplates,
  addTask,
  canEditDeals,
}) {
  return (
    <section className="panel quickAddPanel">
      <div className="quickAddBar">
        <div className="quickAddTitle">Quick add deal</div>
        <input
          ref={quickAddInputRef}
          className="input"
          value={newTaskTitle}
          onChange={(event) => setNewTaskTitle(event.target.value)}
          placeholder="Example: 54 Market Street - QA Review"
        />
        <select className="select" value={newTaskGroupId} onChange={(event) => setNewTaskGroupId(event.target.value)}>
          <option value="">Default group</option>
          {boardGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <select className="select" value={newTaskAssessor} onChange={(event) => setNewTaskAssessor(event.target.value)}>
          {assessorDirectory.map((assessor) => (
            <option key={assessor.id} value={assessor.name}>
              {assessor.name}
            </option>
          ))}
        </select>
        <select className="select" value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
          <option value="">No template</option>
          {boardTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <button
          className="btn btnPrimary"
          onClick={addTask}
          disabled={!canEditDeals()}
          title={!canEditDeals() ? 'Current role cannot create deals.' : ''}
        >
          Add deal
        </button>
      </div>
    </section>
  );
}
