const USD_TO_PKR = 282;
const CART_KEY = 'ashars-gaming-hub-cart';
const money = value => `Rs. ${(value * USD_TO_PKR).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

const loadCart = () => {
  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
};

const state = { build: {}, filter: 'All', search: '', cart: loadCart() };
const $ = selector => document.querySelector(selector);

function getCartItemCount() {
  return state.cart.reduce((total, item) => total + item.quantity, 0);
}

function renderCartBadge() {
  document.querySelectorAll('.cart-badge').forEach(badge => {
    badge.textContent = getCartItemCount();
  });
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  renderCartBadge();
}

function addToCart(productId) {
  const product = products.find(item => item.id === productId);
  if (!product) return;

  const existing = state.cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ id: productId, quantity: 1 });
  }

  saveCart();
  if (location.hash === '#cart') renderCart();
}

function updateCartQuantity(productId, change) {
  const item = state.cart.find(entry => entry.id === productId);
  if (!item) return;

  item.quantity += change;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter(entry => entry.id !== productId);
  }

  saveCart();
  renderCart();
}

function removeCartItem(productId) {
  state.cart = state.cart.filter(entry => entry.id !== productId);
  saveCart();
  renderCart();
}

function getCartSummary() {
  return state.cart.map(entry => {
    const product = products.find(item => item.id === entry.id);
    if (!product) return null;
    return {
      ...product,
      quantity: entry.quantity,
      lineTotal: product.price * entry.quantity
    };
  }).filter(Boolean);
}

function renderCart() {
  const cartItems = getCartSummary();
  const subtotal = cartItems.reduce((total, item) => total + item.lineTotal, 0);
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const cartBadge = $('#cart-count-badge');
  const checkoutOrderSummary = $('#checkout-order-summary');
  const checkoutTotal = $('#checkout-total');
  const basketTotal = $('#basket-total');
  const basketCount = $('#basket-count');
  const cartItemsEl = $('#cart-items');
  const checkoutSubmit = $('#checkout-form button[type="submit"]');

  if (cartBadge) cartBadge.textContent = `${itemCount} item${itemCount === 1 ? '' : 's'}`;
  if (checkoutOrderSummary) checkoutOrderSummary.textContent = `${itemCount} item${itemCount === 1 ? '' : 's'}`;
  if (checkoutTotal) checkoutTotal.textContent = money(subtotal);
  if (basketTotal) basketTotal.textContent = money(subtotal);
  if (basketCount) basketCount.textContent = itemCount;

  if (!cartItemsEl || !checkoutSubmit) return;

  if (!cartItems.length) {
    cartItemsEl.innerHTML = '<div class="empty-cart"><p>Your cart is empty.</p><a href="#components" class="button button-primary">Browse components <span>→</span></a></div>';
    checkoutSubmit.disabled = true;
    return;
  }

  checkoutSubmit.disabled = false;
  cartItemsEl.innerHTML = cartItems.map(item => `
    <article class="cart-item">
      <div class="cart-item-image"><img src="${item.image}" alt="${item.name}"></div>
      <div class="cart-item-copy">
        <div class="cart-item-header">
          <div>
            <span class="product-category">${item.category}</span>
            <h3>${item.name}</h3>
          </div>
          <button class="remove-item" type="button" data-remove-cart="${item.id}" aria-label="Remove ${item.name}">Remove</button>
        </div>
        <div class="cart-item-meta">
          <strong>${money(item.price)}</strong>
          <div class="quantity-control" aria-label="Quantity controls">
            <button type="button" data-cart-qty="${item.id}" data-cart-change="-1">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-cart-qty="${item.id}" data-cart-change="1">+</button>
          </div>
        </div>
      </div>
    </article>
  `).join('');
}

function productCard(product) {
  return `<article class="product-card">
    <button class="product-image" data-product="${product.id}" aria-label="View ${product.name}">
      <img src="${product.image}" alt="${product.name}">
      <span class="view-product">View details ↗</span>
    </button>
    <div class="product-meta">
      <span class="product-category">${product.category}</span>
      <h3>${product.name}</h3>
      <p>${product.specs}</p>
      <strong>${money(product.price)}</strong>
      <div class="product-card-actions">
        <button class="button button-primary card-add-cart" type="button" data-add-cart="${product.id}">Add to Cart</button>
      </div>
    </div>
  </article>`;
}

function renderHome() {
  $('#category-grid').innerHTML = categories.map(category => `
    <a class="category-card" href="#components" data-category="${category.type}" aria-label="Browse ${category.name}">
      <img src="${category.image}" alt="${category.name}">
      <span class="category-overlay"></span>
      <span class="category-label"><strong>${category.name}</strong><small>${category.count} <b>↗</b></small></span>
    </a>
  `).join('');
  $('#featured-grid').innerHTML = products.filter(product => product.featured).map(productCard).join('');
}

function renderFilters() {
  const types = ['All', ...new Set(products.map(product => product.category))];
  $('#filter-buttons').innerHTML = types.map(type => `<button class="filter-button ${state.filter === type ? 'active' : ''}" data-filter="${type}">${type}</button>`).join('');
}

function renderCatalog() {
  const visible = products.filter(product => (state.filter === 'All' || product.category === state.filter) && `${product.name} ${product.specs}`.toLowerCase().includes(state.search.toLowerCase()));
  $('#catalog-grid').innerHTML = visible.length ? visible.map(productCard).join('') : '<div class="empty-state">No components match that search.</div>';
  renderFilters();
}

function renderDetails(id) {
  const product = products.find(item => item.id === id) || products[0];
  $('#details-content').innerHTML = `<a class="back-link" href="#components">← Back to components</a><div class="detail-layout"><div class="detail-image"><img src="${product.image}" alt="${product.name}"></div><div class="detail-copy"><p class="eyebrow">${product.category} / ASHARS SELECT</p><h1>${product.name}</h1><p class="detail-specs">${product.specs}</p><strong class="detail-price">${money(product.price)}</strong><p>A dependable choice for a focused, high-performance build. We chose this part for its balanced thermals, sensible feature set, and long-term value.</p><div class="detail-actions"><button class="button button-primary" type="button" data-add-cart="${product.id}">Add to Cart <span>→</span></button><button class="button button-outline" type="button" data-add-build="${product.id}">Add to PC builder <span>→</span></button></div><div class="detail-facts"><span><b>Warranty</b> 3 years</span><span><b>Availability</b> In stock</span><span><b>Shipping</b> 24 hours</span></div></div></div>`;
}

function addSelectedBuildToCart() {
  const selectedIds = Object.values(state.build).filter(Boolean);
  if (!selectedIds.length) return;

  selectedIds.forEach(id => {
    const existing = state.cart.find(item => item.id === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({ id, quantity: 1 });
    }
  });

  saveCart();
  renderCart();
  location.hash = '#cart';
}

function renderBuilder() {
  const order = ['CPU', 'Motherboard', 'GPU', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler'];
  $('#builder-options').innerHTML = order.map(category => `<div class="builder-row"><div><span class="builder-number">${String(order.indexOf(category) + 1).padStart(2, '0')}</span><strong>${category}</strong></div><select data-build-category="${category}"><option value="">Choose ${category.toLowerCase()}...</option>${products.filter(product => product.category === category).map(product => `<option value="${product.id}" ${state.build[category] === product.id ? 'selected' : ''}>${product.short} — ${money(product.price)}</option>`).join('')}</select></div>`).join('');
  const selected = order.map(category => products.find(product => product.id === state.build[category])).filter(Boolean);
  $('#selected-parts').innerHTML = selected.length ? selected.map(product => `<div class="selected-part"><span>${product.category}</span><strong>${product.short}</strong><b>${money(product.price)}</b></div>`).join('') : '<p class="no-parts">Your build is waiting for its first part.</p>';
  $('#total-price').textContent = money(selected.reduce((total, product) => total + product.price, 0));
  const addBuildButton = $('#add-build-to-cart');
  if (addBuildButton) {
    addBuildButton.disabled = selected.length === 0;
  }
  const cpu = selected.find(product => product.category === 'CPU');
  const board = selected.find(product => product.category === 'Motherboard');
  const hasPair = cpu && board;
  const compatible = !hasPair || cpu.socket === board.socket;
  $('#compatibility-badge').textContent = !hasPair ? 'Waiting' : compatible ? 'Compatible' : 'Needs attention';
  $('#compatibility-badge').className = `compat-badge ${!hasPair ? '' : compatible ? 'good' : 'warning'}`;
  $('#compatibility-message').textContent = !hasPair ? 'Select a CPU and motherboard to begin compatibility checks.' : compatible ? 'Your CPU and motherboard share the AM5 socket.' : 'The selected CPU and motherboard use different sockets.';
  if (!$('#add-build-to-cart')) {
    $('.build-summary').insertAdjacentHTML('beforeend', '<button id="add-build-to-cart" class="button button-primary" type="button">Add build to cart <span>→</span></button>');
  }
}

function navigate() {
  const hash = location.hash.slice(1) || 'home';
  const page = hash.startsWith('details/') ? 'details' : hash;
  document.querySelectorAll('.page-view').forEach(view => view.classList.toggle('active', view.dataset.page === page));
  document.querySelectorAll('.main-nav a').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${page}`));
  if (page === 'details') renderDetails(hash.split('/')[1]);
  if (page === 'cart') renderCart();
  window.scrollTo(0, 0);
}

