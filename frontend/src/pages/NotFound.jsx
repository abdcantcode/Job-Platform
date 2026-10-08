import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function NotFound() {
  usePageTitle('Page not found');

  return (
    <div className="splash">
      <EmptyState
        icon={Compass}
        title="This page doesn’t exist"
        action={
          <Link className="btn btn-primary" to="/">
            Go to dashboard
          </Link>
        }
      >
        The link may be broken, or the page may have moved.
      </EmptyState>
    </div>
  );
}
