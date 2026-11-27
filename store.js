const products = [
  {id:'lounge', name:'Woven Lounge Chair', category:'Furniture', price:3850, description:'A curved woven armchair with an airy frame for a relaxed seating corner or covered patio. Ask Zende about dimensions and outdoor care.'},
  {id:'dining', name:'Woven Dining Armchair', category:'Furniture', price:2650, description:'An open-weave chair with arms, shown at Zende’s dining table display. Ask about pairing chairs for your space.'},
  {id:'pendant', name:'Woven Dome Pendant', category:'Lighting', price:1950, description:'A generous dome shade with an open weave that lets warm light through. Confirm size and fittings with Zende.'},
  {id:'table-lamp', name:'Striped Table Lamp', category:'Lighting', price:1490, description:'Terracotta and cream stripes carry from the shade through to the base. A colourful piece for a console or bedside table.'},
  {id:'fringe', name:'Fringed Lampshade', category:'Lighting', price:1290, description:'A soft, fringed shade that adds texture and movement to a tabletop display.'},
  {id:'mirror', name:'Round Woven Mirror', category:'Home décor', price:1650, description:'A circular mirror framed by a wide band of pale woven fibre for an entryway or living room.'},
  {id:'planter', name:'Woven Planter Basket', category:'Home décor', price:620, description:'A textured basket that softens the look of a potted plant. Ask Zende which sizes are available.'},
  {id:'cushion', name:'Ochre Chevron Cushion', category:'Home décor', price:490, description:'A warm ochre cushion with rows of pale chevrons, shown in Zende’s Instagram collection.'},
  {id:'rabbit', name:'Woven Rabbit', category:'Gifts', price:450, description:'A sculptural woven rabbit with tall ears and a rounded silhouette for a shelf, tabletop or seasonal display.'},
  {id:'beadwork', name:'Colourful Beaded Accessories', category:'Gifts', price:280, description:'A selection of bright beaded pieces and patterned accessories. Ask Zende about individual designs.'}
];
const price = new Intl.NumberFormat('en-ZA', {style:'currency', currency:'ZAR', maximumFractionDigits:0});
const byId = id => document.getElementById(id);
const filters = ['All pieces', ...new Set(products.map(product => product.category))];
const cartDialog = byId('cart-dialog');
const productDialog = byId('product-dialog');
let activeFilter = filters[0];
let cart = {};
let toastTimer;
try {
  const saved = JSON.parse(localStorage.getItem('zende-bag') || '{}');
  for (const {id} of products) {
    if (Number.isInteger(saved?.[id]) && saved[id] > 0) cart[id] = saved[id];
  }
} catch {}

byId('filters').innerHTML = filters.map(filter =>
  `<button type="button" aria-pressed="${filter === activeFilter}" data-filter="${filter}">${filter}</button>`
).join('');

function renderProducts() {
  const query = byId('search').value.trim().toLowerCase();
  const visible = products.filter(product =>
    (activeFilter === filters[0] || product.category === activeFilter) &&
    `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query)
  );
  byId('results').textContent = visible.length
    ? `${visible.length} ${visible.length === 1 ? 'piece' : 'pieces'}`
    : 'No pieces match. Try another search or collection.';
  byId('products').innerHTML = visible.map(product =>
    `<article><button class="tile" type="button" data-product="${product.id}">
      <span class="tile-photo"><img loading="lazy" src="assets/${product.id}.webp" alt=""></span>
      <h3>${product.name}</h3><p>${price.format(product.price)}</p>
    </button></article>`
  ).join('');
}

function renderCart() {
  const selected = products.filter(product => cart[product.id]);
  byId('count').textContent = selected.reduce((count, product) => count + cart[product.id], 0);
  if (!selected.length) {
    byId('cart-content').innerHTML = '<p>Your bag is empty.</p>';
    return;
  }
  const subtotal = selected.reduce((sum, product) => sum + product.price * cart[product.id], 0);
  const rows = selected.map(product => `<article class="cart-row">
    <img src="assets/${product.id}.webp" alt=""><div><strong>${product.name}</strong>
    <p>${price.format(product.price * cart[product.id])}</p><div class="qty">
    <button type="button" data-id="${product.id}" data-change="-1" aria-label="Decrease ${product.name} quantity">−</button>
    <span aria-label="Quantity">${cart[product.id]}</span>
    <button type="button" data-id="${product.id}" data-change="1" aria-label="Increase ${product.name} quantity">+</button>
    <button type="button" data-id="${product.id}" data-change="remove">Remove</button>
    </div></div></article>`).join('');
  byId('cart-content').innerHTML = `${rows}<p class="cart-total">Sample subtotal · ${price.format(subtotal)}</p>
    <p class="fine">Demo checkout uses sample prices. For actual availability and a quote, enquire directly with Zende.</p>
    <button class="primary" id="checkout" type="button">Preview checkout</button>`;
}

function changeCart(id, change) {
  const next = change === 'remove' ? 0 : (cart[id] || 0) + Number(change);
  if (next > 0) cart[id] = next;
  else delete cart[id];
  try { localStorage.setItem('zende-bag', JSON.stringify(cart)); } catch {}
  renderCart();
}

byId('search').addEventListener('input', renderProducts);
byId('filters').addEventListener('click', event => {
  const filter = event.target.closest('[data-filter]');
  if (!filter) return;
  activeFilter = filter.dataset.filter;
  for (const button of byId('filters').children) {
    button.setAttribute('aria-pressed', String(button === filter));
  }
  renderProducts();
});

byId('products').addEventListener('click', event => {
  const tile = event.target.closest('[data-product]');
  if (!tile) return;
  const product = products.find(item => item.id === tile.dataset.product);
  byId('product-detail').innerHTML = `<div class="detail">
    <img src="assets/${product.id}.webp" alt="${product.name}">
    <div><p class="eyebrow">${product.category}</p><h3>${product.name}</h3>
      <p>${product.description}</p><p><strong>${price.format(product.price)}</strong> · Sample price</p>
      <button class="primary" type="button">Add to bag</button></div></div>`;
  byId('product-detail').querySelector('button').onclick = () => {
    changeCart(product.id, 1);
    productDialog.close();
    byId('toast').textContent = `${product.name} added to your bag.`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { byId('toast').textContent = ''; }, 2500);
  };
  productDialog.showModal();
});

byId('bag').addEventListener('click', () => {
  renderCart();
  cartDialog.showModal();
});

byId('cart-content').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.change) {
    const {id, change} = button.dataset;
    changeCart(id, change);
    byId('cart-content').querySelector(`[data-id="${id}"][data-change="${change}"]`)?.focus();
  }
  if (button.id === 'checkout') {
    const selection = products.filter(product => cart[product.id])
      .map(product => `${cart[product.id]} × ${product.name}`).join(', ');
    const message = encodeURIComponent(`Hi Zende, could you confirm pricing and availability for ${selection}?`);
    byId('cart-content').innerHTML = `<p>You've reached the end of the demo checkout. For a real order, you can open a WhatsApp enquiry with your selected pieces.</p>
      <a class="primary" href="https://wa.me/27723757636?text=${message}" target="_blank" rel="noopener">Open WhatsApp enquiry</a>
      <button class="secondary" type="button" id="back-to-bag">Back to bag</button>`;
    byId('back-to-bag').focus();
  }
  if (button.id === 'back-to-bag') {
    renderCart();
    byId('checkout').focus();
  }
});

renderProducts();
renderCart();
