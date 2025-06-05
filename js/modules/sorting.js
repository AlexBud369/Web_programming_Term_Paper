export function getSortParams(sortOption) {
    switch (sortOption) {
        case 'price-asc':
            return ['_sort=price', '_order=asc'];
        case 'price-desc':
            return ['_sort=price', '_order=desc'];
        case 'name-asc':
            return ['_sort=name', '_order=asc'];
        case 'name-desc':
            return ['_sort=name', '_order=desc'];
        case 'rating-desc':
            return ['_sort=rating', '_order=desc'];
        default:
            return [];
    }
}