renderHome();
renderCatalog();
renderBuilder();
renderCartBadge();
renderCart();
navigate();

document.addEventListener('click', event => {
  const productButton = event.target.closest('[data-product]');
  if (productButton && !event.target.closest('[data-add-cart]')) location.hash = `details/${productButton.dataset.product}`;

  const filter = event.target.closest('[data-filter]');
  if (filter) {
    state.filter = filter.dataset.filter;
    renderCatalog();
  }

  const category = event.target.closest('[data-category]');
  if (category) {
    state.filter = category.dataset.category;
    renderCatalog();
  }

  const add = event.target.closest('[data-add-build]');
  if (add) {
    const product = products.find(item => item.id === add.dataset.addBuild);
    state.build[product.category] = product.id;
    location.hash = 'builder';
    renderBuilder();
  }

  const addToCartButton = event.target.closest('[data-add-cart]');
  if (addToCartButton) {
    addToCart(addToCartButton.dataset.addCart);
    location.hash = '#cart';
  }

  if (event.target.closest('#add-build-to-cart')) {
    addSelectedBuildToCart();
  }

  const openCartButton = event.target.closest('[data-open-cart]');
  if (openCartButton) {
    location.hash = '#cart';
  }

  const cartChange = event.target.closest('[data-cart-change]');
  if (cartChange) {
    const productId = cartChange.dataset.cartQty;
    updateCartQuantity(productId, Number(cartChange.dataset.cartChange));
  }

  const removeCartButton = event.target.closest('[data-remove-cart]');
  if (removeCartButton) {
    removeCartItem(removeCartButton.dataset.removeCart);
  }

  if (event.target.closest('#reset-build')) {
    state.build = {};
    renderBuilder();
  }

  if (event.target.closest('.menu-toggle')) {
    $('.main-nav').classList.toggle('open');
  }
});

