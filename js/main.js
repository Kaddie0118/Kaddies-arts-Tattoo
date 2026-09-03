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
  indicator.classList.add("is-ready");
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

  const placeCurrent = (animate) => {
    placeNavIndicator(indicator, navItemBox(current, nav), animate);
  };

  const startSlide = () => {
    const target = navItemBox(current, nav);
    const sameNav = from && Math.abs((from.navWidth || 0) - target.navWidth) < 4;
    if (from && from.width && from.height && sameNav && !reduceMotion) {
      placeNavIndicator(indicator, from, false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => placeCurrent(true));
      });
      return;
    }
    placeCurrent(false);
  };

  const whenReady = document.fonts?.ready ?? Promise.resolve();
  whenReady.then(() => requestAnimationFrame(startSlide));
  window.addEventListener("resize", () => placeCurrent(false));

  navPageLinks(nav).forEach((link) => {
    link.addEventListener("click", () => {
      sessionStorage.setItem(navIndicatorKey, JSON.stringify(navItemBox(current, nav)));
    });
  });

  return indicator;
}

if (links) setupNavIndicator(links);

if (toggle && links) {
  const desktopNav = window.matchMedia("(min-width: 803px)");
  const syncNav = () => {
    if (desktopNav.matches) {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  };
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  desktopNav.addEventListener("change", syncNav);
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

const year = String(new Date().getFullYear());
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = year;
});

