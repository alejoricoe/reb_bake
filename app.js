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

function getProductThumb(product) {
  return product.image || product.poster || product.gallery?.[0] || "";
}

function createMediaArea(product) {
  const wrap = document.createElement("div");
  wrap.className = "card-media";

  const thumb = getProductThumb(product);
  const hasVideo = Boolean(product.video);
  const gallery = Array.isArray(product.gallery) ? product.gallery.filter(Boolean) : [];

  const mediaStage = document.createElement("div");
  mediaStage.className = "media-stage";

  if (hasVideo) {
    const video = document.createElement("video");
    video.className = "card-video";
    video.src = product.video;
    if (thumb) video.poster = thumb;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("aria-label", `${product.name} product video`);
    mediaStage.appendChild(video);
  } else {
    const img = document.createElement("div");
    img.className = "card-img";
    if (thumb) img.style.backgroundImage = `url("${thumb}")`;
    mediaStage.appendChild(img);
  }

  wrap.appendChild(mediaStage);

  if (gallery.length > 0) {
    const overlay = document.createElement("div");
    overlay.className = "gallery-overlay";

    const galleryTrack = document.createElement("div");
    galleryTrack.className = "gallery-track";

    const slides = gallery.map((src, index) => {
      const slide = document.createElement("img");
      slide.className = "gallery-slide";
      slide.src = src;
      slide.alt = `${product.name} photo ${index + 1}`;
      if (index !== 0) slide.hidden = true;
      galleryTrack.appendChild(slide);
      return slide;
    });

    const prev = document.createElement("button");
    prev.className = "gallery-arrow gallery-arrow-left";
    prev.type = "button";
    prev.setAttribute("aria-label", `Previous photo for ${product.name}`);
    prev.innerHTML = "&#8249;";

    const next = document.createElement("button");
    next.className = "gallery-arrow gallery-arrow-right";
    next.type = "button";
    next.setAttribute("aria-label", `Next photo for ${product.name}`);
    next.innerHTML = "&#8250;";

    let currentIndex = 0;
    const updateSlide = () => {
      slides.forEach((slide, index) => {
        slide.hidden = index !== currentIndex;
      });
    };

    prev.addEventListener("click", (event) => {
      event.stopPropagation();
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateSlide();
    });

    next.addEventListener("click", (event) => {
      event.stopPropagation();
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlide();
    });

    overlay.appendChild(galleryTrack);
    if (slides.length > 1) {
      overlay.appendChild(prev);
      overlay.appendChild(next);
    }
    mediaStage.appendChild(overlay);

    const showOverlay = () => overlay.classList.add("is-visible");
    const hideOverlay = () => overlay.classList.remove("is-visible");

    wrap.addEventListener("mouseenter", showOverlay);
    wrap.addEventListener("mouseleave", hideOverlay);
    wrap.addEventListener("focusin", showOverlay);
    wrap.addEventListener("focusout", (event) => {
      if (!wrap.contains(event.relatedTarget)) hideOverlay();
    });
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
