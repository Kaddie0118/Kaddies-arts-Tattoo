const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");
const contactBtn = document.querySelector(".nav-contact-btn");
const contactPanel = document.querySelector(".nav-contact-panel");
const contactItem = document.querySelector(".nav-contact");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const navIndicatorKey = "nav-indicator";

function navPageLinks(nav) {
  return [...nav.querySelectorAll(":scope > li > a[href]")];
}

function navItemBox(link, nav) {
  const navRect = nav.getBoundingClientRect();
  const rect = link.getBoundingClientRect();
  return {
    left: rect.left - navRect.left,
    top: rect.top - navRect.top,
    width: rect.width,
    height: rect.height,
    navWidth: navRect.width,
  };
}

function placeNavIndicator(indicator, box, animate) {
  indicator.style.transition = animate && !reduceMotion
    ? "left 0.45s cubic-bezier(0.22, 1, 0.36, 1), top 0.45s cubic-bezier(0.22, 1, 0.36, 1), width 0.45s cubic-bezier(0.22, 1, 0.36, 1), height 0.45s cubic-bezier(0.22, 1, 0.36, 1)"
    : "none";
  indicator.style.left = `${box.left}px`;
  indicator.style.top = `${box.top}px`;
  indicator.style.width = `${box.width}px`;
  indicator.style.height = `${box.height}px`;
}

function setupNavIndicator(nav) {
  const current = nav.querySelector(':scope > li > a[aria-current="page"]');
  if (!current) return;

  const indicator = document.createElement("li");
  indicator.className = "nav-indicator";
  indicator.setAttribute("aria-hidden", "true");
  nav.prepend(indicator);

  let from = null;
  try {
    from = JSON.parse(sessionStorage.getItem(navIndicatorKey) || "null");
  } catch {
    from = null;
  }
  sessionStorage.removeItem(navIndicatorKey);

  const finishSlide = () => {
    nav.classList.remove("is-sliding");
  };

  const startSlide = () => {
    const target = navItemBox(current, nav);
    const sameNav = from && Math.abs((from.navWidth || 0) - target.navWidth) < 2;
    if (from && from.width && from.height && sameNav && !reduceMotion) {
      nav.classList.add("is-sliding");
      placeNavIndicator(indicator, from, false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => placeNavIndicator(indicator, navItemBox(current, nav), true));
      });
      indicator.addEventListener("transitionend", finishSlide, { once: true });
      window.setTimeout(finishSlide, 600);
    }
  };

  const whenReady = document.fonts?.ready ?? Promise.resolve();
  whenReady.then(() => requestAnimationFrame(startSlide));

  navPageLinks(nav).forEach((link) => {
    link.addEventListener("click", () => {
      sessionStorage.setItem(navIndicatorKey, JSON.stringify(navItemBox(current, nav)));
    });
  });

  return indicator;
}

if (links) setupNavIndicator(links);

if (toggle && links) {
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function setContactOpen(open) {
  if (!contactBtn || !contactPanel) return;
  contactBtn.setAttribute("aria-expanded", String(open));
  contactPanel.hidden = !open;
}

if (contactBtn && contactPanel) {
  contactBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    setContactOpen(contactPanel.hidden);
  });

  document.addEventListener("click", (event) => {
    if (!contactItem?.contains(event.target)) {
      setContactOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setContactOpen(false);
    }
  });
}

document.querySelectorAll("[data-slider]").forEach((slider) => {
  const slides = [...slider.querySelectorAll(".project")];
  const prev = slider.querySelector("[data-slider-prev]");
  const next = slider.querySelector("[data-slider-next]");
  if (!slides.length) return;

  let index = slides.findIndex((slide) => !slide.hidden);
  if (index < 0) index = 0;

  function show(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.hidden = i !== index;
    });
  }

  prev?.addEventListener("click", () => show(index - 1));
  next?.addEventListener("click", () => show(index + 1));

  slider.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(index - 1);
    if (event.key === "ArrowRight") show(index + 1);
  });
});

const year = String(new Date().getFullYear());
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = year;
});

