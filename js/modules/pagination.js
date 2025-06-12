export function initPagination(totalItems, currentPage, itemsPerPage, onPageChange, translations = {}, lang = 'en') {
    const container = document.getElementById('pagination');
    if (!container) {
        console.error('Pagination container (#pagination) not found in DOM');
        return;
    }

    container.innerHTML = '';
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    console.log('Pagination: totalItems=', totalItems, 'totalPages=', totalPages, 'currentPage=', currentPage);

    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'flex';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn prev-btn';
    prevBtn.innerHTML = `<span data-i18n="pagination_prev">${translations.pagination_prev?.[lang] || 'Previous'}</span>`;
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    });
    container.appendChild(prevBtn);

    const pageNumbers = document.createElement('div');
    pageNumbers.className = 'page-numbers';

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => onPageChange(i));
        pageNumbers.appendChild(pageBtn);
    }
    container.appendChild(pageNumbers);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn next-btn';
    nextBtn.innerHTML = `<span data-i18n="pagination_next">${translations.pagination_next?.[lang] || 'Next'}</span>`;
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    });
    container.appendChild(nextBtn);
}

export function getPaginatedItems(items, page, itemsPerPage) {
    const start = (page - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
}