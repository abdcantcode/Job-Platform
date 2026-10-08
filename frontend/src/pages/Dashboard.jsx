import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { BellRing, Briefcase, Clock, Plus } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import usePageTitle from '../hooks/usePageTitle.js';
import { daysSince, formatWeek, greeting, percent, plural, timeAgo, todayLabel } from '../utils/format.js';

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <div className="skeleton" style={{ height: 96, marginBottom: 16, borderRadius: 12 }} />
      <div className="grid-main">
        <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
      </div>
    </div>
  );
}

function Funnel({ stats }) {
  const { total, interviews, offers, byStatus } = stats;

  const rows = [
    { status: 'applied', label: 'Applied', value: total, note: 'all applications' },
    { status: 'interview', label: 'Interviews', value: interviews, note: `${percent(interviews, total)}% of applied` },
    { status: 'offer', label: 'Offers', value: offers, note: `${percent(offers, total)}% of applied` },
  ];

  return (
    <div className="card">
      <div className="card-head">
        <h2 className="card-title">Pipeline</h2>
        <span className="card-sub">How far your applications get</span>
      </div>
      <div className="card-body">
        <div className="funnel">
          {rows.map((row) => {
            const width = total ? (row.value / total) * 100 : 0;
            const tip = `${row.label}: ${row.value} (${percent(row.value, total)}% of applications)`;
            return (
              <div className="funnel-row" key={row.status} data-status={row.status}>
                <span className="funnel-label">{row.label}</span>
                <div className="funnel-bar has-tip" data-tip={tip} tabIndex={0} role="img" aria-label={tip}>
                  <div className="funnel-fill" style={{ width: `${width}%` }} />
                </div>
                <div className="funnel-value">
                  <strong>{row.value}</strong>
                  <span>{row.note}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="funnel-foot">
          <span>
            <StatusBadge status="applied" />
            <b>{byStatus.applied}</b> waiting to hear back
          </span>
          <span>
            <StatusBadge status="rejected" />
            <b>{byStatus.rejected}</b> closed
          </span>
        </div>
      </div>
    </div>
  );
}

function WeeklyChart({ weekly }) {
  const max = Math.max(...weekly.map((week) => week.count), 1);

  return (
    <div className="card">
      <div className="card-head">
        <h2 className="card-title">Applications per week</h2>
        <span className="card-sub">Last 8 weeks</span>
      </div>
      <div className="card-body">
        <div className="weekly" role="group" aria-label="Applications per week, last 8 weeks">
          {weekly.map((week, index) => {
            const ratio = week.count / max;
            const tip = `Week of ${formatWeek(week.weekStart)}: ${plural(week.count, 'application')}`;
            return (
              <div className="week has-tip" key={week.weekStart} data-tip={tip} tabIndex={0} aria-label={tip}>
                <div className="week-slot">
                  <span className="week-count">{week.count}</span>
                  <div
                    className="week-bar"
                    data-current={index === weekly.length - 1}
                    style={{
                      height: week.count ? `calc((100% - 26px) * ${ratio})` : 0,
                      minHeight: week.count ? 3 : 0,
                    }}
                  />
                </div>
                <span className="week-label">{formatWeek(week.weekStart)}</span>
              </div>
            );
          })}
        </div>

        <table className="sr-only">
          <caption>Applications per week</caption>
          <thead>
            <tr>
              <th>Week starting</th>
              <th>Applications</th>
            </tr>
          </thead>
          <tbody>
            {weekly.map((week) => (
              <tr key={week.weekStart}>
                <td>{formatWeek(week.weekStart)}</td>
                <td>{week.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Dashboard() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const { openCreate, refreshKey } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;

    api.applications
      .stats()
      .then((data) => {
        if (ignore) return;
        setStats(data);
        setError('');
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });

    return () => {
      ignore = true;
    };
  }, [refreshKey, attempt]);

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {greeting()}, {firstName}
          </h1>
          <p className="page-sub">{todayLabel()}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} />
          New application
        </button>
      </div>

      {error && !stats && (
        <div className="card">
          <EmptyState
            title="Couldn’t load your dashboard"
            action={
              <button type="button" className="btn btn-secondary" onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </button>
            }
          >
            {error}
          </EmptyState>
        </div>
      )}

      {!error && !stats && <DashboardSkeleton />}

      {stats && stats.total === 0 && (
        <div className="card">
          <EmptyState
            icon={Briefcase}
            title="Add your first application"
            action={
              <button type="button" className="btn btn-primary" onClick={openCreate}>
                <Plus size={16} />
                New application
              </button>
            }
          >
            Log a role you’ve applied for and Pipeline will track it from applied to offer.
          </EmptyState>
        </div>
      )}

      {stats && stats.total > 0 && (
        <>
          <section className="metrics" aria-label="Summary">
            <div className="metric">
              <div className="metric-label">Applications</div>
              <div className="metric-value">{stats.total}</div>
              <div className="metric-note">{stats.byStatus.applied} waiting to hear back</div>
            </div>
            <div className="metric">
              <div className="metric-label">Responses</div>
              <div className="metric-value">{stats.responses}</div>
              <div className="metric-note">{stats.responseRate}% response rate</div>
            </div>
            <div className="metric">
              <div className="metric-label">Interviews</div>
              <div className="metric-value">{stats.interviews}</div>
              <div className="metric-note">
                {stats.byStatus.interview ? `${stats.byStatus.interview} in progress` : 'None in progress'}
              </div>
            </div>
            <div className="metric">
              <div className="metric-label">Offers</div>
              <div className="metric-value">{stats.offers}</div>
              <div className="metric-note">{percent(stats.offers, stats.total)}% of applications</div>
            </div>
          </section>

          <div className="grid-main">
            <Funnel stats={stats} />
            <WeeklyChart weekly={stats.weekly} />
          </div>

          <div className="grid-main">
            <div className="card">
              <div className="card-head">
                <h2 className="card-title">Needs a follow-up</h2>
                {stats.followUpCount > 0 && <span className="card-sub">{stats.followUpCount} idle</span>}
              </div>
              {stats.followUps.length === 0 ? (
                <p className="list-empty" style={{ paddingTop: 12 }}>
                  Nothing is overdue. Applications show up here after {plural(stats.staleDays, 'day')} without an
                  update.
                </p>
              ) : (
                <div className="card-body flush">
                  <div className="list">
                    {stats.followUps.map((application) => (
                      <Link className="list-item" key={application.id} to={`/applications/${application.id}`}>
                        <div className="grow">
                          <div className="cell-title truncate">{application.company}</div>
                          <div className="cell-sub truncate">{application.role}</div>
                        </div>
                        <span className="faint nowrap row">
                          <Clock size={14} />
                          {plural(daysSince(application.lastActivityAt), 'day')} idle
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <div className="card-foot row">
                <BellRing size={14} />
                We email you when an application has had no update for {plural(stats.staleDays, 'day')}.
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <h2 className="card-title">Recent activity</h2>
              </div>
              <div className="card-body flush">
                <div className="list">
                  {stats.recent.map((application) => (
                    <Link className="list-item" key={application.id} to={`/applications/${application.id}`}>
                      <div className="grow">
                        <div className="cell-title truncate">{application.company}</div>
                        <div className="cell-sub">{timeAgo(application.lastActivityAt)}</div>
                      </div>
                      <StatusBadge status={application.status} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