document.addEventListener('input', event => {
  if (event.target.id === 'product-search') {
    state.search = event.target.value;
    renderCatalog();
  }
});

document.addEventListener('change', event => {
  if (event.target.matches('[data-build-category]')) {
    state.build[event.target.dataset.buildCategory] = event.target.value;
    renderBuilder();
  }
});

$('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  $('#form-message').textContent = 'Thanks, your message is ready for us. We will be in touch soon.';
  event.target.reset();
});

$('#checkout-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!state.cart.length) {
    $('#checkout-message').textContent = 'Your cart is empty. Add a few parts before checking out.';
    return;
  }

  const form = event.target;
  const cartItems = getCartSummary();
  const total = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);

  const orderData = {
    fullName: form.fullName.value,
    email: form.email.value,
    phone: form.phone.value,
    address: form.address.value,
    city: form.city.value,
    products: cartItems.map(item => `${item.name} x${item.quantity}`).join(', '),
    total: money(total)
  };

  $('#checkout-message').textContent = 'Placing your order...';

  fetch('https://hook.us2.make.com/ny1t5pdg3fhd717468bv891rm54q378i', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  })
    .then(() => {
      $('#checkout-message').textContent = `Thanks! Your order for ${money(total)} has been placed successfully.`;
      state.cart = [];
      saveCart();
      renderCart();
      form.reset();
    })
    .catch(() => {
      $('#checkout-message').textContent = 'Something went wrong sending your order. Please try again.';
    });
});

window.addEventListener('hashchange', navigate);
