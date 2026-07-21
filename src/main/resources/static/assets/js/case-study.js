(() => {
  "use strict";
  const studies = window.PORTFOLIO_CASE_STUDIES || {};
  const pathSlug = location.pathname.split("/").filter(Boolean).pop();
  const querySlug = new URLSearchParams(location.search).get("slug");
  const slug = studies[pathSlug] ? pathSlug : querySlug;
  const data = studies[slug];
  const order = Object.keys(studies);

  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("portfolio-theme", theme);
    const button = document.querySelector(".case-theme");
    if (button) button.textContent = theme === "dark" ? "☀ Light" : "☾ Dark";
  };
  applyTheme(localStorage.getItem("portfolio-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  document.querySelector(".case-theme")?.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

  if (!data) {
    document.querySelector("main").innerHTML = `<section class="case-error"><p>PROJECT NOT FOUND</p><h1>This case study is not available.</h1><a href="/#projects">Return to projects →</a></section>`;
    return;
  }

  const setHead = (selector, tag, attributes) => {
    let element = document.head.querySelector(selector);
    if (!element) { element = document.createElement(tag); document.head.appendChild(element); }
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  };
  const canonicalUrl = `${location.origin}/projects/${slug}`;
  const previewUrl = `${location.origin}${data.images[0]}`;
  document.title = `${data.title} Case Study | Azizul Hakim Omor`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", data.summary);
  setHead('link[rel="canonical"]', "link", { rel: "canonical", href: canonicalUrl });
  setHead('meta[property="og:type"]', "meta", { property: "og:type", content: "article" });
  setHead('meta[property="og:title"]', "meta", { property: "og:title", content: document.title });
  setHead('meta[property="og:description"]', "meta", { property: "og:description", content: data.summary });
  setHead('meta[property="og:url"]', "meta", { property: "og:url", content: canonicalUrl });
  setHead('meta[property="og:image"]', "meta", { property: "og:image", content: previewUrl });
  setHead('meta[name="twitter:card"]', "meta", { name: "twitter:card", content: "summary_large_image" });

  document.querySelector('[data-eyebrow]').textContent = data.eyebrow;
  document.querySelector('[data-title]').textContent = data.title;
  document.querySelector('[data-summary]').textContent = data.summary;
  document.querySelector('[data-tags]').innerHTML = data.tags.map((tag) => `<span>${tag}</span>`).join("");
  const actions = document.querySelector('[data-actions]');
  actions.innerHTML = `<a class="case-button primary" href="${data.repo}" target="_blank" rel="noreferrer">GitHub repository ↗</a>${data.live ? `<a class="case-button" href="${data.live}" target="_blank" rel="noreferrer">Live application ↗</a>` : ""}`;
  document.querySelector('[data-problem]').textContent = data.problem;
  document.querySelector('[data-role]').textContent = data.role;
  document.querySelector('[data-challenge]').textContent = data.challenge;
  document.querySelector('[data-result]').textContent = data.result;
  document.querySelector('[data-features]').innerHTML = data.features.map((item) => `<li>${item}</li>`).join("");
  document.querySelector('[data-next]').innerHTML = data.next.map((item) => `<li>${item}</li>`).join("");
  document.querySelector('[data-architecture]').innerHTML = data.architecture.map((item, index) => `<div><span>${String(index + 1).padStart(2, "0")}</span><strong>${item}</strong></div>${index < data.architecture.length - 1 ? "<i>→</i>" : ""}`).join("");

  const gallery = document.querySelector('[data-gallery]');
  gallery.innerHTML = data.images.map((src, index) => `<button type="button" class="${index === 0 ? "active" : ""}" aria-label="Show screenshot ${index + 1}"><img src="${src}" alt="${data.title} screenshot ${index + 1}" loading="${index === 0 ? "eager" : "lazy"}"></button>`).join("");
  const stage = document.querySelector('[data-stage]');
  let imageIndex = 0;
  const show = (index) => {
    imageIndex = (index + data.images.length) % data.images.length;
    stage.src = data.images[imageIndex];
    stage.alt = `${data.title} screenshot ${imageIndex + 1}`;
    document.querySelector('[data-counter]').textContent = `${imageIndex + 1} / ${data.images.length}`;
    [...gallery.children].forEach((button, i) => button.classList.toggle("active", i === imageIndex));
  };
  [...gallery.children].forEach((button, index) => button.addEventListener("click", () => show(index)));
  document.querySelector('[data-prev]').addEventListener("click", () => show(imageIndex - 1));
  document.querySelector('[data-next-image]').addEventListener("click", () => show(imageIndex + 1));
  show(0);

  const current = order.indexOf(slug);
  const previousSlug = order[(current - 1 + order.length) % order.length];
  const nextSlug = order[(current + 1) % order.length];
  document.querySelector('[data-prev-project]').href = `/projects/${previousSlug}`;
  document.querySelector('[data-prev-project] strong').textContent = studies[previousSlug].title;
  document.querySelector('[data-next-project]').href = `/projects/${nextSlug}`;
  document.querySelector('[data-next-project] strong').textContent = studies[nextSlug].title;

  const progress = document.querySelector(".case-progress span");
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? scrollY / max * 100 : 0}%`;
  }, { passive: true });
})();
