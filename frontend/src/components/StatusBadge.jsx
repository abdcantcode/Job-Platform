import { STATUS_LABEL, stageReached } from '../utils/format.js';

export default function StatusBadge({ status }) {
  return (
    <span className="badge" data-status={status}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// Three pips (applied, interview, offer) filled up to the furthest stage reached.
export function StageTrack({ application }) {
  const reached = stageReached(application);
  const labels = ['Applied', 'Interview', 'Offer'];

  return (
    <span
      className="track"
      data-status={application.status}
      role="img"
      aria-label={`Reached stage ${reached} of 3: ${labels[reached - 1]}`}
    >
      {[1, 2, 3].map((stage) => (
        <i key={stage} className={stage <= reached ? 'on' : ''} />
      ))}
    </span>
  );
}
