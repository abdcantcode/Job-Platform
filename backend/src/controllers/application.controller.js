import asyncHandler from '../utils/asyncHandler.js';
import { validateApplication, validateStatusChange } from '../utils/validators.js';
import * as applications from '../services/application.service.js';
import { runReminders } from '../services/reminder.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await applications.listApplications(req.user._id, req.query));
});

export const stats = asyncHandler(async (req, res) => {
  res.json(await applications.getStats(req.user._id));
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ application: await applications.getApplication(req.user._id, req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  const data = validateApplication(req.body);
  const application = await applications.createApplication(req.user._id, data);
  res.status(201).json({ application });
});

export const update = asyncHandler(async (req, res) => {
  const data = validateApplication(req.body, { partial: true });
  const application = await applications.updateApplication(req.user._id, req.params.id, data);
  res.json({ application });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const change = validateStatusChange(req.body);
  const application = await applications.changeStatus(req.user._id, req.params.id, change);
  res.json({ application });
});

export const remove = asyncHandler(async (req, res) => {
  await applications.deleteApplication(req.user._id, req.params.id);
  res.status(204).end();
});

// Sends the reminder digest for the signed-in user right now (handy for testing SMTP).
export const sendRemindersNow = asyncHandler(async (req, res) => {
  res.json(await runReminders({ userId: req.user._id }));
});
