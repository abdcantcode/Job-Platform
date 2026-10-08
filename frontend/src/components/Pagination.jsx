import { ChevronLeft, ChevronRight } from 'lucide-react';

const pageItems = (page, pages) => {
  const set = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (page >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((n) => set.add(n));

  const sorted = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const items = [];
  sorted.forEach((n, index) => {
    if (index > 0 && n - sorted[index - 1] > 1) items.push(`gap-${n}`);
    items.push(n);
  });
  return items;
};

export default function Pagination({ page, pages, total, limit, onChange }) {
  if (!total) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="pager">
      <span>
        Showing {from}–{to} of {total}
      </span>

      {pages > 1 && (
        <nav className="pager-nav" aria-label="Pagination">
          <button
            type="button"
            className="page-btn"
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          {pageItems(page, pages).map((item) =>
            typeof item === 'string' ? (
              <span key={item} className="page-gap" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className="page-btn"
                onClick={() => onChange(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${item}`}
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            className="page-btn"
            onClick={() => onChange(page + 1)}
            disabled={page >= pages}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}
