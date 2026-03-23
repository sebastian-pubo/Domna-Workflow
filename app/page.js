'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  appendUniqueById,
  appendBoardMapItem,
  prependBoardMapItem,
  removeById,
  removeBoardScopedPeople,
  removeBoardScopedItems,
  removeBoardTasks,
  filterBoardMapItems,
  replaceBoardMapItem,
  sortByPosition,
  upsertBoardMapItem,
  withoutBoardKey,
} from '../lib/boardStateUtils';
import {
  OPTION_COLORS,
  OPTION_COLOR_CHOICES,
  safeParse,
  formatDate,
  formatDateTime,
  addDaysToDateString,
  parseIssuesInput,
  getIssuesInputValue,
  toneClass,
  makeAssessorId,
  normalizeColumnOptions,
  getOptionTone,
  makeOption,
  parseStoredColumnValue,
  serializeColumnValue,
  columnValueToText,
  makeNotification,
  makeNotificationKey,
  formatDuration,
  compareTasks,
} from '../lib/boardCoreUtils';
import { createBoardArchiveActions } from '../lib/boardArchiveActions';
import { createBoardAccessActions } from '../lib/boardAccessActions';
import { createBoardBulkTaskActions } from '../lib/boardBulkTaskActions';
import { createBoardPeopleViewActions } from '../lib/boardPeopleViewActions';
import { createBoardTaskActions } from '../lib/boardTaskActions';
import { createBoardTaskFlowActions } from '../lib/boardTaskFlowActions';
import { createBoardTaskMetaActions } from '../lib/boardTaskMetaActions';
import { createBoardColumnActions } from '../lib/boardColumnActions';
import { createBoardColumnDraftActions } from '../lib/boardColumnDraftActions';
import { createBoardViewUiActions } from '../lib/boardViewUiActions';
import { createBoardDisplayUtils } from '../lib/boardDisplayUtils';
import { createBoardStructureActions } from '../lib/boardStructureActions';
import { createBoardWorkflowActions } from '../lib/boardWorkflowActions';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import ActionToolbar from './components/ActionToolbar';
import BulkActionsBar from './components/BulkActionsBar';
import DealModal from './components/DealModal';
import FiltersPanel from './components/FiltersPanel';
import NotificationsPanel from './components/NotificationsPanel';
import PermissionSummaryPanel from './components/PermissionSummaryPanel';
import QuickAddDealPanel from './components/QuickAddDealPanel';
import SettingsModalShell from './components/SettingsModalShell';
import SidebarNav from './components/SidebarNav';
import StatsOverviewGrid from './components/StatsOverviewGrid';
import SettingsContent from './components/SettingsContent';
import WorkspaceViewContent from './components/WorkspaceViewContent';
import WorkspaceNotices from './components/WorkspaceNotices';
import WorkspaceTopbar from './components/WorkspaceTopbar';
import { useBoardScopedState } from './hooks/useBoardScopedState';
import { useBoardNotificationsState } from './hooks/useBoardNotificationsState';
import { useBoardUiState } from './hooks/useBoardUiState';
import { useTaskDerivedState } from './hooks/useTaskDerivedState';

const CUSTOM_COLUMNS_KEY = 'domna-custom-columns-v1';
const METRIC_LABELS_KEY = 'domna-metric-labels-v1';
const TASK_META_KEY = 'domna-task-meta-v1';
const ASSESSORS_KEY = 'domna-assessors-v1';
const SAVED_VIEWS_KEY = 'domna-saved-views-v1';
const COLUMN_WIDTHS_KEY = 'domna-column-widths-v1';
const HIDDEN_COLUMNS_KEY = 'domna-hidden-columns-v1';
const COLUMN_ORDER_KEY = 'domna-column-order-v1';
const COMPACT_MODE_KEY = 'domna-compact-mode-v1';
const WORKSPACE_VIEWS_KEY = 'domna-workspace-views-v1';
const THEME_MODE_KEY = 'domna-theme-mode-v1';
const AUTOMATIONS_KEY = 'domna-automations-v1';
const ARCHIVED_AUTOMATIONS_KEY = 'domna-archived-automations-v1';
const REMINDER_RULES_KEY = 'domna-reminder-rules-v1';
const TEMPLATES_KEY = 'domna-templates-v1';
const ARCHIVED_TEMPLATES_KEY = 'domna-archived-templates-v1';
const NOTIFICATIONS_KEY = 'domna-notifications-v1';
const CURRENT_ROLE_KEY = 'domna-current-role-v1';
const BOARD_PERMISSIONS_KEY = 'domna-board-permissions-v1';

const ROLE_OPTIONS = ['Admin', 'Manager', 'QA', 'Assessor', 'Viewer'];
const VIEW_TYPES = ['main', 'kanban', 'files', 'dashboard', 'calendar', 'timeline'];
const FILE_CATEGORY_OPTIONS = ['General', 'Survey', 'EPC', 'Design', 'Invoice', 'Photos'];
const FORMULA_CHOICES = [
  { value: 'days_until_due', label: 'Days until due' },
  { value: 'days_overdue', label: 'Days overdue' },
  { value: 'issue_count', label: 'Issue count' },
  { value: 'file_count', label: 'File count' },
  { value: 'update_count', label: 'Update count' },
  { value: 'tracked_hours', label: 'Tracked hours' },
  { value: 'progress_average', label: 'Progress average' },
];

const AUTOMATION_PRESETS = [
  {
    id: 'survey-to-qa',
    name: 'Survey complete -> move to QA',
    trigger: 'field_equals',
    field: 'stage',
    value: 'Survey Done',
    action: 'move_stage',
    actionValue: 'QA',
  },
  {
    id: 'files-notify',
    name: 'Files uploaded -> notify',
    trigger: 'file_added',
    field: '',
    value: '',
    action: 'notify',
    actionValue: '',
  },
  {
    id: 'qa-pass-submit',
    name: 'QA passed -> move to Submitted',
    trigger: 'field_equals',
    field: 'qa_status',
    value: 'Passed',
    action: 'move_stage',
    actionValue: 'Submitted',
  },
  {
    id: 'overdue-high',
    name: 'Overdue -> set High priority',
    trigger: 'overdue',
    field: '',
    value: '',
    action: 'set_priority',
    actionValue: 'High',
  },
];

const DEFAULT_REMINDER_RULES = {
  overdue: true,
  dueSoon: true,
  unassigned: true,
};

const DEFAULT_WORKSPACE_VIEWS = [
  { id: 'main', type: 'main', name: 'Main table', locked: true },
  { id: 'kanban', type: 'kanban', name: 'Kanban', locked: true },
  { id: 'files', type: 'files', name: 'Files', locked: true },
  { id: 'dashboard', type: 'dashboard', name: 'Dashboard', locked: true },
];

const SETTINGS_TABS = [
  { id: 'board', label: 'Board' },
  { id: 'views', label: 'Views' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'people', label: 'People' },
  { id: 'columns', label: 'Columns' },
  { id: 'groups', label: 'Groups' },
  { id: 'templates', label: 'Templates' },
  { id: 'automations', label: 'Automations' },
  { id: 'channels', label: 'Channels' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'reminders', label: 'Reminder rules' },
  { id: 'archive', label: 'Archive' },
];

const BASE_COLUMNS = [
  { id: 'item', label: 'Deal', defaultWidth: 360 },
  { id: 'stage', label: 'Stage', defaultWidth: 120 },
  { id: 'assessor', label: 'Assessor', defaultWidth: 150 },
  { id: 'priority', label: 'Priority', defaultWidth: 120 },
  { id: 'due_date', label: 'Due date', defaultWidth: 130 },
  { id: 'qa_status', label: 'QA status', defaultWidth: 140 },
  { id: 'magicplan_status', label: 'MagicPlan', defaultWidth: 130 },
  { id: 'issues', label: 'Issues', defaultWidth: 160 },
  { id: 'files', label: 'Files', defaultWidth: 120 },
  { id: 'updates', label: 'Updates', defaultWidth: 120 },
];

const DEFAULT_METRICS = {
  total: 'Total items',
  qaOpen: 'QA open',
  highPriority: 'High priority',
  dueSoon: 'Due soon',
};

const DEFAULT_BOARD_PERMISSIONS = [
  { role_name: 'Admin', can_manage_structure: true, can_edit_deals: true, can_delete_deals: true },
  { role_name: 'Manager', can_manage_structure: true, can_edit_deals: true, can_delete_deals: true },
  { role_name: 'QA', can_manage_structure: false, can_edit_deals: true, can_delete_deals: false },
  { role_name: 'Assessor', can_manage_structure: false, can_edit_deals: true, can_delete_deals: false },
  { role_name: 'Viewer', can_manage_structure: false, can_edit_deals: false, can_delete_deals: false },
];

const demoBoards = [
  {
    id: 'demo-board-1',
    name: 'Domna Homes Operations Platform',
    description: '',
    groups: [
      {
        id: 'demo-group-1',
        name: 'Assigned',
        className: 'assigned',
        tasks: [
          {
            id: 'demo-task-1',
            group_id: 'demo-group-1',
            title: '117 Alderney Street - Tabeeb',
            status: 'Assigned',
            priority: 'High',
            assessor: 'Tabeeb',
            due_date: '2026-03-20',
            qa_status: 'Pending',
            magicplan_status: 'No',
            issues: ['Ventilation'],
            notes: 'Awaiting upload of full folder information.',
            comments: [{ id: 'demo-comment-1', author: 'Seb', text: 'Check folder completeness before QA.', created_at: '2026-03-18T09:00:00.000Z' }],
          },
          {
            id: 'demo-task-2',
            group_id: 'demo-group-1',
            title: '23 Digby Road - Horace',
            status: 'Assigned',
            priority: 'Medium',
            assessor: 'Horace',
            due_date: '2026-03-21',
            qa_status: 'Pending',
            magicplan_status: 'No',
            issues: ['Heating', 'Wall Types'],
            notes: 'Previous correction issue noted. Needs double-check before resubmission.',
            comments: [{ id: 'demo-comment-2', author: 'Manager', text: 'Ensure full condition report is aligned with photo evidence.', created_at: '2026-03-18T12:30:00.000Z' }],
          },
        ],
      },
      {
        id: 'demo-group-2',
        name: 'Survey Done',
        className: 'survey',
        tasks: [
          {
            id: 'demo-task-3',
            group_id: 'demo-group-2',
            title: '36a London Road - Horace',
            status: 'Survey Done',
            priority: 'High',
            assessor: 'Horace',
            due_date: '2026-03-19',
            qa_status: 'In Review',
            magicplan_status: 'Yes',
            issues: ['Room in Roof', 'Ventilation', 'MagicPlan'],
            notes: 'Survey complete. Inputs require technical validation.',
            comments: [{ id: 'demo-comment-3', author: 'QA', text: 'Verify room-in-roof classification and ventilation strategy.', created_at: '2026-03-19T08:30:00.000Z' }],
          },
        ],
      },
      {
        id: 'demo-group-3',
        name: 'QA',
        className: 'qa',
        tasks: [
          {
            id: 'demo-task-4',
            group_id: 'demo-group-3',
            title: '1 Llys Drew SE16 3EY',
            status: 'QA',
            priority: 'High',
            assessor: 'Lewis',
            due_date: '2026-03-19',
            qa_status: 'Needs Correction',
            magicplan_status: 'Yes',
            issues: ['Ventilation', 'Door Undercut', 'Trickle Vents'],
            notes: 'Cross-check floor plan PDF against condition report merge.',
            comments: [{ id: 'demo-comment-4', author: 'Seb', text: 'Merged PDF nearly working. Floor plan extraction still incomplete.', created_at: '2026-03-19T10:00:00.000Z' }],
          },
        ],
      },
      {
        id: 'demo-group-4',
        name: 'Submitted',
        className: 'submitted',
        tasks: [
          {
            id: 'demo-task-5',
            group_id: 'demo-group-4',
            title: 'Sample Completed Job',
            status: 'Submitted',
            priority: 'Low',
            assessor: 'Allan',
            due_date: '2026-03-18',
            qa_status: 'Passed',
            magicplan_status: 'Yes',
            issues: [],
            notes: 'Ready for archive.',
            comments: [],
          },
        ],
      },
    ],
  },
];

function normalizeColumnType(type) {
  return ['text', 'number', 'date', 'select', 'status', 'multi_select', 'progress', 'formula'].includes(type) ? type : 'text';
}

function normalizeProgressLinks(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return { columnId: item, label: item };
      }

      const columnId = item?.columnId || item?.id || '';
      if (!columnId) return null;
      return {
        columnId,
        label: item.label || columnId,
        targetValue: item.targetValue || '',
        weight: Number(item.weight) > 0 ? Number(item.weight) : 1,
      };
    })
    .filter(Boolean);
}

