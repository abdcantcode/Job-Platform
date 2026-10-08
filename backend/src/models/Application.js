import mongoose from 'mongoose';

export const STATUSES = ['applied', 'interview', 'offer', 'rejected'];
export const JOB_TYPES = ['full-time', 'part-time', 'internship', 'contract'];
export const WORK_MODES = ['onsite', 'hybrid', 'remote'];

const statusEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    note: { type: String, trim: true, maxlength: 500, default: '' },
    changedAt: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

const applicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, required: true, trim: true, maxlength: 120 },
    location: { type: String, trim: true, maxlength: 120, default: '' },
    jobType: { type: String, enum: JOB_TYPES, default: 'full-time' },
    workMode: { type: String, enum: WORK_MODES, default: 'onsite' },
    salary: { type: String, trim: true, maxlength: 60, default: '' },
    jobUrl: { type: String, trim: true, maxlength: 500, default: '' },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },

    status: { type: String, enum: STATUSES, default: 'applied' },
    statusHistory: { type: [statusEntrySchema], default: [] },

    appliedAt: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now },
    lastReminderAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

applicationSchema.index({ user: 1, status: 1, appliedAt: -1 });
applicationSchema.index({ status: 1, lastActivityAt: 1 });

export default mongoose.model('Application', applicationSchema);
