import Brand from './Brand.jsx';
import ThemeToggle from './ThemeToggle.jsx';

// A static illustration of the dashboard funnel, shown beside the sign-in forms.
const SAMPLE = [
  { status: 'applied', label: 'Applied', value: 24, width: 100 },
  { status: 'interview', label: 'Interviews', value: 7, width: 29 },
  { status: 'offer', label: 'Offers', value: 2, width: 8 },
];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth-aside">
        <Brand />

        <div>
          <h1 className="auth-headline">Know where every application stands.</h1>
          <p className="auth-lede">
            Follow each role from applied to offer, keep notes in one place, and get an email when an application
            goes quiet.
          </p>
        </div>

        <div className="auth-preview" aria-hidden="true">
          <div className="funnel">
            {SAMPLE.map((row) => (
              <div className="funnel-row" key={row.status} data-status={row.status}>
                <span className="funnel-label">{row.label}</span>
                <div className="funnel-bar">
                  <div className="funnel-fill" style={{ width: `${row.width}%` }} />
                </div>
                <div className="funnel-value">
                  <strong>{row.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="auth-main">
        <div className="auth-top">
          <span className="auth-brand-narrow">
            <Brand size={26} />
          </span>
          <span className="spacer" />
          <ThemeToggle />
        </div>

        <div className="auth-form-wrap">
          <h2 className="auth-title">{title}</h2>
          <p className="auth-sub">{subtitle}</p>
          {children}
          <p className="auth-alt">{footer}</p>
        </div>
      </section>
    </div>
  );
}