const introPhoto = document.querySelector(".intro-photo");
if (introPhoto && !reduceMotion) {
  const maxTilt = 4;

  introPhoto.addEventListener("mousemove", (event) => {
    const rect = introPhoto.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 2 * maxTilt;
    const rotateX = (0.5 - y) * 2 * maxTilt;
    introPhoto.style.transition = "transform 0.12s ease-out, box-shadow 0.2s ease, border-color 0.2s ease";
    introPhoto.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  introPhoto.addEventListener("mouseleave", () => {
    introPhoto.style.transition = "transform 0.45s ease, box-shadow 0.2s ease, border-color 0.2s ease";
    introPhoto.style.transform = "rotateX(0deg) rotateY(0deg)";
  });
}

const wannadoFilters = document.querySelector("[data-wannado-filters]");
const wannadoGrid = document.querySelector("[data-wannado-grid]");
const wannadoEmpty = document.querySelector("[data-wannado-empty]");
const priceFilter = document.querySelector("[data-price-filter]");

if (wannadoFilters && wannadoGrid) {
  const cards = [...wannadoGrid.querySelectorAll(".wannado")];
  const minInput = priceFilter?.querySelector("[data-price-min]");
  const maxInput = priceFilter?.querySelector("[data-price-max]");
  const priceFill = priceFilter?.querySelector("[data-price-fill]");
  const selects = [...wannadoFilters.querySelectorAll(".wannado-select")];

  function cardPrice(card) {
    const raw = card.querySelector(".wannado-price")?.textContent || "";
    const value = parseInt(raw.replace(/\D/g, ""), 10);
    return Number.isFinite(value) ? value : 0;
  }

  function selectedValues(selector) {
    return [...wannadoFilters.querySelectorAll(`${selector}:checked`)].map((input) => input.dataset.size || input.dataset.style);
  }

  function priceBounds() {
    let min = Number(minInput?.value || 50);
    let max = Number(maxInput?.value || 500);
    if (min > max) [min, max] = [max, min];
    return { min, max };
  }

  function updatePriceFill() {
    if (!priceFill || !minInput || !maxInput) return;
    const floor = Number(minInput.min);
    const ceil = Number(minInput.max);
    const { min, max } = priceBounds();
    const span = ceil - floor || 1;
    priceFill.style.left = `${((min - floor) / span) * 100}%`;
    priceFill.style.right = `${((ceil - max) / span) * 100}%`;
  }

  function closeSelects(except) {
    selects.forEach((select) => {
      if (select === except) return;
      const toggle = select.querySelector(".wannado-select-toggle");
      const menu = select.querySelector(".wannado-select-menu");
      toggle?.setAttribute("aria-expanded", "false");
      if (menu) menu.hidden = true;
    });
  }

  function applyWannadoFilters() {
    const sizes = selectedValues("[data-size]");
    const styles = selectedValues("[data-style]");
    const under100 = Boolean(wannadoFilters.querySelector("[data-under-100]:checked"));
    const { min, max } = priceBounds();
    let visible = 0;
    cards.forEach((card) => {
      const tags = (card.dataset.tags || "").split(/\s+/).filter(Boolean);
      const price = cardPrice(card);
      const styleOk = !styles.length || styles.some((style) => tags.includes(style));
      const cardSizes = (card.dataset.size || "").split(/\s+/).filter(Boolean);
      const sizeOk = !sizes.length || sizes.some((size) => cardSizes.includes(size));
      const rangeOk = price === 0 || (price >= min && price <= max);
      const underOk = !under100 || (price > 0 && price < 100) || tags.includes("under-100");
      card.hidden = !(styleOk && sizeOk && rangeOk && underOk);
      if (!card.hidden) visible += 1;
    });
    if (wannadoEmpty) wannadoEmpty.hidden = visible > 0;
    updatePriceFill();
    updateOuterGridCorners();
  }

  function toggleCheckbox(selector) {
    const input = wannadoFilters.querySelector(selector);
    if (!input) return;
    input.checked = !input.checked;
    applyWannadoFilters();
  }

  function resetFilters() {
    wannadoFilters.querySelectorAll("input[type='checkbox']").forEach((input) => {
      input.checked = false;
    });
    if (minInput) minInput.value = minInput.min;
    if (maxInput) maxInput.value = maxInput.max;
    closeSelects();
    applyWannadoFilters();
  }

  function onPriceInput(event) {
    if (!minInput || !maxInput) return;
    const min = Number(minInput.value);
    const max = Number(maxInput.value);
    if (event.target === minInput && min > max) minInput.value = String(max);
    if (event.target === maxInput && max < min) maxInput.value = String(min);
    applyWannadoFilters();
  }

  selects.forEach((select) => {
    const toggle = select.querySelector(".wannado-select-toggle");
    const menu = select.querySelector(".wannado-select-menu");
    toggle?.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = menu?.hidden ?? true;
      closeSelects(select);
      toggle.setAttribute("aria-expanded", String(open));
      if (menu) menu.hidden = !open;
    });
  });

  wannadoFilters.addEventListener("change", (event) => {
    if (event.target.matches("input[type='checkbox']")) applyWannadoFilters();
  });

  wannadoFilters.querySelector("[data-show-all]")?.addEventListener("click", resetFilters);

  wannadoGrid.addEventListener("click", (event) => {
    const tag = event.target.closest(".tag");
    if (!tag) return;
    if (tag.dataset.style) toggleCheckbox(`[data-style="${tag.dataset.style}"]`);
    if (tag.dataset.size) toggleCheckbox(`[data-size="${tag.dataset.size}"]`);
    if (tag.hasAttribute("data-under-100")) toggleCheckbox("[data-under-100]");
  });

  document.addEventListener("click", (event) => {
    if (!wannadoFilters.contains(event.target)) closeSelects();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSelects();
  });
  minInput?.addEventListener("input", onPriceInput);
  maxInput?.addEventListener("input", onPriceInput);
  applyWannadoFilters();
}

