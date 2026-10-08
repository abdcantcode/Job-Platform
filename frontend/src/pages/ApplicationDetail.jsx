import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileQuestion, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api/client.js';
import ApplicationForm from '../components/ApplicationForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Field from '../components/Field.jsx';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import usePageTitle from '../hooks/usePageTitle.js';
import {
  JOB_TYPES,
  STATUSES,
  STATUS_LABEL,
  WORK_MODES,
  formatDate,
  formatDateTime,
  labelFor,
  timeAgo,
} from '../utils/format.js';

const hostname = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

function StatusUpdater({ application, onChanged }) {
  const toast = useToast();
  const [status, setStatus] = useState(application.status);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus(application.status);
  }, [application.status]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { application: updated } = await api.applications.changeStatus(application.id, { status, note });
      setNote('');
      onChanged(updated);
      toast.success(`Marked as ${STATUS_LABEL[status].toLowerCase()}`);
    } catch (err) {
      setError(err.details?.note || err.details?.status || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="status-picker" role="group" aria-label="New status">
        {STATUSES.map((value) => (
          <button
            key={value}
            type="button"
            className="status-option"
            data-status={value}
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
          >
            {STATUS_LABEL[value]}
          </button>
        ))}
      </div>

      <Field id="status-note" label="Note" hint="Optional. Shown on the timeline.">
        <textarea
          id="status-note"
          className="textarea"
          rows={2}
          maxLength={500}
          placeholder="Recruiter called, technical round on Friday"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={busy || status === application.status}>
        {busy && <span className="spinner" />}
        Update status
      </button>
    </form>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshKey } = useOutletContext();

  const [application, setApplication] = useState(null);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  usePageTitle(application ? `${application.company}, ${application.role}` : 'Application');

  useEffect(() => {
    let ignore = false;
    setState('loading');

    api.applications
      .get(id)
      .then(({ application: found }) => {
        if (ignore) return;
        setApplication(found);
        setState('ready');
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.message);
        setState(err.status === 404 ? 'missing' : 'error');
      });

    return () => {
      ignore = true;
    };
  }, [id, refreshKey]);

  const saveEdits = async (payload) => {
    const { application: updated } = await api.applications.update(id, payload);
    setApplication(updated);
    setEditing(false);
    toast.success('Changes saved');
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.applications.remove(id);
      toast.success('Application deleted');
      navigate('/applications', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  if (state === 'loading') {
    return (
      <div aria-busy="true" aria-label="Loading application">
        <div className="skeleton" style={{ height: 40, width: 280, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 12 }} />
      </div>
    );
  }

  if (state !== 'ready') {
    return (
      <div className="card">
        <EmptyState
          icon={FileQuestion}
          title={state === 'missing' ? 'Application not found' : 'Couldn’t load this application'}
          action={
            <Link className="btn btn-secondary" to="/applications">
              Back to applications
            </Link>
          }
        >
          {state === 'missing' ? 'It may have been deleted, or the link is wrong.' : error}
        </EmptyState>
      </div>
    );
  }

  const timeline = [...application.statusHistory].sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

  return (
    <>
      <Link className="back" to="/applications">
        <ArrowLeft size={16} />
        Applications
      </Link>

      <div className="detail-head">
        <div>
          <div className="detail-title">
            <h1 className="page-title">{application.company}</h1>
            <StatusBadge status={application.status} />
          </div>
          <p className="page-sub">{application.role}</p>
        </div>

        <div className="row">
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
            <Pencil size={15} />
            Edit
          </button>
          <button type="button" className="btn btn-danger-quiet" onClick={() => setConfirmingDelete(true)}>
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Details</h2>
          </div>
          <div className="card-body">
            <dl className="facts">
              <div className="fact">
                <dt>Location</dt>
                <dd>{application.location || '—'}</dd>
              </div>
              <div className="fact">
                <dt>Job type</dt>
                <dd>{labelFor(JOB_TYPES, application.jobType)}</dd>
              </div>
              <div className="fact">
                <dt>Work mode</dt>
                <dd>{labelFor(WORK_MODES, application.workMode)}</dd>
              </div>
              <div className="fact">
                <dt>Salary</dt>
                <dd>{application.salary || '—'}</dd>
              </div>
              <div className="fact">
                <dt>Date applied</dt>
                <dd>{formatDate(application.appliedAt)}</dd>
              </div>
              <div className="fact">
                <dt>Last update</dt>
                <dd>{timeAgo(application.lastActivityAt)}</dd>
              </div>
              <div className="fact" style={{ gridColumn: '1 / -1' }}>
                <dt>Job link</dt>
                <dd>
                  {application.jobUrl ? (
                    <a
                      className="link row"
                      style={{ display: 'inline-flex' }}
                      href={application.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {hostname(application.jobUrl)}
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>

            {application.notes && (
              <div className="notes">
                <h3>Notes</h3>
                <p>{application.notes}</p>
              </div>
            )}
          </div>
        </section>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Update status</h2>
            </div>
            <div className="card-body">
              <StatusUpdater application={application} onChanged={setApplication} />
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Timeline</h2>
            </div>
            <div className="card-body">
              <ol className="timeline">
                {timeline.map((entry) => (
                  <li className="tl-item" key={entry.id} data-status={entry.status}>
                    <span className="tl-dot" />
                    <div className="tl-title">{STATUS_LABEL[entry.status]}</div>
                    {entry.note && <div className="tl-note">{entry.note}</div>}
                    <div className="tl-time">{formatDateTime(entry.changedAt)}</div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit application">
        <ApplicationForm
          initial={application}
          onSubmit={saveEdits}
          onCancel={() => setEditing(false)}
          submitLabel="Save changes"
        />
      </Modal>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this application?"
        message={`${application.role} at ${application.company} and its timeline will be removed. This can’t be undone.`}
        confirmLabel="Delete application"
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
}
