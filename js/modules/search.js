export function initSearch(applyFiltersCallback) {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    const handleSearch = debounce(() => {
        applyFiltersCallback(document.getElementById('sort-by')?.value || 'default');
    }, 300);

    searchInput.addEventListener('input', handleSearch);
}