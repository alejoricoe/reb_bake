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

async function placeOrder() {
  const customerName = document.querySelector("#name")?.value.trim() || "";
  const email = document.querySelector("#email")?.value.trim() || "";
  const phone = document.querySelector("#phone")?.value.trim() || "";
  const address = document.querySelector("#address")?.value.trim() || "";
  const deliveryDate = document.querySelector("#delivery-date")?.value.trim() || "";
  const deliveryTime = document.querySelector("#delivery-time")?.value.trim() || "";
  const notes = document.querySelector("#notes")?.value.trim() || "";

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  if (!customerName || !phone || !address) {
    alert("Please fill in your name, phone, and address.");
    return;
  }

  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  const items = cart.map(item => ({
    name: item.name,
    qty: Number(item.qty || 1),
    price: Number(item.price || 0)
  }));

  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);

  const payload = {
    customerName,
    email,
    phone,
    address,
    deliveryDate,
    deliveryTime,
    notes,
    items,
    total
  };

  try {
    const btn = document.querySelector("#place-order-btn");
    if (btn) btn.disabled = true;

    const response = await fetch("/api/send-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Failed to place order");
    }

    alert("Order sent successfully. We will contact you soon.");
    localStorage.removeItem("cart");
    window.location.href = "./index.html";
  } catch (error) {
    console.error(error);
    alert("There was a problem sending your order. Please try again.");
  } finally {
    const btn = document.querySelector("#place-order-btn");
    if (btn) btn.disabled = false;
  }
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

function getProductThumb(product) {
  return product.image || product.poster || product.gallery?.[0] || "";
}

function createMediaArea(product) {
  const wrap = document.createElement("div");
  wrap.className = "card-media";

  const stage = document.createElement("div");
  stage.className = "media-stage";

  const items = [];
  if (product.video) {
    items.push({
      type: "video",
      src: product.video,
      poster: getProductThumb(product)
    });
  }
  if (Array.isArray(product.gallery)) {
    product.gallery.filter(Boolean).forEach(src => {
      items.push({ type: "image", src });
    });
  }
  if (items.length === 0) {
    const thumb = getProductThumb(product);
    if (thumb) items.push({ type: "image", src: thumb });
  }

  let currentIndex = 0;

  function renderActiveMedia() {
    stage.innerHTML = "";
    const item = items[currentIndex];
    if (!item) return;

    if (item.type === "video") {
      const video = document.createElement("video");
      video.className = "stage-media";
      video.src = item.src;
      if (item.poster) video.poster = item.poster;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute("aria-label", `${product.name} product video`);
      stage.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.className = "stage-media";
      img.src = item.src;
      img.alt = product.name;
      stage.appendChild(img);
    }
  }

  renderActiveMedia();
  wrap.appendChild(stage);

  if (items.length > 1) {
    const prev = document.createElement("button");
    prev.className = "media-arrow media-arrow-left";
    prev.type = "button";
    prev.setAttribute("aria-label", `Previous media for ${product.name}`);
    prev.innerHTML = "&#8249;";

    const next = document.createElement("button");
    next.className = "media-arrow media-arrow-right";
    next.type = "button";
    next.setAttribute("aria-label", `Next media for ${product.name}`);
    next.innerHTML = "&#8250;";

    prev.addEventListener("click", (event) => {
      event.stopPropagation();
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      renderActiveMedia();
    });

    next.addEventListener("click", (event) => {
      event.stopPropagation();
      currentIndex = (currentIndex + 1) % items.length;
      renderActiveMedia();
    });

    wrap.appendChild(prev);
    wrap.appendChild(next);
  }

  return wrap;
}

function productCard(p) {
  const card = document.createElement("div");
  card.className = "card";

  const media = createMediaArea(p);

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

  card.appendChild(media);
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
