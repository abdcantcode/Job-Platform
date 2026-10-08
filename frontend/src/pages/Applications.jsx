import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { Briefcase, Plus, Search, SearchX } from 'lucide-react';
import { api } from '../api/client.js';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import StatusBadge, { StageTrack } from '../components/StatusBadge.jsx';
import useDebounce from '../hooks/useDebounce.js';
import usePageTitle from '../hooks/usePageTitle.js';
import { JOB_TYPES, STATUSES, STATUS_LABEL, WORK_MODES, formatDate, labelFor, plural, timeAgo } from '../utils/format.js';

const PAGE_SIZE = 10;

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'company', label: 'Company A–Z' },
];

function TableSkeleton() {
  return (
    <div style={{ padding: 16, display: 'grid', gap: 14 }} aria-busy="true" aria-label="Loading applications">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="skeleton" style={{ height: 44 }} />
      ))}
    </div>
  );
}

export default function Applications() {
  usePageTitle('Applications');
  const navigate = useNavigate();
  const { openCreate, refreshKey } = useOutletContext();
  const [params, setParams] = useSearchParams();

  const q = params.get('q') || '';
  const status = STATUSES.includes(params.get('status')) ? params.get('status') : '';
  const type = JOB_TYPES.some((t) => t.value === params.get('type')) ? params.get('type') : '';
  const sort = SORTS.some((s) => s.value === params.get('sort')) ? params.get('sort') : 'newest';
  const page = Math.max(parseInt(params.get('page'), 10) || 1, 1);

  const update = useCallback(
    (changes) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            const isDefault = value === '' || value == null || (key === 'page' && value === 1) || (key === 'sort' && value === 'newest');
            if (isDefault) next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const [searchInput, setSearchInput] = useState(q);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next !== q) update({ q: next, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Keep the box in step with the URL (back / forward, "clear filters").
  useEffect(() => {
    setSearchInput((current) => (current.trim() === q ? current : q));
  }, [q]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  // react-router's setSearchParams changes identity with the URL; read it through a ref.
  const updateRef = useRef(update);
  updateRef.current = update;

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    api.applications
      .list({ search: q, status, jobType: type, sort, page, limit: PAGE_SIZE })
      .then((result) => {
        if (ignore) return;
        setData(result);
        setError('');
        if (page > result.pagination.pages) updateRef.current({ page: result.pagination.pages });
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [q, status, type, sort, page, refreshKey, attempt]);

  const hasFilters = Boolean(q || status || type);
  const clearFilters = () => {
    setSearchInput('');
    setParams({}, { replace: true });
  };

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-sub">
            {pagination ? (hasFilters ? `${plural(pagination.total, 'match', 'matches')}` : plural(pagination.total, 'application')) : ' '}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} />
          New application
        </button>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="input-wrap">
            <Search size={16} />
            <input
              className="input"
              type="search"
              placeholder="Search company, role or location"
              aria-label="Search applications"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <div className="segmented" role="group" aria-label="Filter by status">
            <button type="button" aria-pressed={!status} onClick={() => update({ status: '', page: 1 })}>
              All
            </button>
            {STATUSES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={status === value}
                onClick={() => update({ status: value, page: 1 })}
              >
                {STATUS_LABEL[value]}
              </button>
            ))}
          </div>

          <span className="spacer" />

          <select
            className="select select-sm"
            aria-label="Filter by job type"
            value={type}
            onChange={(event) => update({ type: event.target.value, page: 1 })}
          >
            <option value="">All types</option>
            {JOB_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="select select-sm"
            aria-label="Sort applications"
            value={sort}
            onChange={(event) => update({ sort: event.target.value, page: 1 })}
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error && !data && (
          <EmptyState
            title="Couldn’t load applications"
            action={
              <button type="button" className="btn btn-secondary" onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </button>
            }
          >
            {error}
          </EmptyState>
        )}

        {!error && !data && <TableSkeleton />}

        {data && items.length === 0 && !hasFilters && (
          <EmptyState
            icon={Briefcase}
            title="No applications yet"
            action={
              <button type="button" className="btn btn-primary" onClick={openCreate}>
                <Plus size={16} />
                New application
              </button>
            }
          >
            Add the roles you’ve applied for and track each one through to an offer.
          </EmptyState>
        )}

        {data && items.length === 0 && hasFilters && (
          <EmptyState
            icon={SearchX}
            title="No matching applications"
            action={
              <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                Clear filters
              </button>
            }
          >
            Try a different search term or remove a filter.
          </EmptyState>
        )}

        {items.length > 0 && (
          <div className="table-wrap">
            <table className={`table ${loading ? 'table-busy' : ''}`}>
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Status</th>
                  <th className="col-lg">Progress</th>
                  <th className="col-md">Location</th>
                  <th className="col-sm">Applied</th>
                  <th className="col-lg">Last update</th>
                </tr>
              </thead>
              <tbody>
                {items.map((application) => (
                  <tr key={application.id} onClick={() => navigate(`/applications/${application.id}`)}>
                    <td>
                      <Link
                        className="cell-title"
                        to={`/applications/${application.id}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {application.company}
                      </Link>
                      <div className="cell-sub">{application.role}</div>
                    </td>
                    <td>
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="col-lg">
                      <StageTrack application={application} />
                    </td>
                    <td className="col-md">
                      <div>{application.location || '—'}</div>
                      <div className="cell-sub">{labelFor(WORK_MODES, application.workMode)}</div>
                    </td>
                    <td className="col-sm nowrap">{formatDate(application.appliedAt)}</td>
                    <td className="col-lg nowrap muted">{timeAgo(application.lastActivityAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && items.length > 0 && (
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onChange={(next) => update({ page: next })}
          />
        )}
      </div>
    </>
  );
}
