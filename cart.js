// cart.js
const CONFIG = {
  currency: "CAD",
  taxRate: 0.12,          // <-- change later (e.g., 0.05, 0.13, etc.)
  includeTaxByDefault: true,
  productsJsonPath: "./products.json",
  cartKey: "bakery_cart_v1"
};

function formatMoney(amount) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: CONFIG.currency
  }).format(amount);
}

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.cartKey)) || {};
  } catch {
    return {};
  }
}

function writeCart(cart) {
  localStorage.setItem(CONFIG.cartKey, JSON.stringify(cart));
  updateBadge();
}

function cartCount(cart) {
  return Object.values(cart).reduce((sum, qty) => sum + Number(qty || 0), 0);
}

function updateBadge() {
  const badge = document.querySelector("[data-cart-badge]");
  if (!badge) return;
  badge.textContent = `${cartCount(readCart())} item(s)`;
}

function toast(msg) {
  const t = document.querySelector("[data-toast]");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1400);
}

async function loadProducts() {
  const res = await fetch(CONFIG.productsJsonPath, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load products.json");
  const products = await res.json();
  const map = new Map(products.map(p => [p.id, p]));
  return map;
}

function setMinDeliveryDate() {
  const input = document.querySelector("[data-delivery-date]");
  if (!input) return;

  const now = new Date();
  const min = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // tomorrow
  const max = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14); // next 14 days

  const toISO = (d) => d.toISOString().slice(0,10);

  input.min = toISO(min);
  input.max = toISO(max);
}

function buildItemRow(product, qty, onChangeQty, onRemove) {
  const row = document.createElement("div");
  row.className = "item";

  const thumb = document.createElement("div");
  thumb.className = "thumb";
  thumb.style.backgroundImage = `url("${product.image}")`;

  const info = document.createElement("div");
  const title = document.createElement("h4");
  title.textContent = product.name;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `${formatMoney(product.price)} each`;

  info.appendChild(title);
  info.appendChild(meta);

  const controls = document.createElement("div");
  controls.className = "qty";

  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.min = "1";
  qtyInput.step = "1";
  qtyInput.value = String(qty);

  qtyInput.addEventListener("change", () => {
    const v = Math.max(1, Math.floor(Number(qtyInput.value || 1)));
    qtyInput.value = String(v);
    onChangeQty(v);
  });

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn btn-danger";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", onRemove);

  controls.appendChild(qtyInput);
  controls.appendChild(removeBtn);

  row.appendChild(thumb);
  row.appendChild(info);
  row.appendChild(controls);

  return row;
}

function computeTotals(productsMap, cart, includeTax) {
  let subtotal = 0;
  for (const [id, qty] of Object.entries(cart)) {
    const p = productsMap.get(id);
    if (!p) continue;
    subtotal += p.price * Number(qty || 0);
  }
  const tax = includeTax ? subtotal * CONFIG.taxRate : 0;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function renderTotals(totals, includeTax) {
  document.querySelector("[data-subtotal]").textContent = formatMoney(totals.subtotal);
  document.querySelector("[data-tax]").textContent = includeTax ? formatMoney(totals.tax) : formatMoney(0);
  document.querySelector("[data-total]").textContent = formatMoney(totals.total);
}

function validateCheckout(cart) {
  if (Object.keys(cart).length === 0) return "Your cart is empty.";

  const date = document.querySelector("[data-delivery-date]")?.value?.trim();
  const time = document.querySelector("[data-delivery-time]")?.value?.trim();
  const address = document.querySelector("[data-address]")?.value?.trim();
  const phone = document.querySelector("[data-phone]")?.value?.trim();
  const email = document.querySelector("[data-email]")?.value?.trim();

  if (!date) return "Please choose a delivery date.";
  if (!time) return "Please choose a delivery time window.";
  if (!address) return "Please enter your delivery address.";
  if (!phone) return "Please enter a phone number.";
  if (!email) return "Please enter an email.";

  // simple checks (not perfect)
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) return "Please enter a valid email address.";

  return null;
}

async function init() {
  updateBadge();
  setMinDeliveryDate();

  const productsMap = await loadProducts();
  const cart = readCart();

  const includeTaxToggle = document.querySelector("[data-include-tax]");
  includeTaxToggle.checked = CONFIG.includeTaxByDefault;

  const itemsWrap = document.querySelector("[data-cart-items]");
  const emptyWrap = document.querySelector("[data-empty]");
  const checkoutBtn = document.querySelector("[data-place-order]");
  const clearBtn = document.querySelector("[data-clear-cart]");

  function rerender() {
    const cartNow = readCart();
    const hasItems = Object.keys(cartNow).length > 0;

    itemsWrap.innerHTML = "";
    emptyWrap.style.display = hasItems ? "none" : "block";

    for (const [id, qty] of Object.entries(cartNow)) {
      const p = productsMap.get(id);
      if (!p) continue;

      const row = buildItemRow(
        p,
        qty,
        (newQty) => {
          const c = readCart();
          c[id] = newQty;
          writeCart(c);
          const totals = computeTotals(productsMap, c, includeTaxToggle.checked);
          renderTotals(totals, includeTaxToggle.checked);
        },
        () => {
          const c = readCart();
          delete c[id];
          writeCart(c);
          rerender();
          const totals = computeTotals(productsMap, c, includeTaxToggle.checked);
          renderTotals(totals, includeTaxToggle.checked);
        }
      );

      itemsWrap.appendChild(row);
    }

    const totals = computeTotals(productsMap, cartNow, includeTaxToggle.checked);
    renderTotals(totals, includeTaxToggle.checked);
  }

  includeTaxToggle.addEventListener("change", () => {
    const totals = computeTotals(productsMap, readCart(), includeTaxToggle.checked);
    renderTotals(totals, includeTaxToggle.checked);
  });

  clearBtn.addEventListener("click", () => {
    localStorage.removeItem(CONFIG.cartKey);
    updateBadge();
    rerender();
    toast("Cart cleared");
  });

  checkoutBtn.addEventListener("click", async () => {
    const cartNow = readCart();
    const err = validateCheckout(cartNow);
    if (err) {
      toast(err);
      return;
    }

    const includeTax = includeTaxToggle.checked;
    const totals = computeTotals(productsMap, cartNow, includeTax);

    const order = {
      createdAt: new Date().toISOString(),
      currency: CONFIG.currency,
      includeTax,
      taxRate: includeTax ? CONFIG.taxRate : 0,
      items: Object.entries(cartNow).map(([id, qty]) => {
        const p = productsMap.get(id);
        return {
          id,
          name: p?.name || id,
          unitPrice: p?.price || 0,
          qty: Number(qty || 0),
          lineTotal: (p?.price || 0) * Number(qty || 0)
        };
      }),
      totals: {
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total
      },
      delivery: {
        date: document.querySelector("[data-delivery-date]").value,
        timeWindow: document.querySelector("[data-delivery-time]").value
      },
      customer: {
        address: document.querySelector("[data-address]").value.trim(),
        phone: document.querySelector("[data-phone]").value.trim(),
        email: document.querySelector("[data-email]").value.trim(),
        notes: document.querySelector("[data-notes]").value.trim()
      }
    };

    const out = document.querySelector("[data-order-output]");
    out.value = JSON.stringify(order, null, 2);

    try {
      await navigator.clipboard.writeText(out.value);
      toast("Order summary copied! (Paste it into your notes/email)");
    } catch {
      toast("Order summary generated below.");
    }
  });

  rerender();
}

init().catch(e => {
  console.error(e);
  toast("Error loading cart page. Check console.");
});
