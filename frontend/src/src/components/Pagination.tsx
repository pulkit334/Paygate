interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  currentPage,
  totalPages,
  total,
  onPageChange,
}: PaginationProps) => {
  const visiblePages = 10;

  const start = Math.max(
    1,
    Math.min(currentPage, totalPages - visiblePages + 1),
  );
  const end = Math.min(totalPages, start + visiblePages - 1);

  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return (
    <div className="flex items-center justify-center gap-6 mt-6">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm text-text-secondary bg-surface border border-border rounded-lg hover:text-text-primary hover:bg-bg-elevated transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Prev
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
              page === currentPage
                ? "bg-accent text-white border-accent"
                : "text-text-secondary bg-surface border-border hover:text-text-primary hover:bg-bg-elevated"
            }`}
          >
            {page}
          </button>
        ))}
        <span className="px-2 py-1.5 text-sm text-text-muted">...</span>
        <button
          onClick={() => onPageChange(totalPages)}
          className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
            totalPages === currentPage
              ? "bg-accent text-white border-accent"
              : "text-text-secondary bg-surface border-border hover:text-text-primary hover:bg-bg-elevated"
          }`}
        >
          {totalPages}
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm text-text-secondary bg-surface border-border rounded-lg hover:text-text-primary hover:bg-bg-elevated transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <p className="text-sm text-text-muted whitespace-nowrap">
        Page {currentPage} of {totalPages} · {total.toLocaleString()} total
      </p>
    </div>
  );
};

export default Pagination;
