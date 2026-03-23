export const OPTION_COLORS = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'pink', 'teal', 'cyan', 'gray'];

export const OPTION_COLOR_CHOICES = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'orange', label: 'Orange' },
  { value: 'red', label: 'Red' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'teal', label: 'Teal' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'gray', label: 'Gray' },
];

const OPTION_COLOR_ALIASES = {
  violet: 'purple',
  sky: 'blue',
  gold: 'yellow',
  rose: 'pink',
  slate: 'gray',
};

export function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function formatDate(dateValue) {
  if (!dateValue) return 'No date';
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function formatDateTime(dateValue) {
  if (!dateValue) return 'Just now';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

export function addDaysToDateString(dateValue, days) {
  const baseDate = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
  if (Number.isNaN(baseDate.getTime())) return '';
  baseDate.setDate(baseDate.getDate() + days);
  return baseDate.toISOString().slice(0, 10);
}

export function parseIssuesInput(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getIssuesInputValue(task) {
  if (typeof task.issueDraft === 'string') return task.issueDraft;
  return (task.issues || []).join(', ');
}

export function toneClass(kind, value) {
  if (kind === 'priority') {
    return { High: 'toneHigh', Medium: 'toneMedium', Low: 'toneLow' }[value] || 'toneNeutral';
  }

  return {
    Assigned: 'toneSlate',
    'Survey Done': 'toneGold',
    QA: 'toneRose',
    Submitted: 'toneGreen',
  }[value] || 'toneNeutral';
}

export function makeAssessorId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function normalizeColumnOptions(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (typeof item === 'string') {
        return { label: item, color: OPTION_COLORS[index % OPTION_COLORS.length] };
      }

      if (!item?.label) return null;
      return {
        label: item.label,
        color: OPTION_COLOR_ALIASES[item.color] || item.color || OPTION_COLORS[index % OPTION_COLORS.length],
      };
    })
    .filter(Boolean);
}

export function getOptionTone(color) {
  return `optionTone${(color || 'gray').charAt(0).toUpperCase()}${(color || 'gray').slice(1)}`;
}

export function makeOption(label, color, index = 0) {
  return {
    label: String(label || '').trim(),
    color: color || OPTION_COLORS[index % OPTION_COLORS.length],
  };
}

export function parseStoredColumnValue(value) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return '';
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
}

export function serializeColumnValue(value) {
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return JSON.stringify(value);
  }
  return String(value ?? '');
}

export function columnValueToText(value) {
  if (Array.isArray(value)) return value.join(' ');
  if (value && typeof value === 'object') return Object.values(value).join(' ');
  return String(value ?? '');
}

export function makeNotification(title, body, type = 'info') {
  return {
    id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    body,
    type,
    created_at: new Date().toISOString(),
    read: false,
  };
}

export function makeNotificationKey(boardId, dedupeKey, createdAt) {
  const dayKey = String(createdAt || new Date().toISOString()).slice(0, 10);
  return `${boardId || 'board'}:${dedupeKey}:${dayKey}`;
}

export function formatDuration(minutes) {
  const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export function compareTasks(left, right) {
  const leftPosition = typeof left.position === 'number' ? left.position : Number.MAX_SAFE_INTEGER;
  const rightPosition = typeof right.position === 'number' ? right.position : Number.MAX_SAFE_INTEGER;
  if (leftPosition !== rightPosition) return leftPosition - rightPosition;

  const leftCreated = left.created_at ? new Date(left.created_at).getTime() : Number.MAX_SAFE_INTEGER;
  const rightCreated = right.created_at ? new Date(right.created_at).getTime() : Number.MAX_SAFE_INTEGER;
  if (leftCreated !== rightCreated) return leftCreated - rightCreated;

  return (left.title || '').localeCompare(right.title || '');
}
