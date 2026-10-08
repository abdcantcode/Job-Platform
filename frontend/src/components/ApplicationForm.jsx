import { useState } from 'react';
import Field from './Field.jsx';
import { JOB_TYPES, STATUSES, STATUS_LABEL, WORK_MODES, fromDateInput, toDateInput } from '../utils/format.js';

const TEXT_KEYS = ['company', 'role', 'location', 'salary', 'jobUrl', 'notes'];

const blank = () => ({
  company: '',
  role: '',
  location: '',
  jobType: 'full-time',
  workMode: 'onsite',
  salary: '',
  jobUrl: '',
  appliedAt: toDateInput(new Date()),
  status: 'applied',
  notes: '',
});

const fromApplication = (application) => {
  const values = blank();
  for (const key of TEXT_KEYS) values[key] = application[key] ?? '';
  values.jobType = application.jobType;
  values.workMode = application.workMode;
  values.status = application.status;
  values.appliedAt = toDateInput(application.appliedAt);
  return values;
};

export default function ApplicationForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [values, setValues] = useState(() => (initial ? fromApplication(initial) : blank()));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const initialDate = initial ? toDateInput(initial.appliedAt) : null;

  const set = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validate = () => {
    const found = {};
    if (!values.company.trim()) found.company = 'Enter the company name.';
    if (!values.role.trim()) found.role = 'Enter the role you applied for.';
    if (values.jobUrl.trim() && !/^https?:\/\/\S+$/i.test(values.jobUrl.trim())) {
      found.jobUrl = 'Enter a link that starts with http:// or https://';
    }
    if (!values.appliedAt) found.appliedAt = 'Choose the date you applied.';
    return found;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    const payload = { ...values };
    if (values.appliedAt === initialDate) delete payload.appliedAt;
    else payload.appliedAt = fromDateInput(values.appliedAt);

    setBusy(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setErrors(error.details || {});
      setFormError(error.details ? 'Fix the highlighted fields and try again.' : error.message);
      setBusy(false);
    }
  };

  const bind = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: set,
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form className="form-stack" onSubmit={handleSubmit} noValidate>
      {formError && (
        <div className="alert" role="alert">
          {formError}
        </div>
      )}

      <div className="form-grid">
        <Field id="company" label="Company" error={errors.company}>
          <input className="input" autoFocus autoComplete="off" placeholder="Northwind Labs" {...bind('company')} />
        </Field>
        <Field id="role" label="Role" error={errors.role}>
          <input className="input" autoComplete="off" placeholder="Frontend Engineer" {...bind('role')} />
        </Field>

        <Field id="location" label="Location" error={errors.location}>
          <input className="input" autoComplete="off" placeholder="Hyderabad" {...bind('location')} />
        </Field>
        <Field id="salary" label="Salary" error={errors.salary}>
          <input className="input" autoComplete="off" placeholder="₹12–15 LPA" {...bind('salary')} />
        </Field>

        <Field id="jobType" label="Job type" error={errors.jobType}>
          <select className="select" {...bind('jobType')}>
            {JOB_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="workMode" label="Work mode" error={errors.workMode}>
          <select className="select" {...bind('workMode')}>
            {WORK_MODES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field id="appliedAt" label="Date applied" error={errors.appliedAt}>
          <input className="input" type="date" {...bind('appliedAt')} />
        </Field>
        <Field id="status" label="Status" error={errors.status}>
          <select className="select" {...bind('status')}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </Field>

        <Field id="jobUrl" label="Job link" error={errors.jobUrl} className="span-2">
          <input className="input" type="url" autoComplete="off" placeholder="https://" {...bind('jobUrl')} />
        </Field>

        <Field id="notes" label="Notes" error={errors.notes} className="span-2">
          <textarea
            className="textarea"
            rows={4}
            placeholder="Referral, recruiter name, interview prep, anything you want to remember."
            {...bind('notes')}
          />
        </Field>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy && <span className="spinner" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
