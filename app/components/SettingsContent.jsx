'use client';

import AccountsSettingsSection from './settings/AccountsSettingsSection';
import ArchiveSettingsSection from './settings/ArchiveSettingsSection';
import AutomationsSettingsSection from './settings/AutomationsSettingsSection';
import BoardSettingsSection from './settings/BoardSettingsSection';
import ChannelsSettingsSection from './settings/ChannelsSettingsSection';
import ColumnsSettingsSection from './settings/ColumnsSettingsSection';
import GroupsSettingsSection from './settings/GroupsSettingsSection';
import PeopleSettingsSection from './settings/PeopleSettingsSection';
import PermissionsSettingsSection from './settings/PermissionsSettingsSection';
import ReminderRulesSettingsSection from './settings/ReminderRulesSettingsSection';
import TemplatesSettingsSection from './settings/TemplatesSettingsSection';
import ViewsSettingsSection from './settings/ViewsSettingsSection';

export default function SettingsContent(props) {
  const { activeSettingsTab } = props;

  if (activeSettingsTab === 'board') {
    return (
      <BoardSettingsSection
        boardNameDraft={props.boardNameDraft}
        setBoardNameDraft={props.setBoardNameDraft}
        renameSelectedBoard={props.renameSelectedBoard}
        canEditBoardStructure={props.canEditBoardStructure}
        archiveSelectedBoard={props.archiveSelectedBoard}
        deleteSelectedBoard={props.deleteSelectedBoard}
        selectedBoardId={props.selectedBoardId}
      />
    );
  }

  if (activeSettingsTab === 'views') {
    return (
      <ViewsSettingsSection
        newWorkspaceViewName={props.newWorkspaceViewName}
        setNewWorkspaceViewName={props.setNewWorkspaceViewName}
        newWorkspaceViewType={props.newWorkspaceViewType}
        setNewWorkspaceViewType={props.setNewWorkspaceViewType}
        addWorkspaceView={props.addWorkspaceView}
        canEditBoardStructure={props.canEditBoardStructure}
        currentBoardViews={props.currentBoardViews}
        pendingWorkspaceViewArchiveId={props.pendingWorkspaceViewArchiveId}
        setPendingWorkspaceViewArchiveId={props.setPendingWorkspaceViewArchiveId}
        pendingWorkspaceViewDeleteId={props.pendingWorkspaceViewDeleteId}
        setPendingWorkspaceViewDeleteId={props.setPendingWorkspaceViewDeleteId}
        renameWorkspaceView={props.renameWorkspaceView}
        removeWorkspaceView={props.removeWorkspaceView}
        deleteWorkspaceViewPermanently={props.deleteWorkspaceViewPermanently}
      />
    );
  }

  if (activeSettingsTab === 'accounts') {
    return (
      <AccountsSettingsSection
        authUser={props.authUser}
        currentProfile={props.currentProfile}
        activeRoleName={props.activeRoleName}
        signOutCurrentUser={props.signOutCurrentUser}
        authEmailDraft={props.authEmailDraft}
        setAuthEmailDraft={props.setAuthEmailDraft}
        signInWithEmail={props.signInWithEmail}
        authStatusText={props.authStatusText}
        knownProfiles={props.knownProfiles}
        membershipDraftUserId={props.membershipDraftUserId}
        setMembershipDraftUserId={props.setMembershipDraftUserId}
        availableMembershipProfiles={props.availableMembershipProfiles}
        membershipDraftRole={props.membershipDraftRole}
        setMembershipDraftRole={props.setMembershipDraftRole}
        addBoardMembership={props.addBoardMembership}
        canEditBoardStructure={props.canEditBoardStructure}
        boardMemberships={props.boardMemberships}
        profilesById={props.profilesById}
        updateBoardMembershipRole={props.updateBoardMembershipRole}
        removeBoardMembership={props.removeBoardMembership}
        inviteDraftEmail={props.inviteDraftEmail}
        setInviteDraftEmail={props.setInviteDraftEmail}
        inviteDraftRole={props.inviteDraftRole}
        setInviteDraftRole={props.setInviteDraftRole}
        createBoardInvite={props.createBoardInvite}
        boardInvites={props.boardInvites}
        acceptBoardInvite={props.acceptBoardInvite}
        copyInviteLink={props.copyInviteLink}
        revokeBoardInvite={props.revokeBoardInvite}
      />
    );
  }

  if (activeSettingsTab === 'people') {
    return (
      <PeopleSettingsSection
        assessorDraftName={props.assessorDraftName}
        setAssessorDraftName={props.setAssessorDraftName}
        assessorDraftRole={props.assessorDraftRole}
        setAssessorDraftRole={props.setAssessorDraftRole}
        addAssessor={props.addAssessor}
        canEditBoardStructure={props.canEditBoardStructure}
        assessorDirectory={props.assessorDirectory}
        pendingAssessorArchiveId={props.pendingAssessorArchiveId}
        setPendingAssessorArchiveId={props.setPendingAssessorArchiveId}
        pendingAssessorDeleteId={props.pendingAssessorDeleteId}
        setPendingAssessorDeleteId={props.setPendingAssessorDeleteId}
        removeAssessor={props.removeAssessor}
        deleteAssessorPermanently={props.deleteAssessorPermanently}
      />
    );
  }

  if (activeSettingsTab === 'columns') {
    return (
      <ColumnsSettingsSection
        allColumns={props.allColumns}
        pendingColumnDeleteId={props.pendingColumnDeleteId}
        setPendingColumnDeleteId={props.setPendingColumnDeleteId}
        hiddenColumnIds={props.hiddenColumnIds}
        toggleColumnVisibility={props.toggleColumnVisibility}
        removeColumn={props.removeColumn}
        OPTION_COLOR_CHOICES={props.OPTION_COLOR_CHOICES}
        updateColumnOptions={props.updateColumnOptions}
        getColumnOptionDraft={props.getColumnOptionDraft}
        updateColumnOptionDraft={props.updateColumnOptionDraft}
        clearColumnOptionDraft={props.clearColumnOptionDraft}
        makeOption={props.makeOption}
        progressEligibleColumns={props.progressEligibleColumns}
        getCompletionValuesForColumn={props.getCompletionValuesForColumn}
      />
    );
  }

  if (activeSettingsTab === 'groups') {
    return (
      <GroupsSettingsSection
        newGroupName={props.newGroupName}
        setNewGroupName={props.setNewGroupName}
        addGroup={props.addGroup}
        canEditBoardStructure={props.canEditBoardStructure}
        boardGroups={props.boardGroups}
        pendingGroupDeleteId={props.pendingGroupDeleteId}
        setPendingGroupDeleteId={props.setPendingGroupDeleteId}
        pendingGroupPermanentDeleteId={props.pendingGroupPermanentDeleteId}
        setPendingGroupPermanentDeleteId={props.setPendingGroupPermanentDeleteId}
        renameGroup={props.renameGroup}
        displayedGroups={props.displayedGroups}
        removeGroup={props.removeGroup}
        deleteGroupPermanently={props.deleteGroupPermanently}
      />
    );
  }

  if (activeSettingsTab === 'permissions') {
    return (
      <PermissionsSettingsSection
        authUser={props.authUser}
        activeRoleName={props.activeRoleName}
        currentRole={props.currentRole}
        setCurrentRole={props.setCurrentRole}
        permissionSummary={props.permissionSummary}
        boardPermissions={props.boardPermissions}
        updateBoardPermission={props.updateBoardPermission}
        canEditBoardStructure={props.canEditBoardStructure}
      />
    );
  }

  if (activeSettingsTab === 'reminders') {
    return (
      <ReminderRulesSettingsSection
        boardReminderRules={props.boardReminderRules}
        updateReminderRule={props.updateReminderRule}
        canEditBoardStructure={props.canEditBoardStructure}
      />
    );
  }

  if (activeSettingsTab === 'automations') {
    return (
      <AutomationsSettingsSection
        AUTOMATION_PRESETS={props.AUTOMATION_PRESETS}
        applyAutomationPreset={props.applyAutomationPreset}
        automationDraftName={props.automationDraftName}
        setAutomationDraftName={props.setAutomationDraftName}
        automationDraftTrigger={props.automationDraftTrigger}
        setAutomationDraftTrigger={props.setAutomationDraftTrigger}
        automationDraftField={props.automationDraftField}
        setAutomationDraftField={props.setAutomationDraftField}
        allColumns={props.allColumns}
        getCompletionValuesForColumn={props.getCompletionValuesForColumn}
        automationDraftValue={props.automationDraftValue}
        setAutomationDraftValue={props.setAutomationDraftValue}
        automationDraftAction={props.automationDraftAction}
        setAutomationDraftAction={props.setAutomationDraftAction}
        automationDraftActionValue={props.automationDraftActionValue}
        setAutomationDraftActionValue={props.setAutomationDraftActionValue}
        boardGroups={props.boardGroups}
        assessorDirectory={props.assessorDirectory}
        addAutomationRule={props.addAutomationRule}
        boardAutomations={props.boardAutomations}
        pendingAutomationArchiveId={props.pendingAutomationArchiveId}
        setPendingAutomationArchiveId={props.setPendingAutomationArchiveId}
        pendingAutomationDeleteId={props.pendingAutomationDeleteId}
        setPendingAutomationDeleteId={props.setPendingAutomationDeleteId}
        archiveAutomationRule={props.archiveAutomationRule}
        deleteAutomationRulePermanently={props.deleteAutomationRulePermanently}
      />
    );
  }

  if (activeSettingsTab === 'templates') {
    return (
      <TemplatesSettingsSection
        templateDraftName={props.templateDraftName}
        setTemplateDraftName={props.setTemplateDraftName}
        templateDraftCategory={props.templateDraftCategory}
        setTemplateDraftCategory={props.setTemplateDraftCategory}
        templateDraftGroupId={props.templateDraftGroupId}
        setTemplateDraftGroupId={props.setTemplateDraftGroupId}
        boardGroups={props.boardGroups}
        templateDraftAssessor={props.templateDraftAssessor}
        setTemplateDraftAssessor={props.setTemplateDraftAssessor}
        assessorDirectory={props.assessorDirectory}
        templateDraftPriority={props.templateDraftPriority}
        setTemplateDraftPriority={props.setTemplateDraftPriority}
        templateDraftQaStatus={props.templateDraftQaStatus}
        setTemplateDraftQaStatus={props.setTemplateDraftQaStatus}
        qaOptions={props.qaOptions}
        templateDraftMagicplan={props.templateDraftMagicplan}
        setTemplateDraftMagicplan={props.setTemplateDraftMagicplan}
        templateDraftIssues={props.templateDraftIssues}
        setTemplateDraftIssues={props.setTemplateDraftIssues}
        templateDraftNotes={props.templateDraftNotes}
        setTemplateDraftNotes={props.setTemplateDraftNotes}
        allColumns={props.allColumns}
        templateDraftCustomFields={props.templateDraftCustomFields}
        setTemplateDraftCustomFields={props.setTemplateDraftCustomFields}
        createTemplateFromDraft={props.createTemplateFromDraft}
        boardTemplates={props.boardTemplates}
        pendingTemplateArchiveId={props.pendingTemplateArchiveId}
        setPendingTemplateArchiveId={props.setPendingTemplateArchiveId}
        pendingTemplateDeleteId={props.pendingTemplateDeleteId}
        setPendingTemplateDeleteId={props.setPendingTemplateDeleteId}
        archiveTaskTemplate={props.archiveTaskTemplate}
        deleteTaskTemplatePermanently={props.deleteTaskTemplatePermanently}
      />
    );
  }

  if (activeSettingsTab === 'channels') {
    return (
      <ChannelsSettingsSection
        channelDraftType={props.channelDraftType}
        setChannelDraftType={props.setChannelDraftType}
        channelDraftLabel={props.channelDraftLabel}
        setChannelDraftLabel={props.setChannelDraftLabel}
        channelDraftTarget={props.channelDraftTarget}
        setChannelDraftTarget={props.setChannelDraftTarget}
        channelDraftUrl={props.channelDraftUrl}
        setChannelDraftUrl={props.setChannelDraftUrl}
        addNotificationChannel={props.addNotificationChannel}
        canEditBoardStructure={props.canEditBoardStructure}
        boardNotificationChannels={props.boardNotificationChannels}
        toggleNotificationChannel={props.toggleNotificationChannel}
        removeNotificationChannel={props.removeNotificationChannel}
      />
    );
  }

  if (activeSettingsTab === 'archive') {
    return (
      <ArchiveSettingsSection
        activeArchiveTab={props.activeArchiveTab}
        setActiveArchiveTab={props.setActiveArchiveTab}
        archivedCurrentWorkspaceViews={props.archivedCurrentWorkspaceViews}
        archivedCurrentSavedViews={props.archivedCurrentSavedViews}
        archivedCurrentGroups={props.archivedCurrentGroups}
        archivedCurrentTasks={props.archivedCurrentTasks}
        archivedCurrentPeople={props.archivedCurrentPeople}
        archivedCurrentTemplates={props.archivedCurrentTemplates}
        archivedCurrentAutomations={props.archivedCurrentAutomations}
        archivedBoards={props.archivedBoards}
        restoreWorkspaceView={props.restoreWorkspaceView}
        deleteArchivedWorkspaceView={props.deleteArchivedWorkspaceView}
        restoreSavedView={props.restoreSavedView}
        deleteArchivedSavedView={props.deleteArchivedSavedView}
        restoreGroup={props.restoreGroup}
        deleteArchivedGroup={props.deleteArchivedGroup}
        restoreTask={props.restoreTask}
        restorePerson={props.restorePerson}
        deleteArchivedPerson={props.deleteArchivedPerson}
        restoreTaskTemplate={props.restoreTaskTemplate}
        deleteArchivedTaskTemplate={props.deleteArchivedTaskTemplate}
        restoreAutomationRule={props.restoreAutomationRule}
        deleteArchivedAutomationRule={props.deleteArchivedAutomationRule}
        restoreBoard={props.restoreBoard}
      />
    );
  }

  return null;
}
