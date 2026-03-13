const CONFIG = {
  currency: "CAD",
  productsJsonPath: "./products.json",
  taxRate: 0.12, // change if needed
  cartStorageKey: "bakery_cart_v1"
};

function formatMoney(amount) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: CONFIG.currency
  }).format(amount);
}

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.cartStorageKey)) || {};
  } catch {
    return {};
  }
}

function writeCart(cart) {
  localStorage.setItem(CONFIG.cartStorageKey, JSON.stringify(cart));
  updateCartBadge();
}

function clearCart() {
  localStorage.removeItem(CONFIG.cartStorageKey);
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
  setTimeout(() => t.classList.remove("show"), 1600);
}

async function loadProducts() {
  const res = await fetch(`${CONFIG.productsJsonPath}?v=5`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load products.json");
  return await res.json();
}

function getProductThumb(product) {
  return product.image || product.poster || product.gallery?.[0] || "";
}

function computeSummary(products, cart, includeTax) {
  const items = [];
  let subtotal = 0;

  for (const product of products) {
    const qty = Number(cart[product.id] || 0);
    if (qty <= 0) continue;

    const lineTotal = qty * Number(product.price || 0);
    subtotal += lineTotal;

    items.push({
      id: product.id,
      name: product.name,
      qty,
      price: Number(product.price || 0),
      lineTotal,
      image: getProductThumb(product)
    });
  }

  const tax = includeTax ? subtotal * CONFIG.taxRate : 0;
  const total = subtotal + tax;

  return { items, subtotal, tax, total };
}

function renderCart(products) {
  const cart = readCart();
  const includeTax = Boolean(document.querySelector("[data-include-tax]")?.checked);

  const { items, subtotal, tax, total } = computeSummary(products, cart, includeTax);

  const itemsWrap = document.querySelector("[data-cart-items]");
  const emptyNotice = document.querySelector("[data-empty]");
  const subtotalEl = document.querySelector("[data-subtotal]");
  const taxEl = document.querySelector("[data-tax]");
  const totalEl = document.querySelector("[data-total]");

  if (!itemsWrap || !emptyNotice || !subtotalEl || !taxEl || !totalEl) return;

  itemsWrap.innerHTML = "";

  if (items.length === 0) {
    emptyNotice.style.display = "block";
  } else {
    emptyNotice.style.display = "none";

    for (const item of items) {
      const row = document.createElement("div");
      row.className = "item";

      const thumb = document.createElement("div");
      thumb.className = "thumb";
      thumb.style.backgroundImage = item.image ? `url("${item.image}")` : "none";

      const meta = document.createElement("div");

      const title = document.createElement("h4");
      title.textContent = item.name;

      const details = document.createElement("div");
      details.className = "meta";
      details.textContent = `${formatMoney(item.price)} each`;

      meta.appendChild(title);
      meta.appendChild(details);

      const qtyWrap = document.createElement("div");
      qtyWrap.className = "qty";

      const minusBtn = document.createElement("button");
      minusBtn.className = "btn";
      minusBtn.type = "button";
      minusBtn.textContent = "−";
      minusBtn.addEventListener("click", () => {
        const nextCart = readCart();
        nextCart[item.id] = Math.max(0, Number(nextCart[item.id] || 0) - 1);
        if (nextCart[item.id] === 0) delete nextCart[item.id];
        writeCart(nextCart);
        renderCart(products);
      });

      const qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.min = "0";
      qtyInput.value = String(item.qty);
      qtyInput.addEventListener("change", () => {
        const nextQty = Math.max(0, Number(qtyInput.value || 0));
        const nextCart = readCart();
        if (nextQty === 0) {
          delete nextCart[item.id];
        } else {
          nextCart[item.id] = nextQty;
        }
        writeCart(nextCart);
        renderCart(products);
      });

      const plusBtn = document.createElement("button");
      plusBtn.className = "btn";
      plusBtn.type = "button";
      plusBtn.textContent = "+";
      plusBtn.addEventListener("click", () => {
        const nextCart = readCart();
        nextCart[item.id] = Number(nextCart[item.id] || 0) + 1;
        writeCart(nextCart);
        renderCart(products);
      });

      qtyWrap.appendChild(minusBtn);
      qtyWrap.appendChild(qtyInput);
      qtyWrap.appendChild(plusBtn);

      row.appendChild(thumb);
      row.appendChild(meta);
      row.appendChild(qtyWrap);

      itemsWrap.appendChild(row);
    }
  }

  subtotalEl.textContent = formatMoney(subtotal);
  taxEl.textContent = formatMoney(tax);
  totalEl.textContent = formatMoney(total);
}

async function placeOrder(products) {
  const customerName = document.querySelector("[data-name]")?.value.trim() || "";
  const phone = document.querySelector("[data-phone]")?.value.trim() || "";
  const email = document.querySelector("[data-email]")?.value.trim() || "";
  const address = document.querySelector("[data-address]")?.value.trim() || "";
  const deliveryDate = document.querySelector("[data-delivery-date]")?.value.trim() || "";
  const deliveryTime = document.querySelector("[data-delivery-time]")?.value.trim() || "";
  const notes = document.querySelector("[data-notes]")?.value.trim() || "";
  const includeTax = Boolean(document.querySelector("[data-include-tax]")?.checked);

  const cart = readCart();
  const { items, subtotal, tax, total } = computeSummary(products, cart, includeTax);

  if (!customerName) {
    alert("Please enter your full name.");
    return;
  }

  if (!phone) {
    alert("Please enter your phone number.");
    return;
  }

  if (!address) {
    alert("Please enter your address.");
    return;
  }

  if (items.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const payload = {
    customerName,
    phone,
    email,
    address,
    deliveryDate,
    deliveryTime,
    notes,
    includeTax,
    subtotal,
    tax,
    total,
    items: items.map(item => ({
      name: item.name,
      qty: item.qty,
      price: item.price,
      lineTotal: item.lineTotal
    }))
  };

  const btn = document.querySelector("[data-place-order]");
  const originalText = btn ? btn.textContent : "Place order";

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Sending...";
    }

    const response = await fetch("/api/send-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Failed to send order.");
    }

    clearCart();
    toast("Order sent successfully!");

    setTimeout(() => {
      alert("Your order was sent successfully. Reb Bakes will contact you soon.");
      window.location.href = "./index.html";
    }, 300);
  } catch (error) {
    console.error(error);
    alert("There was a problem sending your order. Please try again.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}

async function initCartPage() {
  updateCartBadge();

  let products = [];
  try {
    products = await loadProducts();
  } catch (error) {
    console.error(error);
    const itemsWrap = document.querySelector("[data-cart-items]");
    if (itemsWrap) {
      itemsWrap.innerHTML = `<div class="notice">Could not load products. Please try again later.</div>`;
    }
    return;
  }

  renderCart(products);

  const taxToggle = document.querySelector("[data-include-tax]");
  if (taxToggle) {
    taxToggle.addEventListener("change", () => renderCart(products));
  }

  const clearBtn = document.querySelector("[data-clear-cart]");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      clearCart();
      renderCart(products);
      toast("Cart cleared");
    });
  }

  const orderBtn = document.querySelector("[data-place-order]");
  if (orderBtn) {
    orderBtn.addEventListener("click", () => placeOrder(products));
  }
}

initCartPage();
