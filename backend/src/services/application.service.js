import Application, { STATUSES, JOB_TYPES } from '../models/Application.js';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_STATUSES = ['applied', 'interview'];

const SORTS = {
  newest: { appliedAt: -1, _id: -1 },
  oldest: { appliedAt: 1, _id: 1 },
  updated: { lastActivityAt: -1, _id: -1 },
  company: { company: 1, _id: 1 },
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getApplication = async (userId, id) => {
  const application = await Application.findOne({ _id: id, user: userId });
  if (!application) throw new ApiError(404, 'Application not found.');
  return application;
};

export const listApplications = async (userId, query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);

  const filter = { user: userId };
  if (STATUSES.includes(query.status)) filter.status = query.status;
  if (JOB_TYPES.includes(query.jobType)) filter.jobType = query.jobType;

  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 80) : '';
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ company: pattern }, { role: pattern }, { location: pattern }];
  }

  const sort = SORTS[query.sort] || SORTS.newest;

  const [items, total] = await Promise.all([
    Application.find(filter)
      .sort(sort)
      .collation({ locale: 'en', strength: 2 })
      .skip((page - 1) * limit)
      .limit(limit)
      // The list only needs the stage reached, not notes or timeline text.
      .select('-notes -statusHistory.note -statusHistory.changedAt'),
    Application.countDocuments(filter),
  ]);

  return {
    items,
    pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
  };
};

export const createApplication = async (userId, data) => {
  const now = new Date();
  const status = data.status || 'applied';
  const appliedAt = data.appliedAt || now;

  return Application.create({
    ...data,
    user: userId,
    status,
    appliedAt,
    lastActivityAt: now,
    statusHistory: [
      {
        status,
        note: status === 'applied' ? 'Application submitted' : 'Added to your tracker',
        changedAt: appliedAt,
      },
    ],
  });
};

export const updateApplication = async (userId, id, data) => {
  const application = await getApplication(userId, id);
  const { status, ...fields } = data;

  Object.assign(application, fields);

  if (status && status !== application.status) {
    application.status = status;
    application.statusHistory.push({ status, note: '' });
  }

  // Any edit counts as an update, so the stale-reminder clock restarts.
  application.lastActivityAt = new Date();
  application.lastReminderAt = null;

  return application.save();
};

export const changeStatus = async (userId, id, { status, note }) => {
  const application = await getApplication(userId, id);

  if (application.status === status) {
    throw new ApiError(400, `This application is already marked as ${status}.`, {
      status: `Already ${status}.`,
    });
  }

  application.status = status;
  application.statusHistory.push({ status, note });
  application.lastActivityAt = new Date();
  application.lastReminderAt = null;

  return application.save();
};

export const deleteApplication = async (userId, id) => {
  const deleted = await Application.findOneAndDelete({ _id: id, user: userId });
  if (!deleted) throw new ApiError(404, 'Application not found.');
};

const startOfWeekUTC = (date) => {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7)); // Monday
  return day;
};

export const getStats = async (userId) => {
  const { staleDays } = env.reminder;
  const staleCutoff = new Date(Date.now() - staleDays * DAY_MS);

  const WEEKS = 8;
  const thisWeek = startOfWeekUTC(new Date());
  const firstWeek = new Date(thisWeek.getTime() - (WEEKS - 1) * 7 * DAY_MS);

  const staleFilter = {
    user: userId,
    status: { $in: ACTIVE_STATUSES },
    lastActivityAt: { $lte: staleCutoff },
  };

  const [totals, recentApplied, followUps, followUpCount, recent] = await Promise.all([
    Application.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          applied: { $sum: { $cond: [{ $eq: ['$status', 'applied'] }, 1, 0] } },
          interview: { $sum: { $cond: [{ $eq: ['$status', 'interview'] }, 1, 0] } },
          offer: { $sum: { $cond: [{ $eq: ['$status', 'offer'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          // Applications that reached an interview at any point.
          interviewed: {
            $sum: {
              $cond: [{ $in: ['interview', { $ifNull: ['$statusHistory.status', []] }] }, 1, 0],
            },
          },
        },
      },
    ]),
    Application.find({ user: userId, appliedAt: { $gte: firstWeek } }).select('appliedAt'),
    Application.find(staleFilter)
      .sort({ lastActivityAt: 1 })
      .limit(5)
      .select('company role status lastActivityAt'),
    Application.countDocuments(staleFilter),
    Application.find({ user: userId })
      .sort({ lastActivityAt: -1 })
      .limit(5)
      .select('company role status lastActivityAt'),
  ]);

  const t = totals[0] || {};
  const total = t.total || 0;
  const byStatus = {
    applied: t.applied || 0,
    interview: t.interview || 0,
    offer: t.offer || 0,
    rejected: t.rejected || 0,
  };
  // A response is any application that has moved past "applied".
  const responses = byStatus.interview + byStatus.offer + byStatus.rejected;

  const weekly = Array.from({ length: WEEKS }, (_, i) => ({
    weekStart: new Date(firstWeek.getTime() + i * 7 * DAY_MS).toISOString(),
    count: 0,
  }));
  for (const { appliedAt } of recentApplied) {
    const index = Math.floor((appliedAt.getTime() - firstWeek.getTime()) / (7 * DAY_MS));
    if (index >= 0 && index < WEEKS) weekly[index].count += 1;
  }

  return {
    total,
    byStatus,
    responses,
    interviews: t.interviewed || 0,
    offers: byStatus.offer,
    responseRate: total ? Math.round((responses / total) * 100) : 0,
    weekly,
    staleDays,
    followUpCount,
    followUps,
    recent,
  };
};
