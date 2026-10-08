export const STATUSES = ['applied', 'interview', 'offer', 'rejected'];

export const STATUS_LABEL = {
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

export const JOB_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
];

export const WORK_MODES = [
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
];

export const labelFor = (options, value) => options.find((o) => o.value === value)?.label ?? value;

const STAGE_RANK = { applied: 1, interview: 2, offer: 3, rejected: 0 };

/** Highest stage (1–3) an application has reached, including before a rejection. */
export const stageReached = (application) => {
  const ranks = [STAGE_RANK[application.status] ?? 0];
  for (const entry of application.statusHistory ?? []) ranks.push(STAGE_RANK[entry.status] ?? 0);
  return Math.max(1, ...ranks);
};

const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const weekFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });
const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export const formatDate = (value) => (value ? dateFormat.format(new Date(value)) : '—');
export const formatDateTime = (value) => (value ? dateTimeFormat.format(new Date(value)) : '—');
export const formatWeek = (value) => weekFormat.format(new Date(value));

export const timeAgo = (value) => {
  const seconds = (new Date(value).getTime() - Date.now()) / 1000;
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return 'just now';
};

export const daysSince = (value) => Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 86400000), 0);

export const plural = (count, singular, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

export const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

// Date inputs work in local calendar days; send local noon so the day never shifts across time zones.
export const toDateInput = (value) => {
  const d = new Date(value);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

export const fromDateInput = (value) => new Date(`${value}T12:00:00`).toISOString();

export const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const todayLabel = () =>
  new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
