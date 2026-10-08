import ApiError from './ApiError.js';
import { STATUSES, JOB_TYPES, WORK_MODES } from '../models/Application.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/\S+$/i;

const str = (value) => (typeof value === 'string' ? value.trim() : '');

const failIfErrors = (errors) => {
  if (Object.keys(errors).length) {
    throw new ApiError(400, 'Please fix the highlighted fields.', errors);
  }
};

export const validateRegister = (body = {}) => {
  const errors = {};
  const name = str(body.name);
  const email = str(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';

  if (name.length < 2 || name.length > 60) errors.name = 'Enter your name (2–60 characters).';
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  if (password.length < 8) errors.password = 'Use at least 8 characters.';
  if (password.length > 72) errors.password = 'Use 72 characters or fewer.';

  failIfErrors(errors);
  return { name, email, password };
};

export const validateLogin = (body = {}) => {
  const errors = {};
  const email = str(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';

  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Enter your password.';

  failIfErrors(errors);
  return { email, password };
};

const TEXT_FIELDS = {
  company: { required: true, max: 120 },
  role: { required: true, max: 120 },
  location: { max: 120 },
  salary: { max: 60 },
  jobUrl: { max: 500 },
  notes: { max: 2000 },
};

const ENUM_FIELDS = {
  status: STATUSES,
  jobType: JOB_TYPES,
  workMode: WORK_MODES,
};

/**
 * Validates and normalises an application payload.
 * `partial` skips the required-field check (used for updates).
 */
export const validateApplication = (body = {}, { partial = false } = {}) => {
  const errors = {};
  const data = {};

  for (const [key, rule] of Object.entries(TEXT_FIELDS)) {
    if (body[key] === undefined) {
      if (rule.required && !partial) errors[key] = 'This field is required.';
      continue;
    }
    const value = str(body[key]);
    if (rule.required && !value) errors[key] = 'This field is required.';
    else if (value.length > rule.max) errors[key] = `Use ${rule.max} characters or fewer.`;
    else data[key] = value;
  }

  if (data.jobUrl && !URL_RE.test(data.jobUrl)) {
    errors.jobUrl = 'Enter a link that starts with http:// or https://';
  }

  for (const [key, allowed] of Object.entries(ENUM_FIELDS)) {
    if (body[key] === undefined) continue;
    if (!allowed.includes(body[key])) errors[key] = `Choose one of: ${allowed.join(', ')}.`;
    else data[key] = body[key];
  }

  if (body.appliedAt !== undefined && body.appliedAt !== '' && body.appliedAt !== null) {
    const date = new Date(body.appliedAt);
    if (Number.isNaN(date.getTime())) errors.appliedAt = 'Enter a valid date.';
    else data.appliedAt = date;
  }

  failIfErrors(errors);
  return data;
};

export const validateStatusChange = (body = {}) => {
  const errors = {};
  const note = str(body.note);

  if (!STATUSES.includes(body.status)) errors.status = `Choose one of: ${STATUSES.join(', ')}.`;
  if (note.length > 500) errors.note = 'Use 500 characters or fewer.';

  failIfErrors(errors);
  return { status: body.status, note };
};
