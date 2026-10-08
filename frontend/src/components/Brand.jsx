export default function Brand({ size = 28 }) {
  return (
    <span className="brand">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--primary)" />
        <rect x="7" y="9" width="18" height="3.5" rx="1.75" fill="var(--on-primary)" />
        <rect x="7" y="14.25" width="12" height="3.5" rx="1.75" fill="var(--on-primary)" opacity="0.8" />
        <rect x="7" y="19.5" width="6" height="3.5" rx="1.75" fill="var(--on-primary)" opacity="0.6" />
      </svg>
      Pipeline
    </span>
  );
}