if (!reduceMotion) {
  const maxTilt = 4;
  document.querySelectorAll(".intro-photo, .certificate-visual").forEach((photo) => {
    photo.addEventListener("mousemove", (event) => {
      const rect = photo.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 2 * maxTilt;
      const rotateX = (0.5 - y) * 2 * maxTilt;
      photo.style.transition = "transform 0.12s ease-out, box-shadow 0.2s ease, border-color 0.2s ease";
      photo.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    photo.addEventListener("mouseleave", () => {
      photo.style.transition = "transform 0.45s ease, box-shadow 0.2s ease, border-color 0.2s ease";
      photo.style.transform = "rotateX(0deg) rotateY(0deg)";
    });
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
  updateGridCorners(document.querySelector(".services"), ".service-card");
  updateGridCorners(document.querySelector(".reviews"), ".review-card");
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
    if (caption) {
      const item = caption.closest(".mini-project");
      if (!item?.dataset.kind) return;
      const input = miniFilters.querySelector(`[data-kind="${item.dataset.kind}"]`);
      if (!input) return;
      input.checked = !input.checked;
      applyMiniFilters();
      return;
    }

    const item = event.target.closest(".mini-project");
    const img = item?.querySelector("img");
    if (!img || item.hidden) return;
    openMiniLightbox(img);
  });

  applyMiniFilters();
}

function createMiniLightbox() {
  const box = document.createElement("div");
  box.className = "lightbox";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Bildansicht");
  box.innerHTML = `
    <button class="lightbox-close" type="button" aria-label="Schließen">×</button>
    <button class="lightbox-prev" type="button" aria-label="Vorheriges Bild">‹</button>
    <img class="lightbox-image" alt="" />
    <button class="lightbox-next" type="button" aria-label="Nächstes Bild">›</button>
  `;
  document.body.append(box);
  return box;
}

function openMiniLightbox(startImg) {
  const gallery = document.querySelector("[data-mini-gallery]") || document.querySelector(".mini-gallery");
  if (!gallery) return;

  const visibleImgs = [...gallery.querySelectorAll(".mini-project:not([hidden]) img")];
  let index = visibleImgs.indexOf(startImg);
  if (index < 0) index = 0;

  const box = document.querySelector(".lightbox") || createMiniLightbox();
  const image = box.querySelector(".lightbox-image");
  const closeBtn = box.querySelector(".lightbox-close");
  const prevBtn = box.querySelector(".lightbox-prev");
  const nextBtn = box.querySelector(".lightbox-next");

  function show(nextIndex) {
    index = (nextIndex + visibleImgs.length) % visibleImgs.length;
    const current = visibleImgs[index];
    image.src = current.currentSrc || current.src;
    image.alt = current.alt || "";
  }

  function close() {
    box.hidden = true;
    document.body.classList.remove("is-lightbox-open");
    document.removeEventListener("keydown", onKey);
  }

  function onKey(event) {
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") show(index - 1);
    if (event.key === "ArrowRight") show(index + 1);
  }

  closeBtn.onclick = close;
  prevBtn.onclick = () => show(index - 1);
  nextBtn.onclick = () => show(index + 1);
  box.onclick = (event) => {
    if (event.target === box) close();
  };

  document.addEventListener("keydown", onKey);
  document.body.classList.add("is-lightbox-open");
  box.hidden = false;
  show(index);
  closeBtn.focus();
}

updateOuterGridCorners();
window.addEventListener("resize", updateOuterGridCorners);

const workSlideshowSlides = [
  {
    src: "img/gallery/tausendfuessler-freehand.jpg",
    alt: "Freehand-Tattoo eines Tausendfüßlers",
  },
  {
    src: "img/gallery/naruto-animepanel.jpg",
    alt: "Manga-Panel Tattoo mit einem Anime-Auge",
  },
  {
    src: "img/gallery/engelsfluegel-wannado.jpg",
    alt: "Wannado-Tattoo mit Engelsflügeln am Handgelenk",
  },
  {
    src: "img/gallery/datum-schriftzug.jpg",
    alt: "Schriftzug-Tattoo mit den Jahreszahlen 1980 und 1981",
  },
  {
    src: "img/gallery/sonnenblumen-freehand.jpg",
    alt: "Freehand-Tattoo von zwei Sonnenblumen auf einem Unterarm",
  },
];

function createWorkSlide(item) {
  const figure = document.createElement("figure");
  figure.className = "work-slide";
  const img = document.createElement("img");
  img.src = item.src;
  img.alt = item.alt;
  figure.append(img);
  return figure;
}

document.querySelectorAll("[data-slideshow]").forEach((slideshow) => {
  const items = workSlideshowSlides;
  const count = items.length;
  if (!count) return;

  const frame = document.createElement("div");
  frame.className = "work-slideshow-frame";
  const track = document.createElement("div");
  track.className = "work-slideshow-track";
  const dotsWrap = document.createElement("div");
  dotsWrap.className = "work-slideshow-dots";

  const lead = createWorkSlide(items[count - 1]);
  const slides = items.map((item) => createWorkSlide(item));
  const trail = createWorkSlide(items[0]);
  const nodes = [lead, ...slides, trail];
  nodes.forEach((node) => track.append(node));

  frame.append(track);
  slideshow.replaceChildren(frame, dotsWrap);

  let index = 0;
  let timer = null;
  let locked = false;

  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "work-slideshow-dot";
    dot.setAttribute("aria-label", `Bild ${i + 1}`);
    dot.addEventListener("click", () => {
      if (i === index) return;
      if (i === (index + 1) % count) step(1);
      else if (i === (index - 1 + count) % count) step(-1);
      else goTo(i, true);
    });
    dotsWrap.append(dot);
    return dot;
  });

  function centerOn(el, animate) {
    const offset = frame.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2);
    if (!animate || reduceMotion) {
      track.style.transition = "none";
      track.style.transform = `translateX(${offset}px)`;
      void track.offsetWidth;
      track.style.transition = "";
      return;
    }
    track.style.transform = `translateX(${offset}px)`;
  }

  function setClasses(realIndex, activeNode = slides[realIndex]) {
    const prev = (realIndex - 1 + count) % count;
    const next = (realIndex + 1) % count;
    nodes.forEach((node) => {
      node.classList.remove("is-active", "is-prev", "is-next");
    });
    activeNode.classList.add("is-active");
    if (activeNode === trail) {
      slides[count - 1].classList.add("is-prev");
    } else if (activeNode === lead) {
      slides[0].classList.add("is-next");
    } else {
      (realIndex === 0 ? lead : slides[prev]).classList.add("is-prev");
      (realIndex === count - 1 ? trail : slides[next]).classList.add("is-next");
    }
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === realIndex);
    });
  }

  function afterTransition(done) {
    const onEnd = (event) => {
      if (event.target !== track || event.propertyName !== "transform") return;
      track.removeEventListener("transitionend", onEnd);
      done();
    };
    track.addEventListener("transitionend", onEnd);
  }

  function goTo(realIndex, animate) {
    if (locked) return;
    index = (realIndex + count) % count;
    setClasses(index);
    centerOn(slides[index], animate);
    restart();
  }

  function step(delta) {
    if (locked) return;
    const from = index;
    const to = (index + delta + count) % count;

    if (reduceMotion) {
      goTo(to, false);
      return;
    }

    if (delta > 0 && from === count - 1) {
      locked = true;
      setClasses(0, trail);
      centerOn(trail, true);
      afterTransition(() => {
        index = 0;
        setClasses(0);
        centerOn(slides[0], false);
        locked = false;
        restart();
      });
      return;
    }

    if (delta < 0 && from === 0) {
      locked = true;
      setClasses(count - 1, lead);
      centerOn(lead, true);
      afterTransition(() => {
        index = count - 1;
        setClasses(count - 1);
        centerOn(slides[count - 1], false);
        locked = false;
        restart();
      });
      return;
    }

    goTo(to, true);
  }

  lead.addEventListener("click", () => step(-1));
  trail.addEventListener("click", () => step(1));
  slides.forEach((slide, i) => {
    slide.addEventListener("click", () => {
      if (i === index) return;
      if (slide.classList.contains("is-prev")) step(-1);
      else if (slide.classList.contains("is-next")) step(1);
      else goTo(i, true);
    });
  });

  function restart() {
    window.clearInterval(timer);
    if (reduceMotion) return;
    timer = window.setInterval(() => step(1), 5000);
  }

  function recenter() {
    centerOn(slides[index], false);
  }

  track.querySelectorAll("img").forEach((img) => {
    if (img.complete) recenter();
    else img.addEventListener("load", recenter);
  });

  window.addEventListener("resize", recenter);
  slideshow.addEventListener("mouseenter", () => window.clearInterval(timer));
  slideshow.addEventListener("mouseleave", restart);
  goTo(0, false);
});
