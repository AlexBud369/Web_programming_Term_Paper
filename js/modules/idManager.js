async function fetchProducts() {
    const res = await fetch('http://localhost:3000/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    return await res.json();
}

async function getNextAvailableId() {
    const products = await fetchProducts();
    const usedIds = products.map(p => p.id).sort((a, b) => a - b);
    let nextId = 1;
    for (const id of usedIds) {
        if (id !== nextId) break;
        nextId++;
    }
    return nextId;
}

export { getNextAvailableId };