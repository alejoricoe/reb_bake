// app.js
const CONFIG = {
  currency: "CAD",
  productsJsonPath: "./products.json"
};

function formatMoney(amount) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: CONFIG.currency
  }).format(amount);
}

function readCart() {
  try {
    return JSON.parse(localStorage.getItem("bakery_cart_v1")) || {};
  } catch {
    return {};
  }
}

function writeCart(cart) {
  localStorage.setItem("bakery_cart_v1", JSON.stringify(cart));
  updateCartBadge();
}

function cartCount(cart) {
  return Object.values(cart).reduce((sum, qty) => sum + Number(qty || 0), 0);
}

function updateCartBadge() {
  const badge = document.querySelector("[data-cart-badge]");
  if (!badge) return;
  const cart = readCart();
  badge.textContent = `${cartCount(cart)} item(s)`;
}

function toast(msg) {
  const t = document.querySelector("[data-toast]");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1200);
}

async function loadProducts() {
  const res = await fetch(CONFIG.productsJsonPath, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load products.json");
  return await res.json();
}

function productCard(p) {
  const card = document.createElement("div");
  card.className = "card";

  const img = document.createElement("div");
  img.className = "card-img";
  img.style.backgroundImage = `url("${p.image}")`;

  const body = document.createElement("div");
  body.className = "card-body";

  const h = document.createElement("h4");
  h.textContent = p.name;

  const d = document.createElement("p");
  d.textContent = p.description || "";

  const priceRow = document.createElement("div");
  priceRow.className = "price-row";

  const price = document.createElement("div");
  price.className = "price";
  price.textContent = formatMoney(p.price);

  const btn = document.createElement("button");
  btn.className = "btn btn-primary";
  btn.textContent = "Add to cart";
  btn.addEventListener("click", () => {
    const cart = readCart();
    cart[p.id] = (cart[p.id] || 0) + 1;
    writeCart(cart);
    toast(`Added: ${p.name}`);
  });

  priceRow.appendChild(price);
  priceRow.appendChild(btn);

  body.appendChild(h);
  body.appendChild(d);
  body.appendChild(priceRow);

  card.appendChild(img);
  card.appendChild(body);

  return card;
}

async function init() {
  updateCartBadge();

  const grid = document.querySelector("[data-products-grid]");
  if (!grid) return;

  try {
    const products = await loadProducts();
    grid.innerHTML = "";
    products.forEach(p => grid.appendChild(productCard(p)));
  } catch (e) {
    grid.innerHTML = `<div class="notice">Could not load products. Check products.json path.</div>`;
    console.error(e);
  }
}

init();