function updateGridCorners(grid, itemSelector) {
  if (!grid) return;
  const items = [...grid.querySelectorAll(itemSelector)].filter((item) => !item.hidden);
  grid.querySelectorAll(itemSelector).forEach((item) => {
    item.classList.remove("is-corner-tl", "is-corner-tr", "is-corner-bl", "is-corner-br");
  });
  if (!items.length) return;
  const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length || 1;
  const lastRowStart = Math.floor((items.length - 1) / cols) * cols;
  items[0].classList.add("is-corner-tl");
  items[Math.min(cols, items.length) - 1].classList.add("is-corner-tr");
  items[lastRowStart].classList.add("is-corner-bl");
  items[items.length - 1].classList.add("is-corner-br");
}

function updateOuterGridCorners() {
  updateGridCorners(document.querySelector(".mini-gallery"), ".mini-project");
  updateGridCorners(document.querySelector("[data-wannado-grid]"), ".wannado");
}

const miniFilters = document.querySelector("[data-mini-filters]");
const miniGallery = document.querySelector("[data-mini-gallery]") || document.querySelector(".mini-gallery");
const miniEmpty = document.querySelector("[data-mini-empty]");

if (miniFilters && miniGallery) {
  const items = [...miniGallery.querySelectorAll(".mini-project")];

  function applyMiniFilters() {
    const kinds = [...miniFilters.querySelectorAll("[data-kind]:checked")].map((input) => input.dataset.kind);
    let visible = 0;
    items.forEach((item) => {
      const kind = item.dataset.kind || "";
      item.hidden = Boolean(kinds.length) && !kinds.includes(kind);
      if (!item.hidden) visible += 1;
    });
    if (miniEmpty) miniEmpty.hidden = visible > 0;
    updateOuterGridCorners();
  }

  miniFilters.addEventListener("change", (event) => {
    if (event.target.matches("input[type='checkbox']")) applyMiniFilters();
  });

  miniFilters.querySelector("[data-show-all]")?.addEventListener("click", () => {
    miniFilters.querySelectorAll("input[type='checkbox']").forEach((input) => {
      input.checked = false;
    });
    applyMiniFilters();
  });

  miniGallery.addEventListener("click", (event) => {
    const caption = event.target.closest(".mini-project-tag");
    const item = caption?.closest(".mini-project");
    if (!item?.dataset.kind) return;
    const input = miniFilters.querySelector(`[data-kind="${item.dataset.kind}"]`);
    if (!input) return;
    input.checked = !input.checked;
    applyMiniFilters();
  });

  applyMiniFilters();
}

updateOuterGridCorners();
window.addEventListener("resize", updateOuterGridCorners);
