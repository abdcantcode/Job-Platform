import cron from 'node-cron';
import env from '../config/env.js';
import Application from '../models/Application.js';
import { isMailConfigured, sendMail } from './mail.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const daysSince = (date) => Math.max(Math.floor((Date.now() - new Date(date).getTime()) / DAY_MS), 0);

const appLink = (id) => `${env.clientUrls[0]}/applications/${id}`;

const buildEmail = (user, applications) => {
  const count = applications.length;
  const subject =
    count === 1
      ? `1 application hasn't had an update in ${env.reminder.staleDays}+ days`
      : `${count} applications haven't had an update in ${env.reminder.staleDays}+ days`;

  const lines = applications.map(
    (app) =>
      `• ${app.role} at ${app.company} (${app.status}) — no update for ${daysSince(app.lastActivityAt)} days\n  ${appLink(app.id)}`
  );
  const text = `Hi ${user.name},\n\nThese applications could use a follow-up:\n\n${lines.join('\n\n')}\n\nUpdate an application's status to stop its reminders.`;

  const rows = applications
    .map(
      (app) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
            <a href="${appLink(app.id)}" style="color:#0f1b2d;font-weight:600;text-decoration:none;">${escapeHtml(app.role)}</a>
            <div style="color:#5b6577;font-size:13px;margin-top:2px;">${escapeHtml(app.company)} · ${escapeHtml(app.status)}</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#5b6577;font-size:13px;white-space:nowrap;">
            ${daysSince(app.lastActivityAt)} days idle
          </td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f1b2d;">
      <h2 style="margin:0 0 4px;font-size:20px;">Time to follow up</h2>
      <p style="margin:0 0 20px;color:#5b6577;">Hi ${escapeHtml(user.name)}, these applications haven't changed in ${env.reminder.staleDays}+ days.</p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <p style="margin:20px 0 0;color:#5b6577;font-size:13px;">Update an application's status and its reminders stop.</p>
    </div>`;

  return { subject, text, html };
};

/**
 * Emails a digest of stale applications (active, idle for N days, not reminded
 * within the last N days). Pass userId to limit it to one person.
 */
export const runReminders = async ({ userId } = {}) => {
  if (!isMailConfigured()) {
    console.warn('[reminders] SMTP is not configured — skipping.');
    return { skipped: true, reason: 'SMTP is not configured.', sent: 0, failed: 0, applications: 0 };
  }

  const cutoff = new Date(Date.now() - env.reminder.staleDays * DAY_MS);
  const filter = {
    status: { $in: ['applied', 'interview'] },
    lastActivityAt: { $lte: cutoff },
    $or: [{ lastReminderAt: null }, { lastReminderAt: { $lte: cutoff } }],
  };
  if (userId) filter.user = userId;

  const stale = await Application.find(filter).sort({ lastActivityAt: 1 }).populate('user', 'name email');

  const byUser = new Map();
  for (const application of stale) {
    if (!application.user) continue;
    const key = String(application.user._id);
    if (!byUser.has(key)) byUser.set(key, { user: application.user, applications: [] });
    byUser.get(key).applications.push(application);
  }

  let sent = 0;
  let failed = 0;

  for (const { user, applications } of byUser.values()) {
    try {
      await sendMail({ to: user.email, ...buildEmail(user, applications) });
      await Application.updateMany(
        { _id: { $in: applications.map((a) => a._id) } },
        { $set: { lastReminderAt: new Date() } }
      );
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error(`[reminders] Could not email ${user.email}: ${error.message}`);
    }
  }

  console.log(`[reminders] ${sent} email(s) sent, ${failed} failed, ${stale.length} application(s) matched.`);
  return { sent, failed, applications: stale.length };
};

export const startReminderJob = () => {
  const { cron: expression, timezone } = env.reminder;

  if (!cron.validate(expression)) {
    console.warn(`[reminders] Invalid REMINDER_CRON "${expression}" — reminders are disabled.`);
    return null;
  }

  const task = cron.schedule(
    expression,
    () => runReminders().catch((error) => console.error('[reminders] Job failed:', error)),
    { timezone }
  );

  console.log(
    `[reminders] Scheduled "${expression}" (${timezone}). SMTP ${isMailConfigured() ? 'ready' : 'not configured yet'}.`
  );
  return task;
};