function normalizeFormulaConfig(value) {
  if (Array.isArray(value) && value[0]?.formula) {
    return { formula: value[0].formula };
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { formula: FORMULA_CHOICES.some((choice) => choice.value === value.formula) ? value.formula : 'days_until_due' };
  }

  return { formula: 'days_until_due' };
}


function normalizeWorkspaceViews(views) {
  if (!Array.isArray(views) || views.length === 0) return DEFAULT_WORKSPACE_VIEWS;

  return views
    .filter((view) => !view?.archivedAt && !view?.archived_at)
    .map((view, index) => ({
    id: view.id || `view-${index}-${view.type || 'main'}`,
    type: VIEW_TYPES.includes(view.type) ? view.type : 'main',
    name: view.name || DEFAULT_WORKSPACE_VIEWS.find((item) => item.type === view.type)?.name || 'View',
    locked: Boolean(view.locked),
    position: Number(view.position) || index + 1,
  }))
    .sort((left, right) => (left.position || 0) - (right.position || 0));
}


export default function HomePage() {
  const [boards, setBoards] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [commentsByTask, setCommentsByTask] = useState({});
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskGroupId, setNewTaskGroupId] = useState('');
  const [newTaskAssessor, setNewTaskAssessor] = useState('Unassigned');
  const [search, setSearch] = useState('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [usingDemoMode, setUsingDemoMode] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [customColumns, setCustomColumns] = useState([]);
  const [metricLabels, setMetricLabels] = useState(DEFAULT_METRICS);
  const [columnDraftName, setColumnDraftName] = useState('');
  const [columnDraftType, setColumnDraftType] = useState('text');
  const [columnDraftOptions, setColumnDraftOptions] = useState([]);
  const [columnDraftOptionLabel, setColumnDraftOptionLabel] = useState('');
  const [columnDraftOptionColor, setColumnDraftOptionColor] = useState(OPTION_COLORS[0]);
  const [columnDraftLinks, setColumnDraftLinks] = useState([]);
  const [columnOptionDrafts, setColumnOptionDrafts] = useState({});
  const [taskMeta, setTaskMeta] = useState({});
  const [assessors, setAssessors] = useState([]);
  const [archivedBoards, setArchivedBoards] = useState([]);
  const [archivedGroupsByBoard, setArchivedGroupsByBoard] = useState({});
  const [archivedWorkspaceViewsByBoard, setArchivedWorkspaceViewsByBoard] = useState({});
  const [archivedSavedViewsByBoard, setArchivedSavedViewsByBoard] = useState({});
  const [archivedPeopleByBoard, setArchivedPeopleByBoard] = useState({});
  const [archivedAutomationsByBoard, setArchivedAutomationsByBoard] = useState({});
  const [archivedTemplatesByBoard, setArchivedTemplatesByBoard] = useState({});
  const [assessorDraftName, setAssessorDraftName] = useState('');
  const [assessorDraftRole, setAssessorDraftRole] = useState('Assessor');
  const [assessorFilter, setAssessorFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [qaFilter, setQaFilter] = useState('All');
  const [savedViews, setSavedViews] = useState([]);
  const [viewDraftName, setViewDraftName] = useState('');
  const [selectedViewId, setSelectedViewId] = useState(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [boardNameDraft, setBoardNameDraft] = useState('');
  const [pendingColumnDeleteId, setPendingColumnDeleteId] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [pendingGroupDeleteId, setPendingGroupDeleteId] = useState(null);
  const [pendingGroupPermanentDeleteId, setPendingGroupPermanentDeleteId] = useState(null);
  const [pendingWorkspaceViewArchiveId, setPendingWorkspaceViewArchiveId] = useState(null);
  const [pendingWorkspaceViewDeleteId, setPendingWorkspaceViewDeleteId] = useState(null);
  const [pendingAssessorArchiveId, setPendingAssessorArchiveId] = useState(null);
  const [pendingAssessorDeleteId, setPendingAssessorDeleteId] = useState(null);
  const [pendingAutomationArchiveId, setPendingAutomationArchiveId] = useState(null);
  const [pendingAutomationDeleteId, setPendingAutomationDeleteId] = useState(null);
  const [pendingTemplateArchiveId, setPendingTemplateArchiveId] = useState(null);
  const [pendingTemplateDeleteId, setPendingTemplateDeleteId] = useState(null);
  const [columnWidths, setColumnWidths] = useState({});
  const [showInlineColumnCreator, setShowInlineColumnCreator] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('board');
  const [activeArchiveTab, setActiveArchiveTab] = useState('views');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [sortMode, setSortMode] = useState('manual');
  const [groupBy, setGroupBy] = useState('stage');
  const [hideEmptyGroups, setHideEmptyGroups] = useState(false);
  const [activeBoardView, setActiveBoardView] = useState('main');
  const [hiddenColumnIds, setHiddenColumnIds] = useState([]);
  const [draggedColumnId, setDraggedColumnId] = useState(null);
  const [columnOrder, setColumnOrder] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [compactMode, setCompactMode] = useState(false);
  const [themeMode, setThemeMode] = useState('balanced');
  const [workspaceViewsByBoard, setWorkspaceViewsByBoard] = useState({});
  const [newWorkspaceViewName, setNewWorkspaceViewName] = useState('');
  const [newWorkspaceViewType, setNewWorkspaceViewType] = useState('main');
  const [automationRulesByBoard, setAutomationRulesByBoard] = useState({});
  const [reminderRulesByBoard, setReminderRulesByBoard] = useState({});
  const [automationDraftName, setAutomationDraftName] = useState('');
  const [automationDraftTrigger, setAutomationDraftTrigger] = useState('field_equals');
  const [automationDraftField, setAutomationDraftField] = useState('status');
  const [automationDraftValue, setAutomationDraftValue] = useState('');
  const [automationDraftAction, setAutomationDraftAction] = useState('notify');
  const [automationDraftActionValue, setAutomationDraftActionValue] = useState('');
  const [templatesByBoard, setTemplatesByBoard] = useState({});
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentRole, setCurrentRole] = useState('Admin');
  const [authSession, setAuthSession] = useState(null);
  const [authEmailDraft, setAuthEmailDraft] = useState('');
  const [authStatusText, setAuthStatusText] = useState('');
  const [inviteTokenFromUrl, setInviteTokenFromUrl] = useState('');
  const [profilesById, setProfilesById] = useState({});
  const [boardMembershipsByBoard, setBoardMembershipsByBoard] = useState({});
  const [boardInvitesByBoard, setBoardInvitesByBoard] = useState({});
  const [membershipDraftUserId, setMembershipDraftUserId] = useState('');
  const [membershipDraftRole, setMembershipDraftRole] = useState('Viewer');
  const [inviteDraftEmail, setInviteDraftEmail] = useState('');
  const [inviteDraftRole, setInviteDraftRole] = useState('Viewer');
  const [notificationChannelsByBoard, setNotificationChannelsByBoard] = useState({});
  const [channelDraftType, setChannelDraftType] = useState('email');
  const [channelDraftLabel, setChannelDraftLabel] = useState('');
  const [channelDraftTarget, setChannelDraftTarget] = useState('');
  const [channelDraftUrl, setChannelDraftUrl] = useState('');
  const [templateDraftName, setTemplateDraftName] = useState('');
  const [templateDraftCategory, setTemplateDraftCategory] = useState('General');
  const [templateDraftGroupId, setTemplateDraftGroupId] = useState('');
  const [templateDraftAssessor, setTemplateDraftAssessor] = useState('Unassigned');
  const [templateDraftPriority, setTemplateDraftPriority] = useState('Medium');
  const [templateDraftQaStatus, setTemplateDraftQaStatus] = useState('Pending');
  const [templateDraftMagicplan, setTemplateDraftMagicplan] = useState('No');
  const [templateDraftNotes, setTemplateDraftNotes] = useState('');
  const [templateDraftIssues, setTemplateDraftIssues] = useState('');
  const [templateDraftCustomFields, setTemplateDraftCustomFields] = useState({});
  const [localStateHydrated, setLocalStateHydrated] = useState(false);
  const [boardPermissionsByBoard, setBoardPermissionsByBoard] = useState({});
  const [uploadCategory, setUploadCategory] = useState('General');
  const [formulaDraftType, setFormulaDraftType] = useState('days_until_due');
  const searchInputRef = useRef(null);
  const quickAddInputRef = useRef(null);
  const activeResizeRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setInviteTokenFromUrl(params.get('invite') || '');
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setAuthSession(data.session || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session || null);
    });

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!authSession?.user || !supabase) return;

    const user = authSession.user;
    supabase.from('user_profiles').upsert({
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email || '',
      role_name: profilesById[user.id]?.role_name || 'Viewer',
    }, { onConflict: 'id' }).then(({ error }) => {
      if (error) setErrorText(error.message);
    });
  }, [authSession, profilesById]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMetricLabels({ ...DEFAULT_METRICS, ...safeParse(window.localStorage.getItem(METRIC_LABELS_KEY), {}) });
    setTaskMeta(safeParse(window.localStorage.getItem(TASK_META_KEY), {}));
    setAssessors(safeParse(window.localStorage.getItem(ASSESSORS_KEY), []));
    setSavedViews(safeParse(window.localStorage.getItem(SAVED_VIEWS_KEY), []));
    setColumnWidths(safeParse(window.localStorage.getItem(COLUMN_WIDTHS_KEY), {}));
    setHiddenColumnIds(safeParse(window.localStorage.getItem(HIDDEN_COLUMNS_KEY), []));
    setColumnOrder(safeParse(window.localStorage.getItem(COLUMN_ORDER_KEY), []));
    setCompactMode(Boolean(safeParse(window.localStorage.getItem(COMPACT_MODE_KEY), false)));
    setThemeMode('balanced');
    setWorkspaceViewsByBoard(safeParse(window.localStorage.getItem(WORKSPACE_VIEWS_KEY), {}));
    setAutomationRulesByBoard(safeParse(window.localStorage.getItem(AUTOMATIONS_KEY), {}));
    setArchivedAutomationsByBoard(safeParse(window.localStorage.getItem(ARCHIVED_AUTOMATIONS_KEY), {}));
    setReminderRulesByBoard(safeParse(window.localStorage.getItem(REMINDER_RULES_KEY), {}));
    setTemplatesByBoard(safeParse(window.localStorage.getItem(TEMPLATES_KEY), {}));
    setArchivedTemplatesByBoard(safeParse(window.localStorage.getItem(ARCHIVED_TEMPLATES_KEY), {}));
    setNotifications(safeParse(window.localStorage.getItem(NOTIFICATIONS_KEY), []));
    setCurrentRole(safeParse(window.localStorage.getItem(CURRENT_ROLE_KEY), 'Admin'));
    setBoardPermissionsByBoard(safeParse(window.localStorage.getItem(BOARD_PERMISSIONS_KEY), {}));
    setLocalStateHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(customColumns));
  }, [customColumns]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(METRIC_LABELS_KEY, JSON.stringify(metricLabels));
  }, [metricLabels]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TASK_META_KEY, JSON.stringify(taskMeta));
  }, [taskMeta]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ASSESSORS_KEY, JSON.stringify(assessors));
  }, [assessors]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(savedViews));
  }, [savedViews]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStateHydrated) return;
    window.localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(columnWidths));
  }, [columnWidths, localStateHydrated]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(HIDDEN_COLUMNS_KEY, JSON.stringify(hiddenColumnIds));
  }, [hiddenColumnIds]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(columnOrder));
  }, [columnOrder]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(COMPACT_MODE_KEY, JSON.stringify(compactMode));
  }, [compactMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(THEME_MODE_KEY, JSON.stringify(themeMode));
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(WORKSPACE_VIEWS_KEY, JSON.stringify(workspaceViewsByBoard));
  }, [workspaceViewsByBoard]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AUTOMATIONS_KEY, JSON.stringify(automationRulesByBoard));
  }, [automationRulesByBoard]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ARCHIVED_AUTOMATIONS_KEY, JSON.stringify(archivedAutomationsByBoard));
  }, [archivedAutomationsByBoard]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(REMINDER_RULES_KEY, JSON.stringify(reminderRulesByBoard));
  }, [reminderRulesByBoard]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templatesByBoard));
  }, [templatesByBoard]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ARCHIVED_TEMPLATES_KEY, JSON.stringify(archivedTemplatesByBoard));
  }, [archivedTemplatesByBoard]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CURRENT_ROLE_KEY, JSON.stringify(currentRole));
  }, [currentRole]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(BOARD_PERMISSIONS_KEY, JSON.stringify(boardPermissionsByBoard));
  }, [boardPermissionsByBoard]);

  useEffect(() => {
    function handlePointerMove(event) {
      const resizeState = activeResizeRef.current;
      if (!resizeState) return;

      const { columnId, startX, startWidth } = resizeState;
      const nextWidth = Math.max(
        columnId === 'item' ? 320 : 120,
        Math.min(520, startWidth + (event.clientX - startX)),
      );

      setColumnWidths((prev) => ({
        ...prev,
        [columnId]: nextWidth,
      }));
    }

    function handlePointerUp() {
      activeResizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  useEffect(() => {
    if (!selectedBoardId) return;
    setWorkspaceViewsByBoard((prev) => (
      prev[selectedBoardId]
        ? prev
        : { ...prev, [selectedBoardId]: DEFAULT_WORKSPACE_VIEWS }
    ));
  }, [selectedBoardId]);

  useEffect(() => {
    setSelectedTaskIds((prev) => prev.filter((taskId) => tasks.some((task) => task.id === taskId && !task.archived_at)));
  }, [tasks]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    if (selectedTask) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [selectedTask]);

  useEffect(() => {
    if (!selectedViewId) return;
    const activeView = savedViews.find((view) => view.id === selectedViewId);
    if (!activeView) {
      setSelectedViewId(null);
      return;
    }

    const hasChanged = activeView.search !== search
      || activeView.assessorFilter !== assessorFilter
      || activeView.priorityFilter !== priorityFilter
      || activeView.qaFilter !== qaFilter
      || activeView.boardId !== selectedBoardId;

    if (hasChanged) setSelectedViewId(null);
  }, [assessorFilter, priorityFilter, qaFilter, savedViews, search, selectedBoardId, selectedViewId]);

  async function loadData() {
    setLoading(true);
    setErrorText('');

    const storedColumns = typeof window === 'undefined' ? [] : safeParse(window.localStorage.getItem(CUSTOM_COLUMNS_KEY), []);
    const storedViews = typeof window === 'undefined' ? [] : safeParse(window.localStorage.getItem(SAVED_VIEWS_KEY), []);
    const storedAssessors = typeof window === 'undefined' ? [] : safeParse(window.localStorage.getItem(ASSESSORS_KEY), []);
    const storedWorkspaceViews = typeof window === 'undefined' ? {} : safeParse(window.localStorage.getItem(WORKSPACE_VIEWS_KEY), {});
    const storedAutomations = typeof window === 'undefined' ? {} : safeParse(window.localStorage.getItem(AUTOMATIONS_KEY), {});
    const storedTemplates = typeof window === 'undefined' ? {} : safeParse(window.localStorage.getItem(TEMPLATES_KEY), {});
    const storedNotifications = typeof window === 'undefined' ? [] : safeParse(window.localStorage.getItem(NOTIFICATIONS_KEY), []);
    const storedBoardPermissions = typeof window === 'undefined' ? {} : safeParse(window.localStorage.getItem(BOARD_PERMISSIONS_KEY), {});

    if (!isSupabaseConfigured || !supabase) {
      setCustomColumns(storedColumns);
      setSavedViews(storedViews);
      loadDemoData();
      return;
    }

    try {
      const [
        { data: boardRows, error: boardError },
        { data: groupRows, error: groupError },
        { data: taskRows, error: taskError },
        { data: commentRows, error: commentError },
        { data: boardColumnRows, error: boardColumnError },
        { data: taskColumnValueRows, error: taskColumnValueError },
        { data: boardViewRows, error: boardViewError },
        { data: workspaceViewRows, error: workspaceViewError },
        { data: boardPeopleRows, error: boardPeopleError },
        { data: attachmentRows, error: attachmentError },
        { data: automationRows, error: automationError },
        { data: activityRows, error: activityError },
        { data: dependencyRows, error: dependencyError },
        { data: timeEntryRows, error: timeEntryError },
        { data: templateRows, error: templateError },
        { data: notificationRows, error: notificationError },
        { data: boardPermissionRows, error: boardPermissionError },
        { data: profileRows, error: profileError },
        { data: membershipRows, error: membershipError },
        { data: channelRows, error: channelError },
        { data: inviteRows, error: inviteError },
      ] = await Promise.all([
        supabase.from('boards').select('*').order('position', { ascending: true }).order('name', { ascending: true }),
        supabase.from('groups').select('*').order('position', { ascending: true }).order('name', { ascending: true }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('comments').select('*').order('created_at', { ascending: true }),
        supabase.from('board_columns').select('*').order('position', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('task_column_values').select('*').order('created_at', { ascending: true }),
        supabase.from('board_views').select('*').order('created_at', { ascending: true }),
        supabase.from('workspace_views').select('*').order('position', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('board_people').select('*').order('created_at', { ascending: true }),
        supabase.from('task_attachments').select('*').order('created_at', { ascending: true }),
        supabase.from('automation_rules').select('*').order('created_at', { ascending: true }),
        supabase.from('task_activities').select('*').order('created_at', { ascending: false }),
        supabase.from('task_dependencies').select('*').order('created_at', { ascending: true }),
        supabase.from('task_time_entries').select('*').order('created_at', { ascending: false }),
        supabase.from('task_templates').select('*').order('created_at', { ascending: true }),
        supabase.from('board_notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('board_permissions').select('*').order('created_at', { ascending: true }),
        supabase.from('user_profiles').select('*').order('created_at', { ascending: true }),
        supabase.from('board_memberships').select('*').order('created_at', { ascending: true }),
        supabase.from('notification_channels').select('*').order('created_at', { ascending: true }),
        supabase.from('board_invites').select('*').order('created_at', { ascending: false }),
      ]);

      if (boardError || groupError || taskError || commentError || boardColumnError || taskColumnValueError || boardViewError) {
        throw new Error(
          boardError?.message
          || groupError?.message
          || taskError?.message
          || commentError?.message
          || boardColumnError?.message
          || taskColumnValueError?.message
          || boardViewError?.message
          || 'Failed to load data.',
        );
      }

      const optionalErrors = [
        workspaceViewError && 'workspace views',
        boardPeopleError && 'people',
        attachmentError && 'files',
        automationError && 'automations',
        activityError && 'activity history',
        dependencyError && 'dependencies',
        timeEntryError && 'time tracking',
        templateError && 'templates',
        notificationError && 'notifications',
        boardPermissionError && 'permissions',
        profileError && 'accounts',
        membershipError && 'board memberships',
        channelError && 'channels',
        inviteError && 'invites',
      ].filter(Boolean);

      if (optionalErrors.length) {
        setErrorText(`Some advanced features are using local fallback: ${optionalErrors.join(', ')}. Run the latest Supabase schema to fully enable them.`);
      }

      if (!boardRows?.length) {
        setCustomColumns(storedColumns);
        setSavedViews(storedViews);
        loadDemoData();
        return;
      }

      const allNonLegacyBoards = (boardRows || []).filter((board) => board.name !== 'Assessor Performance');
      const activeBoards = allNonLegacyBoards.filter((board) => !board.archived_at);
      const archivedBoardRows = allNonLegacyBoards.filter((board) => board.archived_at);
      const activeBoardIds = new Set(activeBoards.map((board) => board.id));
      const activeGroups = (groupRows || []).filter((group) => activeBoardIds.has(group.board_id) && !group.archived_at);
      const activeGroupIds = new Set(activeGroups.map((group) => group.id));
      const activeTasks = (taskRows || []).filter((task) => activeGroupIds.has(task.group_id));
      const activeTaskIds = new Set(activeTasks.map((task) => task.id));
      const activeComments = (commentRows || []).filter((comment) => activeTaskIds.has(comment.task_id));
      const activeBoardColumns = (boardColumnRows || []).filter((column) => activeBoardIds.has(column.board_id));
      const activeBoardViews = (boardViewRows || []).filter((view) => activeBoardIds.has(view.board_id) && !view.archived_at);
      const archivedSavedViews = (boardViewRows || []).filter((view) => activeBoardIds.has(view.board_id) && view.archived_at);
      const effectiveWorkspaceViewRows = workspaceViewError ? [] : (workspaceViewRows || []);
      const effectiveBoardPeopleRows = boardPeopleError ? [] : (boardPeopleRows || []);
      const effectiveAttachmentRows = attachmentError ? [] : (attachmentRows || []);
      const effectiveAutomationRows = automationError ? [] : (automationRows || []);
      const effectiveActivityRows = activityError ? [] : (activityRows || []);
      const effectiveDependencyRows = dependencyError ? [] : (dependencyRows || []);
      const effectiveTimeEntryRows = timeEntryError ? [] : (timeEntryRows || []);
      const effectiveTemplateRows = templateError ? [] : (templateRows || []);
      const effectiveNotificationRows = notificationError ? [] : (notificationRows || []);
      const effectiveBoardPermissionRows = boardPermissionError ? [] : (boardPermissionRows || []);
      const effectiveProfileRows = profileError ? [] : (profileRows || []);
      const effectiveMembershipRows = membershipError ? [] : (membershipRows || []);
      const effectiveChannelRows = channelError ? [] : (channelRows || []);
      const effectiveInviteRows = inviteError ? [] : (inviteRows || []);

      const activeWorkspaceViews = effectiveWorkspaceViewRows.filter((view) => activeBoardIds.has(view.board_id) && !view.archived_at);
      const archivedWorkspaceViews = effectiveWorkspaceViewRows.filter((view) => activeBoardIds.has(view.board_id) && view.archived_at);
      const activeBoardPeople = effectiveBoardPeopleRows.filter((person) => activeBoardIds.has(person.board_id) && !person.archived_at);
      const archivedBoardPeople = effectiveBoardPeopleRows.filter((person) => activeBoardIds.has(person.board_id) && person.archived_at);
      const archivedGroups = (groupRows || []).filter((group) => activeBoardIds.has(group.board_id) && group.archived_at);
      const activeAttachments = effectiveAttachmentRows.filter((attachment) => activeTaskIds.has(attachment.task_id));
      const activeAutomations = effectiveAutomationRows.filter((rule) => activeBoardIds.has(rule.board_id) && !rule.archived_at);
      const archivedAutomations = effectiveAutomationRows.filter((rule) => activeBoardIds.has(rule.board_id) && rule.archived_at);
      const activeActivities = effectiveActivityRows.filter((activity) => activeTaskIds.has(activity.task_id));
      const activeDependencies = effectiveDependencyRows.filter((dependency) => activeTaskIds.has(dependency.task_id));
      const activeTimeEntries = effectiveTimeEntryRows.filter((entry) => activeTaskIds.has(entry.task_id));
      const activeTemplates = effectiveTemplateRows.filter((template) => activeBoardIds.has(template.board_id) && !template.archived_at);
      const archivedTemplates = effectiveTemplateRows.filter((template) => activeBoardIds.has(template.board_id) && template.archived_at);
      const activeNotifications = effectiveNotificationRows.filter((notification) => activeBoardIds.has(notification.board_id));
      const activeBoardPermissions = effectiveBoardPermissionRows.filter((permission) => activeBoardIds.has(permission.board_id));

      const commentMap = {};
      for (const comment of activeComments) {
        commentMap[comment.task_id] = [...(commentMap[comment.task_id] || []), comment];
      }

      const mappedColumns = activeBoardColumns.map((column) => ({
        id: column.id,
        boardId: column.board_id,
        name: column.name,
        type: normalizeColumnType(column.column_type),
        options: normalizeColumnType(column.column_type) === 'progress'
          ? normalizeProgressLinks(column.options_json)
          : normalizeColumnType(column.column_type) === 'formula'
            ? normalizeFormulaConfig(column.options_json)
            : normalizeColumnOptions(column.options_json),
        position: column.position || 0,
      }));

      const mappedViews = activeBoardViews.map((view) => ({
        id: view.id,
        boardId: view.board_id,
        name: view.name,
        search: view.search_text || '',
        assessorFilter: view.assessor_filter || 'All',
        priorityFilter: view.priority_filter || 'All',
        qaFilter: view.qa_filter || 'All',
      }));

      const mappedWorkspaceViewsByBoard = {};
      for (const boardId of activeBoardIds) {
        mappedWorkspaceViewsByBoard[boardId] = normalizeWorkspaceViews(
          activeWorkspaceViews
            .filter((view) => view.board_id === boardId)
            .map((view) => ({
              id: view.id,
              boardId: view.board_id,
              name: view.name,
              type: view.view_type || 'main',
              locked: Boolean(view.locked),
              position: view.position || 0,
              archived_at: view.archived_at,
            })),
        );
      }

      const mappedArchivedWorkspaceViewsByBoard = {};
      for (const boardId of activeBoardIds) {
        mappedArchivedWorkspaceViewsByBoard[boardId] = archivedWorkspaceViews
          .filter((view) => view.board_id === boardId)
          .map((view) => ({
            id: view.id,
            boardId: view.board_id,
            name: view.name,
            type: view.view_type || 'main',
            locked: Boolean(view.locked),
            position: view.position || 0,
            archived_at: view.archived_at,
          }))
          .sort((left, right) => (left.position || 0) - (right.position || 0));
      }

      const mappedArchivedSavedViewsByBoard = {};
      for (const boardId of activeBoardIds) {
        mappedArchivedSavedViewsByBoard[boardId] = archivedSavedViews
          .filter((view) => view.board_id === boardId)
          .map((view) => ({
            id: view.id,
            boardId: view.board_id,
            name: view.name,
            search: view.search_text || '',
            assessorFilter: view.assessor_filter || 'All',
            priorityFilter: view.priority_filter || 'All',
            qaFilter: view.qa_filter || 'All',
            archived_at: view.archived_at,
          }));
      }

      const mappedArchivedGroupsByBoard = {};
      for (const boardId of activeBoardIds) {
        mappedArchivedGroupsByBoard[boardId] = archivedGroups
          .filter((group) => group.board_id === boardId)
          .sort((left, right) => (left.position || 0) - (right.position || 0));
      }

      const mappedArchivedPeopleByBoard = {};
      for (const boardId of activeBoardIds) {
        mappedArchivedPeopleByBoard[boardId] = archivedBoardPeople
          .filter((person) => person.board_id === boardId)
          .map((person) => ({
            id: person.id,
            boardId: person.board_id,
            name: person.name,
            role: person.role || 'Assessor',
            archived_at: person.archived_at,
          }));
      }

      const columnValuesByTask = {};
      for (const row of taskColumnValueRows || []) {
        if (!activeTaskIds.has(row.task_id)) continue;
        columnValuesByTask[row.task_id] = {
          ...(columnValuesByTask[row.task_id] || {}),
          [row.board_column_id]: parseStoredColumnValue(row.value_text || ''),
        };
      }

      const attachmentsByTask = {};
      for (const attachment of activeAttachments) {
        attachmentsByTask[attachment.task_id] = [
          ...(attachmentsByTask[attachment.task_id] || []),
          {
            id: attachment.id,
          name: attachment.file_name,
          path: attachment.file_path,
          url: attachment.file_url,
          size: attachment.file_size || 0,
          contentType: attachment.content_type || '',
          category: attachment.category || 'General',
          uploadedAt: attachment.created_at,
        },
      ];
      }

      const activitiesByTask = {};
      for (const activity of activeActivities) {
        activitiesByTask[activity.task_id] = [
          ...(activitiesByTask[activity.task_id] || []),
          {
            id: activity.id,
            type: activity.activity_type || 'update',
            title: activity.title,
            description: activity.description || '',
            created_at: activity.created_at,
          },
        ];
      }

      const dependenciesByTask = {};
      for (const dependency of activeDependencies) {
        dependenciesByTask[dependency.task_id] = [
          ...(dependenciesByTask[dependency.task_id] || []),
          dependency.depends_on_task_id,
        ];
      }

      const timeEntriesByTask = {};
      for (const entry of activeTimeEntries) {
        timeEntriesByTask[entry.task_id] = [
          ...(timeEntriesByTask[entry.task_id] || []),
          {
            id: entry.id,
            startedAt: entry.started_at,
            endedAt: entry.ended_at,
            minutes: entry.minutes || 0,
          },
        ];
      }

      const mappedAutomationsByBoard = {};
      for (const rule of activeAutomations) {
        mappedAutomationsByBoard[rule.board_id] = [
          ...(mappedAutomationsByBoard[rule.board_id] || []),
          {
            id: rule.id,
            name: rule.name,
            trigger: rule.trigger_type || 'field_equals',
            field: rule.trigger_field || '',
            value: rule.trigger_value || '',
            action: rule.action_type || 'notify',
            actionValue: rule.action_value || '',
          },
        ];
      }

      const mappedArchivedAutomationsByBoard = {};
      for (const rule of archivedAutomations) {
        mappedArchivedAutomationsByBoard[rule.board_id] = [
          ...(mappedArchivedAutomationsByBoard[rule.board_id] || []),
          {
            id: rule.id,
            name: rule.name,
            trigger: rule.trigger_type || 'field_equals',
            field: rule.trigger_field || '',
            value: rule.trigger_value || '',
            action: rule.action_type || 'notify',
            actionValue: rule.action_value || '',
            archived_at: rule.archived_at,
          },
        ];
      }

      const mappedTemplatesByBoard = {};
      for (const template of activeTemplates) {
        mappedTemplatesByBoard[template.board_id] = [
          ...(mappedTemplatesByBoard[template.board_id] || []),
          {
            id: template.id,
            name: template.name,
            category: template.category || template.payload_json?.category || 'General',
            fields: template.payload_json?.fields || {},
            customFields: template.payload_json?.customFields || {},
          },
        ];
      }

      const mappedArchivedTemplatesByBoard = {};
      for (const template of archivedTemplates) {
        mappedArchivedTemplatesByBoard[template.board_id] = [
          ...(mappedArchivedTemplatesByBoard[template.board_id] || []),
          {
            id: template.id,
            name: template.name,
            category: template.category || template.payload_json?.category || 'General',
            fields: template.payload_json?.fields || {},
            customFields: template.payload_json?.customFields || {},
            archived_at: template.archived_at,
          },
        ];
      }

      const mappedNotifications = activeNotifications.map((notification) => ({
        id: notification.id,
        boardId: notification.board_id,
        title: notification.title,
        body: notification.body || '',
        type: notification.notification_type || 'info',
        dedupeKey: notification.dedupe_key || null,
        read: Boolean(notification.is_read),
        created_at: notification.created_at,
      }));

      const mappedBoardPermissionsByBoard = {};
      for (const permission of activeBoardPermissions) {
        mappedBoardPermissionsByBoard[permission.board_id] = [
          ...(mappedBoardPermissionsByBoard[permission.board_id] || []),
          {
            id: permission.id,
            role_name: permission.role_name,
            can_manage_structure: Boolean(permission.can_manage_structure),
            can_edit_deals: Boolean(permission.can_edit_deals),
            can_delete_deals: Boolean(permission.can_delete_deals),
          },
        ];
      }

      for (const board of activeBoards) {
        if (!mappedBoardPermissionsByBoard[board.id] || mappedBoardPermissionsByBoard[board.id].length === 0) {
          mappedBoardPermissionsByBoard[board.id] = DEFAULT_BOARD_PERMISSIONS.map((permission, index) => ({
            id: `local-permission-${board.id}-${index}`,
            ...permission,
          }));
        }
      }

      const mappedProfilesById = Object.fromEntries(
        effectiveProfileRows.map((profile) => [profile.id, profile]),
      );

      const mappedBoardMembershipsByBoard = {};
      for (const membership of effectiveMembershipRows) {
        if (!activeBoardIds.has(membership.board_id)) continue;
        mappedBoardMembershipsByBoard[membership.board_id] = [
          ...(mappedBoardMembershipsByBoard[membership.board_id] || []),
          membership,
        ];
      }

      const mappedNotificationChannelsByBoard = {};
      for (const channel of effectiveChannelRows) {
        if (!activeBoardIds.has(channel.board_id)) continue;
        mappedNotificationChannelsByBoard[channel.board_id] = [
          ...(mappedNotificationChannelsByBoard[channel.board_id] || []),
          {
            id: channel.id,
            boardId: channel.board_id,
            type: channel.channel_type || 'email',
            label: channel.channel_label || '',
            target: channel.target || '',
            deliveryUrl: channel.delivery_url || '',
            enabled: channel.enabled !== false,
          },
        ];
      }

      const mappedBoardInvitesByBoard = {};
      for (const invite of effectiveInviteRows) {
        if (!activeBoardIds.has(invite.board_id)) continue;
        mappedBoardInvitesByBoard[invite.board_id] = [
          ...(mappedBoardInvitesByBoard[invite.board_id] || []),
          invite,
        ];
      }

      setBoards(activeBoards);
      setArchivedBoards(archivedBoardRows);
      setGroups(activeGroups);
      setTasks(activeTasks);
      setAssessors(
        boardPeopleError
          ? storedAssessors
          : activeBoardPeople.map((person) => ({
            id: person.id,
            boardId: person.board_id,
            name: person.name,
            role: person.role || 'Assessor',
            archived_at: person.archived_at,
          })),
      );
      setCommentsByTask(commentMap);
      setCustomColumns(mappedColumns);
      setSavedViews(mappedViews);
      setWorkspaceViewsByBoard((prev) => ({
        ...prev,
        ...(workspaceViewError ? storedWorkspaceViews : {}),
        ...mappedWorkspaceViewsByBoard,
      }));
      setArchivedWorkspaceViewsByBoard(mappedArchivedWorkspaceViewsByBoard);
      setArchivedSavedViewsByBoard(mappedArchivedSavedViewsByBoard);
      setArchivedGroupsByBoard(mappedArchivedGroupsByBoard);
      setArchivedPeopleByBoard(mappedArchivedPeopleByBoard);
      setArchivedAutomationsByBoard(automationError ? safeParse(window.localStorage.getItem(ARCHIVED_AUTOMATIONS_KEY), {}) : mappedArchivedAutomationsByBoard);
      setArchivedTemplatesByBoard(templateError ? safeParse(window.localStorage.getItem(ARCHIVED_TEMPLATES_KEY), {}) : mappedArchivedTemplatesByBoard);
      setAutomationRulesByBoard(automationError ? storedAutomations : mappedAutomationsByBoard);
      setTemplatesByBoard(templateError ? storedTemplates : mappedTemplatesByBoard);
      setNotifications(notificationError ? storedNotifications : mappedNotifications);
      setBoardPermissionsByBoard(boardPermissionError ? storedBoardPermissions : mappedBoardPermissionsByBoard);
      setProfilesById(mappedProfilesById);
      setBoardMembershipsByBoard(mappedBoardMembershipsByBoard);
      setNotificationChannelsByBoard(mappedNotificationChannelsByBoard);
      setBoardInvitesByBoard(mappedBoardInvitesByBoard);
      setTaskMeta((prev) => {
        const next = { ...prev };
        for (const task of activeTasks) {
          next[task.id] = {
            ...(next[task.id] || { attachments: [] }),
            customFields: columnValuesByTask[task.id] || {},
            attachments: attachmentsByTask[task.id] || [],
            activity: activitiesByTask[task.id] || [],
            dependencies: dependenciesByTask[task.id] || [],
            timeEntries: timeEntriesByTask[task.id] || [],
          };
        }
        return next;
      });
      setSelectedBoardId((prev) => activeBoards.some((board) => board.id === prev) ? prev : activeBoards[0]?.id || null);
      setUsingDemoMode(false);
    } catch (error) {
      setErrorText(error.message || 'Unable to load Supabase data. Showing demo data instead.');
      setCustomColumns(storedColumns);
      setSavedViews(storedViews);
      loadDemoData();
      return;
    }

    setLoading(false);
  }

  function loadDemoData() {
    const boardRows = demoBoards.map(({ id, name, description }) => ({ id, name, description }));
    const groupRows = demoBoards.flatMap((board) => board.groups.map((group, index) => ({
      id: group.id,
      board_id: board.id,
      name: group.name,
      ui_class: group.className,
      position: index + 1,
    })));
      const taskRows = demoBoards.flatMap((board) => board.groups.flatMap((group) => group.tasks.map((task) => ({ ...task }))));
    const commentMap = {};

    for (const task of taskRows) commentMap[task.id] = task.comments || [];

    setBoards(boardRows);
    setGroups(groupRows);
    setTasks(taskRows);
    setCommentsByTask(commentMap);
    setSelectedBoardId((prev) => boardRows.some((board) => board.id === prev) ? prev : boardRows[0]?.id || null);
    setUsingDemoMode(true);
    setLoading(false);
  }

  const deferredSearch = useDeferredValue(search);
  const authUser = authSession?.user || null;
  const {
    selectedBoard,
    boardGroups,
    boardColumns,
    allColumns,
    visibleColumns,
    boardSavedViews,
    currentBoardViews,
    archivedCurrentWorkspaceViews,
    archivedCurrentSavedViews,
    archivedCurrentGroups,
    archivedCurrentPeople,
    currentWorkspaceView,
    boardAutomations,
    archivedCurrentAutomations,
    boardReminderRules,
    boardTemplates,
    archivedCurrentTemplates,
    boardPermissions,
    currentProfile,
    knownProfiles,
    currentBoardMembership,
    boardNotificationChannels,
    boardMemberships,
    availableMembershipProfiles,
    boardInvites,
  } = useBoardScopedState({
    boards,
    selectedBoardId,
    groups,
    customColumns,
    columnOrder,
    hiddenColumnIds,
    savedViews,
    workspaceViewsByBoard,
    normalizeWorkspaceViews,
    defaultWorkspaceViews: DEFAULT_WORKSPACE_VIEWS,
    archivedWorkspaceViewsByBoard,
    archivedSavedViewsByBoard,
    archivedGroupsByBoard,
    archivedPeopleByBoard,
    activeBoardView,
    automationRulesByBoard,
    archivedAutomationsByBoard,
    reminderRulesByBoard,
    defaultReminderRules: DEFAULT_REMINDER_RULES,
    templatesByBoard,
    archivedTemplatesByBoard,
    boardPermissionsByBoard,
    roleOptions: ROLE_OPTIONS,
    defaultBoardPermissions: DEFAULT_BOARD_PERMISSIONS,
    authUser,
    profilesById,
    boardMembershipsByBoard,
    notificationChannelsByBoard,
    boardInvitesByBoard,
    baseColumns: BASE_COLUMNS,
  });

  useEffect(() => {
    setBoardNameDraft(selectedBoard?.name || '');
  }, [selectedBoard?.id, selectedBoard?.name]);

  const activeRoleName = currentBoardMembership?.role_name || currentRole || currentProfile?.role_name || 'Admin';

  const boardGroupIds = useMemo(
    () => new Set(boardGroups.map((group) => group.id)),
    [boardGroups],
  );

  const boardGroupNameById = useMemo(
    () => Object.fromEntries(boardGroups.map((group) => [group.id, group.name])),
    [boardGroups],
  );

  const inviteTokenMatch = useMemo(() => {
    if (!inviteTokenFromUrl) return null;
    for (const [boardId, invites] of Object.entries(boardInvitesByBoard)) {
      const match = (invites || []).find((invite) => invite.invite_token === inviteTokenFromUrl && invite.status !== 'accepted');
      if (match) return { ...match, board_id: match.board_id || boardId };
    }
    return null;
  }, [boardInvitesByBoard, inviteTokenFromUrl]);

  useEffect(() => {
    if (!currentBoardViews.some((view) => view.id === activeBoardView)) {
      setActiveBoardView(currentBoardViews[0]?.id || 'main');
    }
  }, [activeBoardView, currentBoardViews]);

  useEffect(() => {
    if (inviteTokenMatch?.board_id && inviteTokenMatch.board_id !== selectedBoardId) {
      setSelectedBoardId(inviteTokenMatch.board_id);
    }
  }, [inviteTokenMatch, selectedBoardId]);

  useEffect(() => {
    if (!inviteTokenFromUrl) return;
    if (!inviteTokenMatch) {
      setAuthStatusText('This invite link is no longer valid or has already been accepted.');
      return;
    }
    if (!authUser) {
      setAuthStatusText(`Sign in with ${inviteTokenMatch.email} to accept the invite for ${inviteTokenMatch.role_name}.`);
      return;
    }
    if (authUser.email?.trim().toLowerCase() !== inviteTokenMatch.email?.trim().toLowerCase()) {
      setAuthStatusText(`This invite belongs to ${inviteTokenMatch.email}. Sign in with that email to accept it.`);
      return;
    }
    setAuthStatusText(`Invite ready: accept access to ${selectedBoard?.name || 'this board'} as ${inviteTokenMatch.role_name}.`);
  }, [authUser, inviteTokenFromUrl, inviteTokenMatch, selectedBoard?.name]);

  useEffect(() => {
    if (currentWorkspaceView.type === 'kanban' && groupBy !== 'stage') {
      setGroupBy('stage');
    }
  }, [currentWorkspaceView.type, groupBy]);


  function canEditBoardStructure() {
    return canManageStructure;
  }

  function canEditDeals() {
    return canEditDealsValue;
  }

  function canDeleteDeals() {
    return canDeleteDealsValue;
  }

  async function updateBoardPermission(roleName, patch) {
    if (!selectedBoardId || !canEditBoardStructure()) return;

    const defaultPermission = DEFAULT_BOARD_PERMISSIONS.find((permission) => permission.role_name === roleName);
    if (!defaultPermission) return;

    const existingPermission = boardPermissions.find((permission) => permission.role_name === roleName) || {
      id: `local-permission-${selectedBoardId}-${roleName}`,
      ...defaultPermission,
    };
    const nextPermission = {
      ...existingPermission,
      ...patch,
      role_name: roleName,
    };

    setBoardPermissionsByBoard((prev) => ({
      ...prev,
      [selectedBoardId]: ROLE_OPTIONS.map((nextRoleName, index) => {
        const currentPermission =
          (prev[selectedBoardId] || []).find((permission) => permission.role_name === nextRoleName)
          || boardPermissions.find((permission) => permission.role_name === nextRoleName)
          || {
            id: `local-permission-${selectedBoardId}-${nextRoleName}`,
            ...(DEFAULT_BOARD_PERMISSIONS.find((permission) => permission.role_name === nextRoleName) || DEFAULT_BOARD_PERMISSIONS[index]),
          };

        return nextRoleName === roleName
          ? { ...currentPermission, ...nextPermission }
          : currentPermission;
      }),
    }));

    if (usingDemoMode || !supabase) return;

    const payload = {
      board_id: selectedBoardId,
      role_name: roleName,
      can_manage_structure: Boolean(nextPermission.can_manage_structure),
      can_edit_deals: Boolean(nextPermission.can_edit_deals),
      can_delete_deals: Boolean(nextPermission.can_delete_deals),
    };

    const { data, error } = await supabase
      .from('board_permissions')
      .upsert(payload, { onConflict: 'board_id,role_name' })
      .select()
      .single();

    if (error) {
      setErrorText(error.message);
      await loadData();
      return;
    }

    if (!data) return;

    setBoardPermissionsByBoard((prev) => ({
      ...prev,
      [selectedBoardId]: (prev[selectedBoardId] || boardPermissions).map((permission) => (
        permission.role_name === roleName
          ? {
            id: data.id,
            role_name: data.role_name,
            can_manage_structure: Boolean(data.can_manage_structure),
            can_edit_deals: Boolean(data.can_edit_deals),
            can_delete_deals: Boolean(data.can_delete_deals),
          }
          : permission
      )),
    }));
  }

  function getTaskTimeEntries(task) {
    return taskMeta[task?.id || '']?.timeEntries || [];
  }

  function getTrackedMinutes(task) {
    return getTaskTimeEntries(task).reduce((sum, entry) => sum + (entry.minutes || 0), 0);
  }

  function getTaskDependencies(task) {
    return taskMeta[task?.id || '']?.dependencies || [];
  }

  async function logTaskActivity(taskId, entry) {
    const nextActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: new Date().toISOString(),
      ...entry,
    };
    patchTaskMeta(taskId, (current) => ({
      ...current,
      activity: [nextActivity, ...(current.activity || [])].slice(0, 80),
    }));

    if (usingDemoMode || !supabase) return;
    const { data, error } = await supabase.from('task_activities').insert({
      task_id: taskId,
      activity_type: nextActivity.type || 'update',
      title: nextActivity.title,
      description: nextActivity.description || '',
    }).select().single();
    if (error) {
      setErrorText(error.message);
      return;
    }

    patchTaskMeta(taskId, (current) => ({
      ...current,
      activity: (current.activity || []).map((item) => (
        item.id === nextActivity.id ? { ...item, id: data.id, created_at: data.created_at } : item
      )),
    }));
  }

  function getColumnDisplayValue(task, columnId) {
    if (BASE_COLUMNS.some((column) => column.id === columnId)) {
      const value = task[columnId];
      if (Array.isArray(value)) return value;
      return value ?? '';
    }
    return task.customFields?.[columnId];
  }

  function getCompletionValuesForColumn(columnId) {
    if (columnId === 'stage') return boardGroups.map((group) => group.name);
    if (columnId === 'priority') return ['High', 'Medium', 'Low'];
    if (columnId === 'magicplan_status') return ['No', 'Yes', 'Mixed'];
    const column = allColumns.find((item) => item.id === columnId);
    if (['select', 'status', 'multi_select'].includes(column?.type)) {
      return (column.options || []).map((option) => option.label);
    }
    return [];
  }

  function isColumnCompleteForTask(task, columnId, targetValue = '') {
    if (columnId === 'files') return (task.attachments || []).length > 0;
    if (columnId === 'updates') return (task.comments || []).length > 0;

    const value = getColumnDisplayValue(task, columnId);

    if (targetValue) {
      if (Array.isArray(value)) return value.includes(targetValue);
      return String(value || '') === String(targetValue);
    }

    if (columnId === 'assessor') return Boolean(value && value !== 'Unassigned');
    if (columnId === 'issues') return Array.isArray(value) ? value.length > 0 : Boolean(value);
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  }

  function getFormulaValue(task, column) {
    const formula = column.options?.formula || 'days_until_due';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = task.due_date ? new Date(`${task.due_date}T00:00:00`) : null;
    const dayDiff = dueDate ? Math.round((dueDate.getTime() - today.getTime()) / 86400000) : null;

    if (formula === 'days_overdue') return dayDiff == null ? '-' : Math.max(0, dayDiff * -1);
    if (formula === 'issue_count') return (task.issues || []).length;
    if (formula === 'file_count') return (task.attachments || []).length;
    if (formula === 'update_count') return (task.comments || []).length;
    if (formula === 'tracked_hours') return (getTrackedMinutes(task) / 60).toFixed(1);
    if (formula === 'progress_average') {
      const progressColumns = allColumns.filter((item) => item.type === 'progress');
      if (!progressColumns.length) return 0;
      const total = progressColumns.reduce((sum, progressColumn) => sum + getProgressForTask(task, progressColumn), 0);
      return Math.round(total / progressColumns.length);
    }

    return dayDiff == null ? '-' : dayDiff;
  }

  async function runAutomationRules(previousTask, nextTask, context = {}) {
    if (!nextTask || !selectedBoardId) return nextTask;

    const matchingRules = boardAutomations.filter((rule) => {
      if (rule.trigger === 'file_added') {
        return (context.fileCountBefore || 0) < (context.fileCountAfter || 0);
      }
      if (rule.trigger === 'comment_added') {
        return (context.commentCountBefore || 0) < (context.commentCountAfter || 0);
      }
      if (rule.trigger === 'overdue') {
        if (!nextTask.due_date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(`${nextTask.due_date}T00:00:00`).getTime() < today.getTime() && nextTask.status !== 'Submitted';
      }

      const beforeValue = previousTask ? getColumnDisplayValue(previousTask, rule.field) : '';
      const afterValue = getColumnDisplayValue(nextTask, rule.field);
      const changed = JSON.stringify(beforeValue ?? '') !== JSON.stringify(afterValue ?? '');
      if (!changed) return false;
      if (rule.trigger === 'field_completed') {
        return isColumnCompleteForTask(nextTask, rule.field, rule.value || '');
      }
      return String(Array.isArray(afterValue) ? afterValue.join(',') : afterValue ?? '') === String(rule.value || '');
    });

    if (!matchingRules.length) return nextTask;

    let updatedTask = { ...nextTask };

    for (const rule of matchingRules) {
      if (rule.action === 'move_stage') {
        const targetGroup = boardGroups.find((group) => group.name === rule.actionValue || group.id === rule.actionValue);
        if (targetGroup) {
          updatedTask.group_id = targetGroup.id;
          updatedTask.status = targetGroup.name;
        }
      } else if (rule.action === 'set_priority') {
        updatedTask.priority = rule.actionValue || updatedTask.priority;
      } else if (rule.action === 'set_qa_status') {
        updatedTask.qa_status = rule.actionValue || updatedTask.qa_status;
      } else if (rule.action === 'set_assessor') {
        updatedTask.assessor = rule.actionValue || updatedTask.assessor;
      }

      addNotification(makeNotification('Automation ran', `${rule.name} updated ${updatedTask.title}.`, 'info'));
      logTaskActivity(updatedTask.id, {
        type: 'automation',
        title: 'Automation applied',
        description: `${rule.name} ran after ${context.label || 'an update'}.`,
      });
    }

    const patch = {
      group_id: updatedTask.group_id,
      status: updatedTask.status,
      priority: updatedTask.priority,
      qa_status: updatedTask.qa_status,
      assessor: updatedTask.assessor,
    };

    setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? { ...task, ...patch } : task)));
    setSelectedTask((prev) => (prev && prev.id === updatedTask.id ? { ...prev, ...patch } : prev));

    if (!usingDemoMode && supabase) {
      await persistTask(updatedTask.id, patch);
    }

    return updatedTask;
  }

  async function persistTask(taskId, payload) {
    if (!canEditDeals()) return false;
    if (usingDemoMode || !supabase) return true;
    const { error } = await supabase.from('tasks').update(payload).eq('id', taskId);
    if (error) {
      setErrorText(error.message);
      await loadData();
      return false;
    }
    return true;
  }

  async function signInWithEmail() {
    if (!supabase || !authEmailDraft.trim()) return;
    setAuthStatusText('');
    const { error } = await supabase.auth.signInWithOtp({
      email: authEmailDraft.trim(),
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    });
    if (error) {
      setAuthStatusText(error.message);
      return;
    }
    setAuthStatusText('Magic link sent. Check your email to sign in.');
  }

  async function signOutCurrentUser() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthStatusText(error.message);
      return;
    }
    setAuthStatusText('Signed out.');
  }

  async function addNotification(notification) {
    const nextNotification = {
      boardId: selectedBoardId,
      ...notification,
    };

    if (nextNotification.dedupeKey) {
      const dedupeKey = makeNotificationKey(nextNotification.boardId, nextNotification.dedupeKey, nextNotification.created_at);
      const exists = notifications.some((item) => (
        makeNotificationKey(item.boardId, item.dedupeKey || `${item.title}:${item.body}:${item.type || 'info'}`, item.created_at) === dedupeKey
      ));
      if (exists) return;
    }

    setNotifications((prev) => [nextNotification, ...prev].slice(0, 50));

    if (typeof window !== 'undefined' && selectedBoardId) {
      fetch('/api/notifications/deliver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardName: selectedBoard?.name || 'Board',
          notification: nextNotification,
          channels: boardNotificationChannels.filter((channel) => channel.enabled),
        }),
      }).catch(() => {});
    }

    if (usingDemoMode || !supabase || !selectedBoardId) return;

    const { data, error } = await supabase.from('board_notifications').insert({
      board_id: selectedBoardId,
      title: nextNotification.title,
      body: nextNotification.body,
      notification_type: nextNotification.type || 'info',
      is_read: Boolean(nextNotification.read),
      dedupe_key: nextNotification.dedupeKey || null,
    }).select().single();

    if (error) {
      setErrorText(error.message);
      return;
    }

    setNotifications((prev) => prev.map((item) => (
      item.id === nextNotification.id
        ? {
            ...item,
            id: data.id,
            boardId: data.board_id,
            created_at: data.created_at,
            dedupeKey: data.dedupe_key || item.dedupeKey,
          }
        : item
    )));
  }

  const {
    addNotificationChannel,
    toggleNotificationChannel,
    removeNotificationChannel,
    addBoardMembership,
    removeBoardMembership,
    updateBoardMembershipRole,
    createBoardInvite,
    revokeBoardInvite,
    acceptBoardInvite,
    copyInviteLink,
  } = createBoardAccessActions({
    canEditBoardStructure,
    selectedBoardId,
    selectedBoard,
    authUser,
    usingDemoMode,
    supabase,
    loadData,
    addNotification,
    makeNotification,
    setErrorText,
    setAuthStatusText,
    setInviteTokenFromUrl,
    channelDraftType,
    channelDraftLabel,
    channelDraftTarget,
    channelDraftUrl,
    setChannelDraftLabel,
    setChannelDraftTarget,
    setChannelDraftUrl,
    setNotificationChannelsByBoard,
    membershipDraftUserId,
    membershipDraftRole,
    setMembershipDraftUserId,
    setMembershipDraftRole,
    setBoardMembershipsByBoard,
    inviteDraftEmail,
    inviteDraftRole,
    setInviteDraftEmail,
    setInviteDraftRole,
    setBoardInvitesByBoard,
  });

  const peopleViewActions = createBoardPeopleViewActions({
    canEditBoardStructure,
    canEditDeals,
    selectedBoardId,
    selectedViewId,
    selectedBoard,
    search,
    assessorFilter,
    priorityFilter,
    qaFilter,
    boardSavedViews,
    workspaceViewsByBoard,
    archivedCurrentPeople,
    assessors,
    tasks,
    usingDemoMode,
    supabase,
    loadData,
    persistTask,
    setErrorText,
    setSavedViews,
    setSelectedViewId,
    setWorkspaceViewsByBoard,
    setActiveBoardView,
    setNewWorkspaceViewName,
    setNewWorkspaceViewType,
    setArchivedWorkspaceViewsByBoard,
    setPendingWorkspaceViewArchiveId,
    setPendingWorkspaceViewDeleteId,
    setAssessors,
    setArchivedPeopleByBoard,
    setAssessorDraftName,
    setAssessorDraftRole,
    setTasks,
    setSelectedTask,
    setPendingAssessorArchiveId,
    setPendingAssessorDeleteId,
    normalizeWorkspaceViews,
    DEFAULT_WORKSPACE_VIEWS,
    makeAssessorId,
  });

  const {
    createBoard,
    renameSelectedBoard,
    addGroup,
    renameGroup,
    removeGroup,
    deleteGroupPermanently,
  } = createBoardStructureActions({
    canEditBoardStructure,
    selectedBoardId,
    boardGroups,
    boardNameDraft,
    newBoardName,
    newGroupName,
    boards,
    groups,
    tasks,
    usingDemoMode,
    supabase,
    loadData,
    setErrorText,
    setBoards,
    setGroups,
    setWorkspaceViewsByBoard,
    setBoardPermissionsByBoard,
    setSelectedBoardId,
    setBoardNameDraft,
    setNewBoardName,
    setNewGroupName,
    setArchivedGroupsByBoard,
    setPendingGroupDeleteId,
    setPendingGroupPermanentDeleteId,
    DEFAULT_WORKSPACE_VIEWS,
  });

  const {
    resetColumnDraft,
    addDraftColumnOption,
    updateDraftColumnOption,
    removeDraftColumnOption,
    addColumn,
  } = createBoardColumnDraftActions({
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
  });

  function openTask(task) {
    setSelectedTask(task);
    setNewComment('');
  }

  function getColumnOptionDraft(columnId) {
    return columnOptionDrafts[columnId] || { label: '', color: OPTION_COLORS[0] };
  }

  function updateColumnOptionDraft(columnId, patch) {
    setColumnOptionDrafts((prev) => ({
      ...prev,
      [columnId]: {
        ...(prev[columnId] || { label: '', color: OPTION_COLORS[0] }),
        ...patch,
      },
    }));
  }

  function clearColumnOptionDraft(columnId) {
    setColumnOptionDrafts((prev) => {
      const next = { ...prev };
      delete next[columnId];
      return next;
    });
  }

  function applySavedView(view) {
    setSelectedBoardId(view.boardId);
    setSearch(view.search || '');
    setAssessorFilter(view.assessorFilter || 'All');
    setPriorityFilter(view.priorityFilter || 'All');
    setQaFilter(view.qaFilter || 'All');
    setSelectedViewId(view.id);
  }

  const {
    archiveSelectedBoard,
    restoreBoard,
    deleteSelectedBoard,
    restoreTask,
    restorePerson,
    deleteArchivedPerson,
    restoreGroup,
    deleteArchivedGroup,
    restoreSavedView,
    deleteArchivedSavedView,
    restoreWorkspaceView,
    deleteWorkspaceViewPermanently,
  } = createBoardArchiveActions({
    canEditBoardStructure,
    canEditDeals,
    canDeleteDeals,
    selectedBoardId,
    boards,
    groups,
    tasks,
    selectedTask,
    workspaceViewsByBoard,
    archivedBoards,
    archivedCurrentWorkspaceViews,
    archivedCurrentSavedViews,
    archivedCurrentGroups,
    archivedCurrentPeople,
    activeBoardView,
    usingDemoMode,
    supabase,
    loadData,
    persistTask,
    deleteGroupPermanently,
    setErrorText,
    setBoards,
    setArchivedBoards,
    setSelectedBoardId,
    setGroups,
    setTasks,
    setCustomColumns,
    setSavedViews,
    setAssessors,
    setNotifications,
    setTemplatesByBoard,
    setArchivedTemplatesByBoard,
    setAutomationRulesByBoard,
    setArchivedAutomationsByBoard,
    setBoardMembershipsByBoard,
    setBoardInvitesByBoard,
    setWorkspaceViewsByBoard,
    setArchivedWorkspaceViewsByBoard,
    setArchivedSavedViewsByBoard,
    setBoardPermissionsByBoard,
    setArchivedPeopleByBoard,
    setArchivedGroupsByBoard,
    setActiveBoardView,
    setPendingWorkspaceViewArchiveId,
    setPendingWorkspaceViewDeleteId,
    setPendingAssessorArchiveId,
    setPendingAssessorDeleteId,
    normalizeWorkspaceViews,
    DEFAULT_WORKSPACE_VIEWS,
  });

  const {
    addWorkspaceView,
    renameWorkspaceView,
    removeWorkspaceView,
    saveCurrentView,
    addAssessor,
    removeAssessor,
    deleteAssessorPermanently,
    deleteSavedView,
  } = createBoardViewUiActions({
    peopleViewActions,
    newWorkspaceViewName,
    newWorkspaceViewType,
    activeBoardView,
    viewDraftName,
    setViewDraftName,
    assessorDraftName,
    assessorDraftRole,
  });

  function beginColumnResize(columnId, event) {
    if (!canEditBoardStructure()) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget?.setPointerCapture) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}
    }

    const column = allColumns.find((item) => item.id === columnId);
    activeResizeRef.current = {
      columnId,
      startX: event.clientX,
      startWidth: columnWidths[columnId] || column?.defaultWidth || (columnId === 'item' ? 360 : 180),
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  const { getProgressForTask, getAttachmentBadge } = createBoardDisplayUtils({
    isColumnCompleteForTask,
  });

  const {
    enhancedTasks,
    filteredTaskList,
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
  } = useTaskDerivedState({
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
  });

  const {
    boardGridStyle,
    pinnedColumnOffsets,
    scores,
    canManageStructure,
    canEditDeals: canEditDealsValue,
    canDeleteDeals: canDeleteDealsValue,
    metricCards,
    stageOverview,
    progressEligibleColumns,
    permissionSummary,
  } = useBoardUiState({
    visibleColumns,
    columnWidths,
    boardTasks,
    boardGroups,
    boardPermissions,
    activeRoleName,
    allColumns,
  });

  const {
    patchTask,
    removeTaskLocally,
    patchTaskMeta,
    updateIssueDraft,
    commitIssueDraft,
    moveTask,
    moveTaskBefore,
    addTask,
    addComment,
    duplicateTask,
  } = createBoardTaskFlowActions({
    canEditDeals,
    enhancedTasks,
    boardGroups,
    tasks,
    groups,
    boardTemplates,
    selectedTemplateId,
    newTaskGroupId,
    newTaskTitle,
    newTaskAssessor,
    usingDemoMode,
    supabase,
    loadData,
    setErrorText,
    setTasks,
    setSelectedTask,
    setCommentsByTask,
    setTaskMeta,
    setNewTaskTitle,
    setNewTaskAssessor,
    setSelectedTemplateId,
    selectedTask,
    newComment,
    setNewComment,
    assessorDirectory,
    addNotification,
    makeNotification,
    runAutomationRules,
    logTaskActivity,
    compareTasks,
    boardColumns,
    serializeColumnValue,
    persistTask,
    parseIssuesInput,
  });

  const {
    removeColumn,
    renameColumn,
    resizeColumn,
    toggleColumnVisibility,
    reorderColumn,
    updateColumnOptions,
    updateCustomField,
    updateCustomFieldInline,
  } = createBoardColumnActions({
    canEditBoardStructure,
    canEditDeals,
    selectedTaskIds,
    usingDemoMode,
    supabase,
    loadData,
    setErrorText,
    setCustomColumns,
    setTaskMeta,
    setSelectedTask,
    setPendingColumnDeleteId,
    selectedBoardId,
    customColumns,
    allColumns,
    columnWidths,
    setColumnWidths,
    setHiddenColumnIds,
    setColumnOrder,
    patchTaskMeta,
    logTaskActivity,
    runAutomationRules,
    enhancedTasks,
    serializeColumnValue,
    normalizeColumnOptions,
    normalizeProgressLinks,
    normalizeFormulaConfig,
  });

  const {
    toggleTaskSelection,
    toggleAllDisplayedSelection,
    bulkArchiveSelected,
    bulkDeleteSelected,
    bulkMoveSelected,
    bulkUpdateField,
  } = createBoardBulkTaskActions({
    canEditDeals,
    canDeleteDeals,
    selectedTaskIds,
    allDisplayedTaskIds,
    usingDemoMode,
    supabase,
    loadData,
    setErrorText,
    setTasks,
    setSelectedTask,
    setSelectedTaskIds,
    tasks,
    boardGroups,
    compareTasks,
  });

  const {
    updateTaskField,
    updateTaskFieldInline,
    moveTaskToCalendarDate,
    moveTaskToTimelinePosition,
    uploadFiles,
    removeAttachment,
    saveTaskChanges,
    archiveSelectedTask,
    deleteSelectedTask,
  } = createBoardTaskActions({
    canEditDeals,
    canDeleteDeals,
    enhancedTasks,
    boardGroups,
    tasks,
    selectedTask,
    selectedTaskIds,
    usingDemoMode,
    supabase,
    loadData,
    setErrorText,
    setTasks,
    setSelectedTask,
    setDraggedTaskId,
    patchTask,
    patchTaskMeta,
    persistTask,
    logTaskActivity,
    runAutomationRules,
    compareTasks,
    timelineRange,
    uploadCategory,
    addNotification,
    makeNotification,
    parseIssuesInput,
    getIssuesInputValue,
    removeTaskLocally,
  });

  const {
    toggleTimeTracking,
    updateTaskDependencies,
  } = createBoardTaskMetaActions({
    canEditDeals,
    taskMeta,
    patchTaskMeta,
    logTaskActivity,
    formatDuration,
    usingDemoMode,
    supabase,
    setErrorText,
    getTaskDependencies,
  });

  const {
    markNotificationRead,
    markAllNotificationsRead,
    clearAllNotifications,
    createReminderSweep,
    updateReminderRule,
    saveCurrentTaskAsTemplate,
    archiveTaskTemplate,
    deleteTaskTemplatePermanently,
    restoreTaskTemplate,
    createTemplateFromDraft,
    addAutomationRule,
    archiveAutomationRule,
    deleteAutomationRulePermanently,
    restoreAutomationRule,
    applyAutomationPreset,
  } = createBoardWorkflowActions({
    selectedBoardId,
    selectedBoard,
    notifications,
    boardNotificationChannels,
    usingDemoMode,
    supabase,
    loadData,
    setErrorText,
    setNotifications,
    makeNotificationKey,
    canEditBoardStructure,
    canEditDeals,
    boardTasks,
    makeNotification,
    addNotification,
    boardReminderRules,
    DEFAULT_REMINDER_RULES,
    setReminderRulesByBoard,
    templatesByBoard,
    archivedCurrentTemplates,
    setTemplatesByBoard,
    setArchivedTemplatesByBoard,
    selectedTemplateId,
    setSelectedTemplateId,
    setPendingTemplateArchiveId,
    setPendingTemplateDeleteId,
    newTemplateName,
    setNewTemplateName,
    selectedTask,
    templateDraftName,
    templateDraftCategory,
    templateDraftGroupId,
    templateDraftAssessor,
    templateDraftPriority,
    templateDraftQaStatus,
    templateDraftMagicplan,
    templateDraftNotes,
    templateDraftIssues,
    templateDraftCustomFields,
    setTemplateDraftName,
    setTemplateDraftCategory,
    setTemplateDraftGroupId,
    setTemplateDraftAssessor,
    setTemplateDraftPriority,
    setTemplateDraftQaStatus,
    setTemplateDraftMagicplan,
    setTemplateDraftNotes,
    setTemplateDraftIssues,
    setTemplateDraftCustomFields,
    automationRulesByBoard,
    archivedCurrentAutomations,
    setAutomationRulesByBoard,
    setArchivedAutomationsByBoard,
    setPendingAutomationArchiveId,
    setPendingAutomationDeleteId,
    automationDraftName,
    automationDraftTrigger,
    automationDraftField,
    automationDraftValue,
    automationDraftAction,
    automationDraftActionValue,
    setAutomationDraftName,
    setAutomationDraftTrigger,
    setAutomationDraftField,
    setAutomationDraftValue,
    setAutomationDraftAction,
    setAutomationDraftActionValue,
  });

  const { unreadNotificationsCount, boardNotifications, notificationSummary } = useBoardNotificationsState({
    notifications,
    selectedBoardId,
    boardTasks,
    boardReminderRules,
    loading,
    addNotification,
    makeNotification,
  });

  return (
    <div className="appShell" data-theme={themeMode}>
      <SidebarNav
        boards={boards}
        selectedBoardId={selectedBoardId}
        setSelectedBoardId={setSelectedBoardId}
        newBoardName={newBoardName}
        setNewBoardName={setNewBoardName}
        createBoard={createBoard}
        canEditBoardStructure={canEditBoardStructure}
        currentBoardViews={currentBoardViews}
        activeBoardView={activeBoardView}
        setActiveBoardView={setActiveBoardView}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        showSettingsPanel={showSettingsPanel}
        setShowSettingsPanel={setShowSettingsPanel}
      />

      <main className="main">
        <WorkspaceNotices
          isSupabaseConfigured={isSupabaseConfigured}
          errorText={errorText}
          inviteTokenFromUrl={inviteTokenFromUrl}
          inviteTokenMatch={inviteTokenMatch}
          boards={boards}
          authUser={authUser}
          acceptBoardInvite={acceptBoardInvite}
        />

        <WorkspaceTopbar
          selectedBoard={selectedBoard}
          searchInputRef={searchInputRef}
          search={search}
          setSearch={setSearch}
          unreadNotificationsCount={unreadNotificationsCount}
          setShowNotifications={setShowNotifications}
          activeRoleName={activeRoleName}
          setShowSettingsPanel={setShowSettingsPanel}
          showSettingsPanel={showSettingsPanel}
          loadData={loadData}
        />

        {showNotifications && (
          <NotificationsPanel
            createReminderSweep={createReminderSweep}
            markAllNotificationsRead={markAllNotificationsRead}
            clearAllNotifications={clearAllNotifications}
            notificationSummary={notificationSummary}
            boardNotifications={boardNotifications}
            formatDateTime={formatDateTime}
            markNotificationRead={markNotificationRead}
          />
        )}

        <ActionToolbar
          quickAddInputRef={quickAddInputRef}
          canEditDeals={canEditDeals}
          searchInputRef={searchInputRef}
          assessorFilter={assessorFilter}
          setAssessorFilter={setAssessorFilter}
          assessorOptions={assessorOptions}
          showFiltersPanel={showFiltersPanel}
          setShowFiltersPanel={setShowFiltersPanel}
          sortMode={sortMode}
          setSortMode={setSortMode}
          hideEmptyGroups={hideEmptyGroups}
          setHideEmptyGroups={setHideEmptyGroups}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          setShowSettingsPanel={setShowSettingsPanel}
          canEditBoardStructure={canEditBoardStructure}
          showSettingsPanel={showSettingsPanel}
          compactMode={compactMode}
          setCompactMode={setCompactMode}
        />

        <PermissionSummaryPanel
          activeRoleName={activeRoleName}
          authUser={authUser}
          permissionSummary={permissionSummary}
        />

        <BulkActionsBar
          currentWorkspaceView={currentWorkspaceView}
          selectedTaskIds={selectedTaskIds}
          selectedDeals={selectedDeals}
          boardGroups={boardGroups}
          bulkMoveSelected={bulkMoveSelected}
          assessorDirectory={assessorDirectory}
          bulkUpdateField={bulkUpdateField}
          qaOptions={qaOptions}
          bulkArchiveSelected={bulkArchiveSelected}
          canDeleteDeals={canDeleteDeals}
          bulkDeleteSelected={bulkDeleteSelected}
          setSelectedTaskIds={setSelectedTaskIds}
        />

        <StatsOverviewGrid
          metricCards={metricCards}
          metricLabels={metricLabels}
          defaultMetrics={DEFAULT_METRICS}
          setMetricLabels={setMetricLabels}
        />

        <QuickAddDealPanel
          quickAddInputRef={quickAddInputRef}
          newTaskTitle={newTaskTitle}
          setNewTaskTitle={setNewTaskTitle}
          newTaskGroupId={newTaskGroupId}
          setNewTaskGroupId={setNewTaskGroupId}
          boardGroups={boardGroups}
          newTaskAssessor={newTaskAssessor}
          setNewTaskAssessor={setNewTaskAssessor}
          assessorDirectory={assessorDirectory}
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={setSelectedTemplateId}
          boardTemplates={boardTemplates}
          addTask={addTask}
          canEditDeals={canEditDeals}
        />

        <SettingsModalShell
          show={showSettingsPanel}
          onClose={() => setShowSettingsPanel(false)}
          tabs={SETTINGS_TABS}
          activeTab={activeSettingsTab}
          setActiveTab={setActiveSettingsTab}
        >
          <SettingsContent
            activeSettingsTab={activeSettingsTab}
            boardNameDraft={boardNameDraft}
            setBoardNameDraft={setBoardNameDraft}
            renameSelectedBoard={renameSelectedBoard}
            canEditBoardStructure={canEditBoardStructure}
            archiveSelectedBoard={archiveSelectedBoard}
            deleteSelectedBoard={deleteSelectedBoard}
            selectedBoardId={selectedBoardId}
            newWorkspaceViewName={newWorkspaceViewName}
            setNewWorkspaceViewName={setNewWorkspaceViewName}
            newWorkspaceViewType={newWorkspaceViewType}
            setNewWorkspaceViewType={setNewWorkspaceViewType}
            addWorkspaceView={addWorkspaceView}
            currentBoardViews={currentBoardViews}
            pendingWorkspaceViewArchiveId={pendingWorkspaceViewArchiveId}
            setPendingWorkspaceViewArchiveId={setPendingWorkspaceViewArchiveId}
            pendingWorkspaceViewDeleteId={pendingWorkspaceViewDeleteId}
            setPendingWorkspaceViewDeleteId={setPendingWorkspaceViewDeleteId}
            renameWorkspaceView={renameWorkspaceView}
            removeWorkspaceView={removeWorkspaceView}
            deleteWorkspaceViewPermanently={deleteWorkspaceViewPermanently}
            authUser={authUser}
            currentProfile={currentProfile}
            activeRoleName={activeRoleName}
            signOutCurrentUser={signOutCurrentUser}
            authEmailDraft={authEmailDraft}
            setAuthEmailDraft={setAuthEmailDraft}
            signInWithEmail={signInWithEmail}
            authStatusText={authStatusText}
            knownProfiles={knownProfiles}
            membershipDraftUserId={membershipDraftUserId}
            setMembershipDraftUserId={setMembershipDraftUserId}
            availableMembershipProfiles={availableMembershipProfiles}
            membershipDraftRole={membershipDraftRole}
            setMembershipDraftRole={setMembershipDraftRole}
            addBoardMembership={addBoardMembership}
            boardMemberships={boardMemberships}
            profilesById={profilesById}
            updateBoardMembershipRole={updateBoardMembershipRole}
            removeBoardMembership={removeBoardMembership}
            inviteDraftEmail={inviteDraftEmail}
            setInviteDraftEmail={setInviteDraftEmail}
            inviteDraftRole={inviteDraftRole}
            setInviteDraftRole={setInviteDraftRole}
            createBoardInvite={createBoardInvite}
            boardInvites={boardInvites}
            acceptBoardInvite={acceptBoardInvite}
            copyInviteLink={copyInviteLink}
            revokeBoardInvite={revokeBoardInvite}
            assessorDraftName={assessorDraftName}
            setAssessorDraftName={setAssessorDraftName}
            assessorDraftRole={assessorDraftRole}
            setAssessorDraftRole={setAssessorDraftRole}
            addAssessor={addAssessor}
            assessorDirectory={assessorDirectory}
            pendingAssessorArchiveId={pendingAssessorArchiveId}
            setPendingAssessorArchiveId={setPendingAssessorArchiveId}
            pendingAssessorDeleteId={pendingAssessorDeleteId}
            setPendingAssessorDeleteId={setPendingAssessorDeleteId}
            removeAssessor={removeAssessor}
            deleteAssessorPermanently={deleteAssessorPermanently}
            allColumns={allColumns}
            pendingColumnDeleteId={pendingColumnDeleteId}
            setPendingColumnDeleteId={setPendingColumnDeleteId}
            hiddenColumnIds={hiddenColumnIds}
            toggleColumnVisibility={toggleColumnVisibility}
            removeColumn={removeColumn}
            OPTION_COLOR_CHOICES={OPTION_COLOR_CHOICES}
            updateColumnOptions={updateColumnOptions}
            getColumnOptionDraft={getColumnOptionDraft}
            updateColumnOptionDraft={updateColumnOptionDraft}
            clearColumnOptionDraft={clearColumnOptionDraft}
            makeOption={makeOption}
            progressEligibleColumns={progressEligibleColumns}
            getCompletionValuesForColumn={getCompletionValuesForColumn}
            newGroupName={newGroupName}
            setNewGroupName={setNewGroupName}
            addGroup={addGroup}
            boardGroups={boardGroups}
            pendingGroupDeleteId={pendingGroupDeleteId}
            setPendingGroupDeleteId={setPendingGroupDeleteId}
            pendingGroupPermanentDeleteId={pendingGroupPermanentDeleteId}
            setPendingGroupPermanentDeleteId={setPendingGroupPermanentDeleteId}
            renameGroup={renameGroup}
            displayedGroups={displayedGroups}
            removeGroup={removeGroup}
            deleteGroupPermanently={deleteGroupPermanently}
            currentRole={currentRole}
            setCurrentRole={setCurrentRole}
            permissionSummary={permissionSummary}
            boardPermissions={boardPermissions}
            updateBoardPermission={updateBoardPermission}
            boardReminderRules={boardReminderRules}
            updateReminderRule={updateReminderRule}
            AUTOMATION_PRESETS={AUTOMATION_PRESETS}
            applyAutomationPreset={applyAutomationPreset}
            automationDraftName={automationDraftName}
            setAutomationDraftName={setAutomationDraftName}
            automationDraftTrigger={automationDraftTrigger}
            setAutomationDraftTrigger={setAutomationDraftTrigger}
            automationDraftField={automationDraftField}
            setAutomationDraftField={setAutomationDraftField}
            automationDraftValue={automationDraftValue}
            setAutomationDraftValue={setAutomationDraftValue}
            automationDraftAction={automationDraftAction}
            setAutomationDraftAction={setAutomationDraftAction}
            automationDraftActionValue={automationDraftActionValue}
            setAutomationDraftActionValue={setAutomationDraftActionValue}
            addAutomationRule={addAutomationRule}
            boardAutomations={boardAutomations}
            pendingAutomationArchiveId={pendingAutomationArchiveId}
            setPendingAutomationArchiveId={setPendingAutomationArchiveId}
            pendingAutomationDeleteId={pendingAutomationDeleteId}
            setPendingAutomationDeleteId={setPendingAutomationDeleteId}
            archiveAutomationRule={archiveAutomationRule}
            deleteAutomationRulePermanently={deleteAutomationRulePermanently}
            templateDraftName={templateDraftName}
            setTemplateDraftName={setTemplateDraftName}
            templateDraftCategory={templateDraftCategory}
            setTemplateDraftCategory={setTemplateDraftCategory}
            templateDraftGroupId={templateDraftGroupId}
            setTemplateDraftGroupId={setTemplateDraftGroupId}
            templateDraftAssessor={templateDraftAssessor}
            setTemplateDraftAssessor={setTemplateDraftAssessor}
            templateDraftPriority={templateDraftPriority}
            setTemplateDraftPriority={setTemplateDraftPriority}
            templateDraftQaStatus={templateDraftQaStatus}
            setTemplateDraftQaStatus={setTemplateDraftQaStatus}
            qaOptions={qaOptions}
            templateDraftMagicplan={templateDraftMagicplan}
            setTemplateDraftMagicplan={setTemplateDraftMagicplan}
            templateDraftIssues={templateDraftIssues}
            setTemplateDraftIssues={setTemplateDraftIssues}
            templateDraftNotes={templateDraftNotes}
            setTemplateDraftNotes={setTemplateDraftNotes}
            templateDraftCustomFields={templateDraftCustomFields}
            setTemplateDraftCustomFields={setTemplateDraftCustomFields}
            createTemplateFromDraft={createTemplateFromDraft}
            boardTemplates={boardTemplates}
            pendingTemplateArchiveId={pendingTemplateArchiveId}
            setPendingTemplateArchiveId={setPendingTemplateArchiveId}
            pendingTemplateDeleteId={pendingTemplateDeleteId}
            setPendingTemplateDeleteId={setPendingTemplateDeleteId}
            archiveTaskTemplate={archiveTaskTemplate}
            deleteTaskTemplatePermanently={deleteTaskTemplatePermanently}
            channelDraftType={channelDraftType}
            setChannelDraftType={setChannelDraftType}
            channelDraftLabel={channelDraftLabel}
            setChannelDraftLabel={setChannelDraftLabel}
            channelDraftTarget={channelDraftTarget}
            setChannelDraftTarget={setChannelDraftTarget}
            channelDraftUrl={channelDraftUrl}
            setChannelDraftUrl={setChannelDraftUrl}
            addNotificationChannel={addNotificationChannel}
            boardNotificationChannels={boardNotificationChannels}
            toggleNotificationChannel={toggleNotificationChannel}
            removeNotificationChannel={removeNotificationChannel}
            activeArchiveTab={activeArchiveTab}
            setActiveArchiveTab={setActiveArchiveTab}
            archivedCurrentWorkspaceViews={archivedCurrentWorkspaceViews}
            archivedCurrentSavedViews={archivedCurrentSavedViews}
            archivedCurrentGroups={archivedCurrentGroups}
            archivedCurrentTasks={archivedCurrentTasks}
            archivedCurrentPeople={archivedCurrentPeople}
            archivedCurrentTemplates={archivedCurrentTemplates}
            archivedCurrentAutomations={archivedCurrentAutomations}
            archivedBoards={archivedBoards}
            restoreWorkspaceView={restoreWorkspaceView}
            deleteArchivedWorkspaceView={deleteWorkspaceViewPermanently}
            restoreSavedView={restoreSavedView}
            deleteArchivedSavedView={deleteArchivedSavedView}
            restoreGroup={restoreGroup}
            deleteArchivedGroup={deleteArchivedGroup}
            restoreTask={restoreTask}
            restorePerson={restorePerson}
            deleteArchivedPerson={deleteArchivedPerson}
            restoreTaskTemplate={restoreTaskTemplate}
            deleteArchivedTaskTemplate={deleteTaskTemplatePermanently}
            restoreAutomationRule={restoreAutomationRule}
            deleteArchivedAutomationRule={deleteAutomationRulePermanently}
            restoreBoard={restoreBoard}
          />


        </SettingsModalShell>

        <FiltersPanel
          show={showFiltersPanel}
          viewDraftName={viewDraftName}
          setViewDraftName={setViewDraftName}
          saveCurrentView={saveCurrentView}
          boardSavedViews={boardSavedViews}
          selectedViewId={selectedViewId}
          applySavedView={applySavedView}
          deleteSavedView={deleteSavedView}
          assessorFilter={assessorFilter}
          setAssessorFilter={setAssessorFilter}
          assessorOptions={assessorOptions}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          qaFilter={qaFilter}
          setQaFilter={setQaFilter}
          qaOptions={qaOptions}
          selectedViewName={selectedViewId ? boardSavedViews.find((view) => view.id === selectedViewId)?.name || 'Custom view' : ''}
          clearFilters={() => {
            setAssessorFilter('All');
            setPriorityFilter('All');
            setQaFilter('All');
            setSearch('');
          }}
        />

        <WorkspaceViewContent
          loading={loading}
          currentWorkspaceView={currentWorkspaceView}
          displayedGroups={displayedGroups}
          groupBy={groupBy}
          draggedTaskId={draggedTaskId}
          moveTaskBefore={moveTaskBefore}
          setDraggedTaskId={setDraggedTaskId}
          openTask={openTask}
          toneClass={toneClass}
          formatDate={formatDate}
          dashboardStats={dashboardStats}
          stageOverview={stageOverview}
          notificationSummary={notificationSummary}
          boardNotifications={boardNotifications}
          boardTasks={boardTasks}
          getTaskDependencies={getTaskDependencies}
          calendarSummary={calendarSummary}
          calendarGroups={calendarGroups}
          canEditDeals={canEditDeals}
          moveTaskToCalendarDate={moveTaskToCalendarDate}
          updateTaskFieldInline={updateTaskFieldInline}
          addDaysToDateString={addDaysToDateString}
          timelineTasks={timelineTasks}
          timelineRange={timelineRange}
          moveTaskToTimelinePosition={moveTaskToTimelinePosition}
          allBoardAttachments={allBoardAttachments}
          formatDateTime={formatDateTime}
          compactMode={compactMode}
          boardGridStyle={boardGridStyle}
          visibleColumns={visibleColumns}
          pinnedColumnOffsets={pinnedColumnOffsets}
          draggedColumnId={draggedColumnId}
          setDraggedColumnId={setDraggedColumnId}
          canEditBoardStructure={canEditBoardStructure}
          reorderColumn={reorderColumn}
          allDisplayedTaskIds={allDisplayedTaskIds}
          selectedTaskIds={selectedTaskIds}
          toggleTaskSelection={toggleTaskSelection}
          toggleAllDisplayedSelection={toggleAllDisplayedSelection}
          renameColumn={renameColumn}
          beginColumnResize={beginColumnResize}
          showInlineColumnCreator={showInlineColumnCreator}
          setShowInlineColumnCreator={setShowInlineColumnCreator}
          columnDraftName={columnDraftName}
          setColumnDraftName={setColumnDraftName}
          columnDraftType={columnDraftType}
          setColumnDraftType={setColumnDraftType}
          setColumnDraftOptions={setColumnDraftOptions}
          setColumnDraftOptionLabel={setColumnDraftOptionLabel}
          setColumnDraftOptionColor={setColumnDraftOptionColor}
          OPTION_COLORS={OPTION_COLORS}
          setColumnDraftLinks={setColumnDraftLinks}
          progressEligibleColumns={progressEligibleColumns}
          columnDraftLinks={columnDraftLinks}
          formulaDraftType={formulaDraftType}
          setFormulaDraftType={setFormulaDraftType}
          FORMULA_CHOICES={FORMULA_CHOICES}
          OPTION_COLOR_CHOICES={OPTION_COLOR_CHOICES}
          columnDraftOptionLabel={columnDraftOptionLabel}
          columnDraftOptionColor={columnDraftOptionColor}
          addDraftColumnOption={addDraftColumnOption}
          columnDraftOptions={columnDraftOptions}
          updateDraftColumnOption={updateDraftColumnOption}
          removeDraftColumnOption={removeDraftColumnOption}
          addColumn={addColumn}
          boardGroups={boardGroups}
          assessorDirectory={assessorDirectory}
          updateIssueDraft={updateIssueDraft}
          commitIssueDraft={commitIssueDraft}
          updateCustomFieldInline={updateCustomFieldInline}
          patchTask={patchTask}
          persistTask={persistTask}
          getIssuesInputValue={getIssuesInputValue}
          getProgressForTask={getProgressForTask}
          getFormulaValue={getFormulaValue}
          getAttachmentBadge={getAttachmentBadge}
          getOptionTone={getOptionTone}
        />
      </main>

      <DealModal
        selectedTask={selectedTask}
        setSelectedTask={setSelectedTask}
        toneClass={toneClass}
        formatDate={formatDate}
        assessorDirectory={assessorDirectory}
        boardColumns={boardColumns}
        allColumns={allColumns}
        hiddenColumnIds={hiddenColumnIds}
        getOptionTone={getOptionTone}
        updateCustomField={updateCustomField}
        getProgressForTask={getProgressForTask}
        getFormulaValue={getFormulaValue}
        getIssuesInputValue={getIssuesInputValue}
        uploadCategory={uploadCategory}
        setUploadCategory={setUploadCategory}
        FILE_CATEGORY_OPTIONS={FILE_CATEGORY_OPTIONS}
        uploadFiles={uploadFiles}
        formatDateTime={formatDateTime}
        removeAttachment={removeAttachment}
        getTaskDependencies={getTaskDependencies}
        updateTaskDependencies={updateTaskDependencies}
        boardTasks={boardTasks}
        taskMeta={taskMeta}
        formatDuration={formatDuration}
        getTrackedMinutes={getTrackedMinutes}
        toggleTimeTracking={toggleTimeTracking}
        getTaskTimeEntries={getTaskTimeEntries}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        saveCurrentTaskAsTemplate={saveCurrentTaskAsTemplate}
        duplicateTask={duplicateTask}
        archiveSelectedTask={archiveSelectedTask}
        canDeleteDeals={canDeleteDeals}
        deleteSelectedTask={deleteSelectedTask}
        saveTaskChanges={saveTaskChanges}
        newComment={newComment}
        setNewComment={setNewComment}
        addComment={addComment}
      />
    </div>
  );
}


