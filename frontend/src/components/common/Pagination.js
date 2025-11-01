import React, { useState, useMemo, useEffect } from 'react';

const DOTS = 'DOTS';

function range(start, end) {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
}

// Generator nomor halaman dengan boundaryCount (awal/akhir) dan siblingCount di sekitar current
function getPageNumbers(totalPages, currentPage, siblingCount = 2, boundaryCount = 1) {
  if (!totalPages || totalPages <= 0) return [];

  const totalPageNumbers = boundaryCount * 2 + siblingCount * 2 + 3; // first, last, current
  const totalWithDots = totalPageNumbers + 2; // tambahan dua DOTS ketika perlu

  // Jika total halaman kecil, tampilkan semua tanpa DOTS
  if (totalPages <= totalWithDots) {
    return range(1, totalPages);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftDots = leftSiblingIndex > boundaryCount + 2;
  const showRightDots = rightSiblingIndex < totalPages - boundaryCount - 1;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  // Tidak perlu DOTS kiri, tapi perlu DOTS kanan
  if (!showLeftDots && showRightDots) {
    // 1 sampai window kiri tetap penuh
    const leftItemCount = 1 + siblingCount * 2 + 2; // first + (current window penuh)
    const leftRange = range(1, leftItemCount);
    return [...leftRange, DOTS, lastPageIndex];
  }

  // Perlu DOTS kiri, tapi tidak perlu DOTS kanan
  if (showLeftDots && !showRightDots) {
    const rightItemCount = 1 + siblingCount * 2 + 2;
    const rightRange = range(totalPages - rightItemCount + 1, totalPages);
    return [firstPageIndex, DOTS, ...rightRange];
  }

  // Perlu DOTS kiri dan kanan
  if (showLeftDots && showRightDots) {
    const middleRange = range(leftSiblingIndex, rightSiblingIndex);
    return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
  }

  // Default fallback
  return range(1, totalPages);
}

const Pagination = ({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSizeOptions = true,
  showJumpToPage = true,
  // maxVisiblePages dipertahankan untuk kompatibilitas, tidak digunakan langsung oleh generator baru
  maxVisiblePages = 10
}) => {
  const [jumpToPage, setJumpToPage] = useState('');

  // Buat daftar halaman berdasarkan totalPages/currentPage
  const pages = useMemo(() => {
    return getPageNumbers(Number(totalPages) || 0, Number(currentPage) || 1, 2, 1);
  }, [totalPages, currentPage]);

  // Logging sederhana untuk diagnosis
  useEffect(() => {
    try {
      // Hindari spam log jika totalPages kecil
      // eslint-disable-next-line no-console
      console.debug('[Pagination] render', {
        currentPage,
        totalPages,
        pageSize,
        total,
        pages
      });
    } catch (_) {}
  }, [currentPage, totalPages, pageSize, total, pages]);

  // Clamp perubahan halaman ke dalam [1, totalPages]
  const safeChange = (page) => {
    const tp = Number(totalPages) || 1;
    const target = Math.max(1, Math.min(page, tp));
    if (target !== currentPage) {
      onPageChange(target);
    }
  };

  const handleJumpToPage = (e) => {
    e.preventDefault();
    const page = parseInt(jumpToPage, 10);
    if (!Number.isNaN(page)) {
      safeChange(page);
      setJumpToPage('');
    }
  };

  const startItem = total === 0 ? 0 : (Number(currentPage) - 1) * Number(pageSize) + 1;
  const endItem = total === 0 ? 0 : Math.min(Number(currentPage) * Number(pageSize), Number(total));

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4" role="navigation" aria-label="Pagination Navigation">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Info */}
        <div className="text-sm text-gray-400">
          Showing <span className="font-medium text-white">{startItem}</span> to{' '}
          <span className="font-medium text-white">{endItem}</span> of{' '}
          <span className="font-medium text-white">{total}</span> results
        </div>

        {/* Page Size Options */}
        {showPageSizeOptions && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-3 py-1 text-sm border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Rows per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-400">per page</span>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => safeChange(Number(currentPage) - 1)}
            disabled={Number(currentPage) <= 1}
            className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-1"
            aria-label="Go to previous page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {pages.map((page, index) => {
              if (page === DOTS) {
                return (
                  <span key={`dots-${index}`} className="px-3 py-2 text-gray-500" aria-hidden="true">…</span>
                );
              }
              const isCurrent = Number(page) === Number(currentPage);
              return (
                <button
                  key={`page-${page}`}
                  onClick={() => safeChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600'
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  disabled={isCurrent}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => safeChange(Number(currentPage) + 1)}
            disabled={Number(currentPage) >= Number(totalPages)}
            className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-1"
            aria-label="Go to next page"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Jump to Page */}
        {showJumpToPage && Number(totalPages) > 7 && (
          <form onSubmit={handleJumpToPage} className="flex items-center gap-2" aria-label="Jump to page form">
            <span className="text-sm text-gray-400">Go to page</span>
            <input
              type="number"
              min="1"
              max={Number(totalPages)}
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              placeholder={String(currentPage)}
              className="w-16 px-2 py-1 text-sm border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Page number"
            />
            <button
              type="submit"
              className="px-3 py-1 text-sm font-medium text-blue-400 bg-blue-900/20 border border-blue-800 rounded-md hover:bg-blue-900/30 transition-colors duration-200"
              aria-label="Confirm jump to page"
            >
              Go
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Pagination;