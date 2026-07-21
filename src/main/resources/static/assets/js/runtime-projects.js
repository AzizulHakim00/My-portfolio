(() => {
  "use strict";

  const runtimeTitles = new Set(["BusBD Intelligence", "Neon Bay", "DVWA Security Casebook"]);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const titleOf = (card) => card.querySelector(".project-body h3")?.textContent.trim() || "";

  const initializeGallery = (card, galleryIndex) => {
    const gallery = card.querySelector("[data-gallery]");
    if (!gallery || gallery.dataset.runtimeGallery === "true") return;
    gallery.dataset.runtimeGallery = "true";

    const slides = [...gallery.querySelectorAll(":scope > img")];
    const counter = gallery.querySelector(".gallery-controls b");
    const previous = gallery.querySelector("[data-prev]");
    const next = gallery.querySelector("[data-next]");
    if (slides.length < 2) return;

    let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("active")));
    let paused = false;
    const show = (requestedIndex) => {
      activeIndex = (requestedIndex + slides.length) % slides.length;
      slides.forEach((slide, index) => {
        slide.classList.toggle("active", index === activeIndex);
        slide.setAttribute("aria-hidden", String(index !== activeIndex));
      });
      if (counter) counter.textContent = `${activeIndex + 1} / ${slides.length}`;
    };

    previous?.addEventListener("click", () => show(activeIndex - 1));
    next?.addEventListener("click", () => show(activeIndex + 1));
    gallery.addEventListener("pointerenter", () => { paused = true; });
    gallery.addEventListener("pointerleave", () => { paused = false; });
    gallery.addEventListener("focusin", () => { paused = true; });
    gallery.addEventListener("focusout", () => { paused = false; });
    show(activeIndex);

    if (!reducedMotion) {
      window.setInterval(() => {
        if (!paused && document.visibilityState === "visible") show(activeIndex + 1);
      }, 5000 + galleryIndex * 190);
    }
  };

  const initialize = () => {
    const allCards = [...document.querySelectorAll(".project-card[data-category]")];
    allCards.filter((card) => runtimeTitles.has(titleOf(card))).forEach(initializeGallery);

    document.querySelectorAll("[data-filter]").forEach((button) => {
      if (button.dataset.runtimeFilterBound === "true") return;
      button.dataset.runtimeFilterBound = "true";
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
        document.querySelectorAll(".project-card[data-category]").forEach((card) => {
          const visible = filter === "all" || card.dataset.category === filter;
          card.classList.toggle("hidden", !visible);
          if (visible && !reducedMotion) {
            card.animate?.([
              { opacity: 0, transform: "translateY(12px)" },
              { opacity: 1, transform: "translateY(0)" }
            ], { duration: 340, easing: "ease-out" });
          }
        });
      });
    });
  };

  initialize();
  window.requestAnimationFrame(initialize);
  const grid = document.querySelector(".projects-grid");
  if (grid && "MutationObserver" in window) {
    new MutationObserver(initialize).observe(grid, { childList: true, subtree: true });
  }
})();