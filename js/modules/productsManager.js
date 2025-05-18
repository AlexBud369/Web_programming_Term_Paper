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
