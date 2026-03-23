'use client';

export default function ArchiveSettingsSection({
  activeArchiveTab,
  setActiveArchiveTab,
  archivedCurrentWorkspaceViews,
  archivedCurrentSavedViews,
  archivedCurrentGroups,
  archivedCurrentTasks,
  archivedCurrentPeople,
  archivedCurrentTemplates,
  archivedCurrentAutomations,
  archivedBoards,
  restoreWorkspaceView,
  deleteArchivedWorkspaceView,
  restoreSavedView,
  deleteArchivedSavedView,
  restoreGroup,
  deleteArchivedGroup,
  restoreTask,
  restorePerson,
  deleteArchivedPerson,
  restoreTaskTemplate,
  deleteArchivedTaskTemplate,
  restoreAutomationRule,
  deleteArchivedAutomationRule,
  restoreBoard,
}) {
  const isEmpty =
    (activeArchiveTab === 'views' && archivedCurrentWorkspaceViews.length === 0 && archivedCurrentSavedViews.length === 0) ||
    (activeArchiveTab === 'groups' && archivedCurrentGroups.length === 0) ||
    (activeArchiveTab === 'deals' && archivedCurrentTasks.length === 0) ||
    (activeArchiveTab === 'people' && archivedCurrentPeople.length === 0) ||
    (activeArchiveTab === 'templates' && archivedCurrentTemplates.length === 0) ||
    (activeArchiveTab === 'automations' && archivedCurrentAutomations.length === 0) ||
    (activeArchiveTab === 'boards' && archivedBoards.length === 0);

  return (
    <section className="settingsSection settingsSectionWide">
      <div className="panelTitle panelTitleSmall">Archive</div>
      <div className="smallMuted">Open one archive type at a time so restore lists stay tidy as the board grows.</div>
      <div className="settingsSubtabBar">
        <button type="button" className={`settingsSubtab ${activeArchiveTab === 'views' ? 'active' : ''}`} onClick={() => setActiveArchiveTab('views')}>
          Views ({archivedCurrentWorkspaceViews.length + archivedCurrentSavedViews.length})
        </button>
        <button type="button" className={`settingsSubtab ${activeArchiveTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveArchiveTab('groups')}>
          Stages ({archivedCurrentGroups.length})
        </button>
        <button type="button" className={`settingsSubtab ${activeArchiveTab === 'deals' ? 'active' : ''}`} onClick={() => setActiveArchiveTab('deals')}>
          Deals ({archivedCurrentTasks.length})
        </button>
        <button type="button" className={`settingsSubtab ${activeArchiveTab === 'people' ? 'active' : ''}`} onClick={() => setActiveArchiveTab('people')}>
          People ({archivedCurrentPeople.length})
        </button>
        <button type="button" className={`settingsSubtab ${activeArchiveTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveArchiveTab('templates')}>
          Templates ({archivedCurrentTemplates.length})
        </button>
        <button type="button" className={`settingsSubtab ${activeArchiveTab === 'automations' ? 'active' : ''}`} onClick={() => setActiveArchiveTab('automations')}>
          Automations ({archivedCurrentAutomations.length})
        </button>
        <button type="button" className={`settingsSubtab ${activeArchiveTab === 'boards' ? 'active' : ''}`} onClick={() => setActiveArchiveTab('boards')}>
          Boards ({archivedBoards.length})
        </button>
      </div>
      <div className="directoryList">
        {activeArchiveTab === 'views' && (
          <>
            {archivedCurrentWorkspaceViews.map((view) => (
              <div className="directoryCard" key={`archived-workspace-${view.id}`}>
                <div>
                  <div className="scoreName">{view.name}</div>
                  <div className="scoreMeta">{view.type} view</div>
                </div>
                <div className="columnCardActions">
                  <button className="btn" onClick={() => restoreWorkspaceView(view.id)}>Restore</button>
                  <button className="btn btnDanger" onClick={() => deleteArchivedWorkspaceView(view.id)}>Delete</button>
                </div>
              </div>
            ))}
            {archivedCurrentSavedViews.map((view) => (
              <div className="directoryCard" key={`archived-saved-${view.id}`}>
                <div>
                  <div className="scoreName">{view.name}</div>
                  <div className="scoreMeta">Saved board filter</div>
                </div>
                <div className="columnCardActions">
                  <button className="btn" onClick={() => restoreSavedView(view.id)}>Restore</button>
                  <button className="btn btnDanger" onClick={() => deleteArchivedSavedView(view.id)}>Delete</button>
                </div>
              </div>
            ))}
          </>
        )}
        {activeArchiveTab === 'groups' && archivedCurrentGroups.map((group) => (
          <div className="directoryCard" key={`archived-group-${group.id}`}>
            <div>
              <div className="scoreName">{group.name}</div>
              <div className="scoreMeta">Archived stage</div>
            </div>
            <div className="columnCardActions">
              <button className="btn" onClick={() => restoreGroup(group.id)}>Restore</button>
              <button className="btn btnDanger" onClick={() => deleteArchivedGroup(group.id)}>Delete</button>
            </div>
          </div>
        ))}
        {activeArchiveTab === 'deals' && archivedCurrentTasks.map((task) => (
          <div className="directoryCard" key={`archived-task-${task.id}`}>
            <div>
              <div className="scoreName">{task.title}</div>
              <div className="scoreMeta">Archived deal</div>
            </div>
            <button className="btn" onClick={() => restoreTask(task.id)}>Restore</button>
          </div>
        ))}
        {activeArchiveTab === 'people' && archivedCurrentPeople.map((person) => (
          <div className="directoryCard" key={`archived-person-${person.id}`}>
            <div>
              <div className="scoreName">{person.name}</div>
              <div className="scoreMeta">{person.role}</div>
            </div>
            <div className="columnCardActions">
              <button className="btn" onClick={() => restorePerson(person.id)}>Restore</button>
              <button className="btn btnDanger" onClick={() => deleteArchivedPerson(person.id)}>Delete</button>
            </div>
          </div>
        ))}
        {activeArchiveTab === 'templates' && archivedCurrentTemplates.map((template) => (
          <div className="directoryCard" key={`archived-template-${template.id}`}>
            <div>
              <div className="scoreName">{template.name}</div>
              <div className="scoreMeta">{template.category || 'General'} template</div>
            </div>
            <div className="columnCardActions">
              <button className="btn" onClick={() => restoreTaskTemplate(template.id)}>Restore</button>
              <button className="btn btnDanger" onClick={() => deleteArchivedTaskTemplate(template.id)}>Delete</button>
            </div>
          </div>
        ))}
        {activeArchiveTab === 'automations' && archivedCurrentAutomations.map((rule) => (
          <div className="directoryCard" key={`archived-automation-${rule.id}`}>
            <div>
              <div className="scoreName">{rule.name}</div>
              <div className="scoreMeta">{rule.action.replace(/_/g, ' ')}</div>
            </div>
            <div className="columnCardActions">
              <button className="btn" onClick={() => restoreAutomationRule(rule.id)}>Restore</button>
              <button className="btn btnDanger" onClick={() => deleteArchivedAutomationRule(rule.id)}>Delete</button>
            </div>
          </div>
        ))}
        {activeArchiveTab === 'boards' && archivedBoards.map((board) => (
          <div className="directoryCard" key={`archived-board-${board.id}`}>
            <div>
              <div className="scoreName">{board.name}</div>
              <div className="scoreMeta">Archived board</div>
            </div>
            <button className="btn" onClick={() => restoreBoard(board.id)}>Restore</button>
          </div>
        ))}
        {isEmpty && (
          <div className="smallMuted">No archived items in this section yet.</div>
        )}
      </div>
    </section>
  );
}
