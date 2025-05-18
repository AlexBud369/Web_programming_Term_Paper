export async function fetchProducts() {
  try {
    const response = await fetch('/db.json');
    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export function getProductById(products, id) {
  return products.find(product => product.id === id);
}

export function filterProducts(products, filters) {
  return products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         product.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = filters.categories.length === 0 || filters.categories.includes(product.category);
    const matchesPrice = product.price >= filters.priceMin && product.price <= filters.priceMax;
    const matchesColor = filters.colors.length === 0 || filters.colors.some(color => product.colors.includes(color));
    const matchesSize = filters.sizes.length === 0 || filters.sizes.some(size => product.sizes.includes(size));
    const matchesStyle = !filters.style || product.style === filters.style;

    return matchesSearch && matchesCategory && matchesPrice && matchesColor && matchesSize && matchesStyle;
  });
}

export function sortProducts(products, sortBy) {
  const sorted = [...products];
  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(b.name));
    case 'rating-desc':
      return sorted.sort((a, b) => b.rating - a.rating);
    default:
      return sorted;
  }
}