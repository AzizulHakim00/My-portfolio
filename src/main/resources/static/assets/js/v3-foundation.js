(() => {
  "use strict";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const V3 = window.PortfolioV3 = window.PortfolioV3 || {};

  const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    localStorage.setItem("portfolio-theme", theme);
    const button = document.querySelector(".theme-toggle");
    if (button) {
      button.innerHTML = theme === "dark" ? "<span>☀</span><b>Light</b>" : "<span>☾</span><b>Dark</b>";
      button.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
    }
  };
  applyTheme(localStorage.getItem("portfolio-theme") || preferred);
  const header = document.querySelector(".site-header");
  if (header && !header.querySelector(".theme-toggle")) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    button.addEventListener("click", () => applyTheme(root.dataset.theme === "dark" ? "light" : "dark"));
    header.insertBefore(button, header.querySelector(".header-cv"));
    applyTheme(root.dataset.theme);
  }

  const summary = document.querySelector(".hero-summary");
  if (summary && !document.querySelector(".hero-terminal")) {
    summary.insertAdjacentHTML("afterend", `<div class="hero-terminal" aria-label="Current technical focus"><div class="terminal-bar"><span></span><span></span><span></span><b>azizul@portfolio:~</b></div><div class="terminal-body"><p><i>$</i> profile --focus</p><strong>AI / XAI / Cybersecurity / Software</strong><p><i>$</i> current_work</p><strong>Reliable clinical AI · Metamaterial sensing · Full-stack systems</strong></div></div>`);
  }
  const actions = document.querySelector(".hero-actions");
  if (actions && !document.querySelector(".hero-stats")) {
    actions.insertAdjacentHTML("afterend", `<div class="hero-stats"><div><strong>10+</strong><span>Documented projects</span></div><div><strong>2</strong><span>Active research drafts</span></div><div><strong>94</strong><span>Security assessment</span></div></div>`);
  }

  const meta = {
    "TaskFlow": { tags: "web django database python", page: "/projects/taskflow" },
    "Assignment Writer Hire": { tags: "java desktop database mysql", page: "/projects/assignment-writer-hire" },
    "Real Madrid Club Management": { tags: "java desktop database mysql", page: "/projects/real-madrid-management" },
    "FoodMoboChain": { tags: "mobile android firebase iot" },
    "Bank Management": { tags: "java desktop database sqlite", archive: true },
    "Firebase CRUD App": { tags: "mobile android firebase database" },
    "Movie Management System": { tags: "java desktop database", archive: true },
    "Café Shop Management": { tags: "java desktop database", archive: true },
    "Fruit Market": { tags: "java desktop ui", archive: true },
    "ICE Penetration-Testing Lab": { tags: "security cybersecurity pentest linux", page: "/projects/ice-pentest-lab" }
  };
  const cards = [...document.querySelectorAll(".project-card")];
  cards.forEach((card, index) => {
    const title = card.querySelector(".project-body h3")?.textContent.trim() || "";
    const data = meta[title] || { tags: "" };
    card.dataset.v3Tags = data.tags;
    card.classList.toggle("portfolio-archive-card", Boolean(data.archive));
    const figure = card.querySelector("figure");
    if (figure && !figure.querySelector(".project-number")) figure.insertAdjacentHTML("beforeend", `<span class="project-number">${String(index + 1).padStart(2, "0")}</span>`);
    const links = card.querySelector(".project-links");
    if (data.page && links && !links.querySelector(".case-study-link")) links.insertAdjacentHTML("afterbegin", `<a class="case-study-link" href="${data.page}">Full case study →</a>`);
    if (fine && !reduced) {
      card.addEventListener("pointermove", (event) => {
        const box = card.getBoundingClientRect();
        card.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
        card.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
        card.classList.add("spotlight-active");
      });
      card.addEventListener("pointerleave", () => card.classList.remove("spotlight-active"));
    }
  });

  const section = document.querySelector("#projects");
  const oldFilters = section?.querySelector(".project-filters");
  if (oldFilters) oldFilters.hidden = true;
  let selected = "all";
  let query = "";
  let archiveOpen = false;
  const applyFilter = () => cards.forEach((card) => {
    const tags = card.dataset.v3Tags || "";
    const matchesCategory = selected === "all" || tags.includes(selected);
    const matchesSearch = !query || card.textContent.toLowerCase().includes(query) || tags.includes(query);
    const archiveAllowed = !card.classList.contains("portfolio-archive-card") || archiveOpen || selected !== "all" || Boolean(query);
    card.classList.toggle("hidden", !(matchesCategory && matchesSearch && archiveAllowed));
  });
  const setFilter = (value) => {
    selected = value;
    document.querySelectorAll(".v3-filter-chip").forEach((button) => button.classList.toggle("active", button.dataset.filter === value));
    applyFilter();
    section?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };
  V3.setFilter = setFilter;

  if (oldFilters && !section.querySelector(".advanced-project-controls")) {
    oldFilters.insertAdjacentHTML("afterend", `<div class="advanced-project-controls reveal visible"><label class="project-search"><span>Search projects</span><input type="search" placeholder="Try JavaFX, Django, Firebase, security..." aria-label="Search projects"></label><div class="v3-filter-chips" role="group" aria-label="Project categories"><button class="v3-filter-chip active" type="button" data-filter="all">All</button><button class="v3-filter-chip" type="button" data-filter="web">Web</button><button class="v3-filter-chip" type="button" data-filter="java">Java</button><button class="v3-filter-chip" type="button" data-filter="mobile">Mobile</button><button class="v3-filter-chip" type="button" data-filter="security">Cybersecurity</button><button class="v3-filter-chip" type="button" data-filter="database">Database</button></div></div>`);
    section.querySelectorAll(".v3-filter-chip").forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter)));
    section.querySelector(".project-search input")?.addEventListener("input", (event) => { query = event.target.value.trim().toLowerCase(); applyFilter(); });
  }
  const grid = section?.querySelector(".projects-grid");
  const oldArchive = section?.querySelector(".archive-toggle-wrap");
  oldArchive?.remove();
  const archiveCount = cards.filter((card) => card.classList.contains("portfolio-archive-card")).length;
  if (grid && archiveCount) {
    grid.insertAdjacentHTML("afterend", `<div class="archive-toggle-wrap"><button class="archive-toggle" type="button" aria-expanded="false">Show project archive (${archiveCount})</button></div>`);
    const button = section.querySelector(".archive-toggle");
    button.addEventListener("click", () => { archiveOpen = !archiveOpen; button.setAttribute("aria-expanded", archiveOpen); button.textContent = archiveOpen ? "Hide project archive" : `Show project archive (${archiveCount})`; applyFilter(); });
  }
  applyFilter();

  const skills = document.querySelector("#skills");
  if (skills && !document.querySelector("#systems-map")) {
    skills.insertAdjacentHTML("afterend", `<section class="section systems-map" id="systems-map"><div class="shell"><div class="section-heading heading-visible"><p class="eyebrow"><span>02A</span> INTERACTIVE SYSTEMS MAP</p><h2>Choose a capability and see the <em>evidence.</em></h2></div><div class="systems-map-stage"><button data-action="ai"><strong>Explainable AI</strong><span>Thyro-RIFT · reliability · calibration</span></button><button data-action="java"><strong>Software Engineering</strong><span>JavaFX · Spring · databases</span></button><div class="systems-map-core"><span>AZIZUL</span><strong>BUILD / TEST / EXPLAIN</strong></div><button data-action="security"><strong>Cybersecurity</strong><span>Recon · validation · reporting</span></button><button data-action="mobile"><strong>IoT & Mobile</strong><span>Android · Firebase · connected flows</span></button><button data-action="rf"><strong>RF Sensing</strong><span>CST · metamaterial · microwave</span></button></div></div></section>`);
    document.querySelectorAll("#systems-map [data-action]").forEach((button) => button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (["java", "security", "mobile"].includes(action)) return setFilter(action);
      const target = document.querySelector(action === "ai" ? "#thyro-rift" : "#dual-band");
      target?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      target?.classList.add("evidence-highlight");
      setTimeout(() => target?.classList.remove("evidence-highlight"), 1800);
    }));
  }

  const researchHeading = document.querySelector("#research .research-heading");
  if (researchHeading && !document.querySelector(".research-pipeline")) researchHeading.insertAdjacentHTML("afterend", `<div class="research-pipeline reveal visible"><div><span>01</span><strong>Problem</strong><small>Define the decision and assumptions</small></div><i></i><div><span>02</span><strong>Data</strong><small>Audit quality, shifts and missingness</small></div><i></i><div><span>03</span><strong>Model</strong><small>Build reliable learning pipelines</small></div><i></i><div><span>04</span><strong>Evaluation</strong><small>Validate, calibrate and stress-test</small></div><i></i><div><span>05</span><strong>Explain</strong><small>Show evidence and limitations</small></div></div>`);
})();
