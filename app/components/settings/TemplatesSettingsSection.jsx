'use client';

export default function TemplatesSettingsSection({
  templateDraftName,
  setTemplateDraftName,
  templateDraftCategory,
  setTemplateDraftCategory,
  templateDraftGroupId,
  setTemplateDraftGroupId,
  boardGroups,
  templateDraftAssessor,
  setTemplateDraftAssessor,
  assessorDirectory,
  templateDraftPriority,
  setTemplateDraftPriority,
  templateDraftQaStatus,
  setTemplateDraftQaStatus,
  qaOptions,
  templateDraftMagicplan,
  setTemplateDraftMagicplan,
  templateDraftIssues,
  setTemplateDraftIssues,
  templateDraftNotes,
  setTemplateDraftNotes,
  allColumns,
  templateDraftCustomFields,
  setTemplateDraftCustomFields,
  createTemplateFromDraft,
  boardTemplates,
  pendingTemplateArchiveId,
  setPendingTemplateArchiveId,
  pendingTemplateDeleteId,
  setPendingTemplateDeleteId,
  archiveTaskTemplate,
  deleteTaskTemplatePermanently,
}) {
  return (
    <section className="settingsSection">
      <div className="panelTitle panelTitleSmall">Templates</div>
      <div className="smallMuted">Build reusable templates here, then apply them from quick add. You can still save from an open deal when that is faster.</div>
      <div className="directoryForm">
        <input className="input" value={templateDraftName} onChange={(event) => setTemplateDraftName(event.target.value)} placeholder="Template name" />
        <input className="input" value={templateDraftCategory} onChange={(event) => setTemplateDraftCategory(event.target.value)} placeholder="Category" />
        <select className="select" value={templateDraftGroupId} onChange={(event) => setTemplateDraftGroupId(event.target.value)}>
          <option value="">Default stage</option>
          {boardGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
        </select>
        <select className="select" value={templateDraftAssessor} onChange={(event) => setTemplateDraftAssessor(event.target.value)}>
          {assessorDirectory.map((assessor) => <option key={assessor.id} value={assessor.name}>{assessor.name}</option>)}
        </select>
        <select className="select" value={templateDraftPriority} onChange={(event) => setTemplateDraftPriority(event.target.value)}>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select className="select" value={templateDraftQaStatus} onChange={(event) => setTemplateDraftQaStatus(event.target.value)}>
          {qaOptions.filter((option) => option !== 'All').map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <select className="select" value={templateDraftMagicplan} onChange={(event) => setTemplateDraftMagicplan(event.target.value)}>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
        <input className="input" value={templateDraftIssues} onChange={(event) => setTemplateDraftIssues(event.target.value)} placeholder="Issues, comma separated" />
        <textarea className="textarea" value={templateDraftNotes} onChange={(event) => setTemplateDraftNotes(event.target.value)} placeholder="Template notes" />
        {allColumns.filter((column) => column.isCustom).map((column) => (
          <div key={`template-custom-${column.id}`} className="directoryForm">
            <label className="smallMuted">{column.label}</label>
            {['select', 'status'].includes(column.type) ? (
              <select className="select" value={templateDraftCustomFields[column.id] || ''} onChange={(event) => setTemplateDraftCustomFields((prev) => ({ ...prev, [column.id]: event.target.value }))}>
                <option value="">No default</option>
                {(column.options || []).map((option) => <option key={option.label} value={option.label}>{option.label}</option>)}
              </select>
            ) : column.type === 'multi_select' ? (
              <input className="input" value={Array.isArray(templateDraftCustomFields[column.id]) ? templateDraftCustomFields[column.id].join(', ') : ''} onChange={(event) => setTemplateDraftCustomFields((prev) => ({ ...prev, [column.id]: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} placeholder="Comma separated defaults" />
            ) : (
              <input className="input" value={templateDraftCustomFields[column.id] || ''} onChange={(event) => setTemplateDraftCustomFields((prev) => ({ ...prev, [column.id]: event.target.value }))} placeholder={`Default for ${column.label}`} />
            )}
          </div>
        ))}
        <button className="btn" onClick={createTemplateFromDraft}>Create template</button>
      </div>
      <div className="directoryList">
        {boardTemplates.length === 0 ? (
          <div className="smallMuted">No templates saved for this board yet.</div>
        ) : (
          boardTemplates.map((template) => (
            <div key={template.id} className="directoryCard">
              <div>
                <div className="scoreName">{template.name}</div>
                <div className="smallMuted">{template.category || 'General'} · {Object.keys(template.customFields || {}).length} custom fields saved</div>
              </div>
              {pendingTemplateArchiveId === template.id ? (
                <div className="columnCardActions">
                  <button className="btn btnDanger" onClick={() => archiveTaskTemplate(template.id)}>Archive</button>
                  <button className="btn" onClick={() => setPendingTemplateArchiveId(null)}>Cancel</button>
                </div>
              ) : pendingTemplateDeleteId === template.id ? (
                <div className="columnCardActions">
                  <button className="btn btnDanger" onClick={() => deleteTaskTemplatePermanently(template.id)}>Delete</button>
                  <button className="btn" onClick={() => setPendingTemplateDeleteId(null)}>Cancel</button>
                </div>
              ) : (
                <div className="columnCardActions">
                  <button className="textButton" onClick={() => {
                    setPendingTemplateDeleteId(null);
                    setPendingTemplateArchiveId(template.id);
                  }}>Archive</button>
                  <button className="textButton" onClick={() => {
                    setPendingTemplateArchiveId(null);
                    setPendingTemplateDeleteId(template.id);
                  }}>Delete</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
