import { getSortParams } from './sorting.js';

export async function applyFilters(sortOption, renderCallback) {
    const checkedCategories = document.querySelectorAll('#category-filter input[name="category"]:checked');
    const selectedCategories = Array.from(checkedCategories).map(checkbox => checkbox.value);

    const priceMinInput = document.getElementById('price-range-min');
    const priceMaxInput = document.getElementById('price-range-max');
    let priceMin = parseInt(priceMinInput?.value) || 0;
    let priceMax = parseInt(priceMaxInput?.value) || 250;

    if (priceMin > priceMax) {
        [priceMin, priceMax] = [priceMax, priceMin];
        priceMinInput.value = priceMin;
        priceMaxInput.value = priceMax;
    }

    const selectedColors = document.querySelectorAll('#color-filter .color-option.active');
    const colors = Array.from(selectedColors).map(color => color.dataset.color);

    const selectedSizes = document.querySelectorAll('#size-filter .size-option.active');
    const sizes = Array.from(selectedSizes).map(size => size.dataset.size);

    const style = document.getElementById('style-filter')?.value || '';

    const searchInput = document.getElementById('search-input')?.value.trim() || '';

    const queryParams = [];

    if (priceMin && !isNaN(priceMin)) {
        queryParams.push(`price_gte=${encodeURIComponent(priceMin)}`);
    }
    if (priceMax && !isNaN(priceMax)) {
        queryParams.push(`price_lte=${encodeURIComponent(priceMax)}`);
    }

    if (selectedCategories.length > 0) {
        selectedCategories.forEach(category => {
            queryParams.push(`category=${encodeURIComponent(category)}`);
        });
    }

    if (colors.length > 0) {
        colors.forEach(color => {
            queryParams.push(`colors_like=${encodeURIComponent(color)}`);
        });
    }

    if (sizes.length > 0) {
        sizes.forEach(size => {
            queryParams.push(`sizes_like=${encodeURIComponent(size)}`);
        });
    }

    if (style) {
        queryParams.push(`style=${encodeURIComponent(style)}`);
    }

    if (searchInput) {
        queryParams.push(`q=${encodeURIComponent(searchInput)}`);
    }

    const sortParams = getSortParams(sortOption);
    queryParams.push(...sortParams);

    const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const url = `http://localhost:3000/products${query}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`HTTP error: ${res.status}`);
        }
        const filteredProducts = await res.json();
        renderCallback(filteredProducts);
    } catch (error) {
        console.error('Error applying filters:', error);
        renderCallback([]);
    }
}

export function initFilters(applyFiltersCallback) {
    const sortSelect = document.getElementById('sort-by');
    const priceMinSlider = document.getElementById('price-range-min');
    const priceMaxSlider = document.getElementById('price-range-max');
    const minPriceValue = document.getElementById('min-price-value');
    const maxPriceValue = document.getElementById('max-price-value');
    const categoryCheckboxes = document.querySelectorAll('#category-filter input[name="category"]');
    const colorOptions = document.querySelectorAll('#color-filter .color-option');
    const sizeOptions = document.querySelectorAll('#size-filter .size-option');
    const styleSelect = document.getElementById('style-filter');
    const searchInput = document.getElementById('search-input');
    const clearFiltersBtn = document.querySelector('.clear-filters');

    const updatePriceDisplay = () => {
        let minVal = parseInt(priceMinSlider.value);
        let maxVal = parseInt(priceMaxSlider.value);
        if (minVal > maxVal) {
            [minVal, maxVal] = [maxVal, minVal];
            priceMinSlider.value = minVal;
            priceMaxSlider.value = maxVal;
        }
        minPriceValue.textContent = minVal;
        maxPriceValue.textContent = maxVal;
    };

    sortSelect?.addEventListener('change', () => applyFiltersCallback(sortSelect.value));
    priceMinSlider?.addEventListener('input', () => {
        updatePriceDisplay();
        applyFiltersCallback(sortSelect.value);
    });
    priceMaxSlider?.addEventListener('input', () => {
        updatePriceDisplay();
        applyFiltersCallback(sortSelect.value);
    });
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => applyFiltersCallback(sortSelect.value));
    });
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            option.classList.toggle('active');
            applyFiltersCallback(sortSelect.value);
        });
    });
    sizeOptions.forEach(option => {
        option.addEventListener('click', () => {
            option.classList.toggle('active');
            applyFiltersCallback(sortSelect.value);
        });
    });
    styleSelect?.addEventListener('change', () => applyFiltersCallback(sortSelect.value));
    searchInput?.addEventListener('input', () => applyFiltersCallback(sortSelect.value));
    clearFiltersBtn?.addEventListener('click', () => {
        sortSelect.value = 'default';
        priceMinSlider.value = 0;
        priceMaxSlider.value = 250;
        updatePriceDisplay();
        categoryCheckboxes.forEach(checkbox => (checkbox.checked = false));
        colorOptions.forEach(option => option.classList.remove('active'));
        sizeOptions.forEach(option => option.classList.remove('active'));
        styleSelect.value = '';
        searchInput.value = '';
        applyFiltersCallback(sortSelect.value);
    });
}