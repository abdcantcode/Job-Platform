import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Briefcase, LayoutDashboard, LogOut, Menu, Plus } from 'lucide-react';
import Brand from './Brand.jsx';
import Modal from './Modal.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import ApplicationForm from './ApplicationForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../api/client.js';

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';

export default function Layout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();

  const [navOpen, setNavOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  // Pages refetch when this changes, so a new application shows up everywhere.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const createApplication = async (payload) => {
    await api.applications.create(payload);
    toast.success('Application added');
    setCreating(false);
    setRefreshKey((key) => key + 1);
  };

  return (
    <div className="shell">
      <aside className={`sidebar ${navOpen ? 'open' : ''}`} aria-label="Main navigation">
        <Brand />

        <button type="button" className="btn btn-primary sidebar-cta" onClick={() => setCreating(true)}>
          <Plus size={16} />
          New application
        </button>

        <nav className="nav">
          <NavLink to="/" end className="nav-link">
            <LayoutDashboard size={17} />
            Dashboard
          </NavLink>
          <NavLink to="/applications" className="nav-link">
            <Briefcase size={17} />
            Applications
          </NavLink>
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <span className="avatar" aria-hidden="true">
              {initials(user?.name)}
            </span>
            <div className="user-meta">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <div className="row">
            <button type="button" className="btn btn-secondary btn-sm spacer" onClick={logout}>
              <LogOut size={15} />
              Sign out
            </button>
            <ThemeToggle className="btn-sm" />
          </div>
        </div>
      </aside>

      <div className={`scrim ${navOpen ? 'open' : ''}`} onClick={() => setNavOpen(false)} aria-hidden="true" />

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <Brand size={24} />
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={() => setCreating(true)}
            aria-label="New application"
          >
            <Plus size={20} />
          </button>
        </header>

        <main className="content">
          <Outlet context={{ openCreate: () => setCreating(true), refreshKey }} />
        </main>
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="New application">
        <ApplicationForm
          onSubmit={createApplication}
          onCancel={() => setCreating(false)}
          submitLabel="Add application"
        />
      </Modal>
    </div>
  );
}
