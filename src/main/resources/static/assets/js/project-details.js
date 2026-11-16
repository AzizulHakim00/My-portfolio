(() => {
  "use strict";

  const addStyle = (href) => {
    if (document.querySelector(`link[href^="${href.split("?")[0]}"]`)) return;
    const node = document.createElement("link");
    node.rel = "stylesheet";
    node.href = href;
    document.head.appendChild(node);
  };
  const addScript = (src) => {
    if (document.querySelector(`script[src^="${src.split("?")[0]}"]`)) return;
    const node = document.createElement("script");
    node.src = src;
    node.async = false;
    document.head.appendChild(node);
  };

  addStyle("/assets/css/upgrade.css?v=20261116-portfolio");
  addScript("/assets/js/upgrade.js?v=20261116-portfolio");

  addStyle("/assets/css/project-details.css?v=single-logo-1");

  const cards = [...document.querySelectorAll(".project-card[data-category]")];
  const modal = document.createElement("dialog");
  modal.className = "project-details-modal";
  modal.innerHTML = `<button class="project-details-close" type="button" aria-label="Close project details">×</button><div class="project-details-layout"><section class="project-details-visual"><div class="project-details-stage"><img alt=""></div><div class="project-details-gallery-controls"><button type="button" data-prev aria-label="Previous screenshot">←</button><b>1 / 1</b><button type="button" data-next aria-label="Next screenshot">→</button></div><div class="project-details-thumbs"></div></section><section class="project-details-copy"><p class="project-type" data-type></p><h2 data-title></h2><p class="project-details-description" data-description></p><div class="project-details-section"><h3>Technology stack</h3><ul data-tech></ul></div><div class="project-details-section"><h3>Project highlights</h3><ul data-highlights></ul></div><div class="project-details-actions" data-actions></div></section></div>`;
  document.body.appendChild(modal);

  const q = (selector) => modal.querySelector(selector);
  const stage = q(".project-details-stage img");
  const thumbs = q(".project-details-thumbs");
  const counter = q(".project-details-gallery-controls b");
  const previous = q("[data-prev]");
  const next = q("[data-next]");
  const modalTitle = q("[data-title]");
  let images = [];
  let imageIndex = 0;
  let returnFocus = null;

  const highlights = {
    "BusBD Intelligence": ["PostgreSQL persistence and Flyway migrations","Redis-compatible seat locking and idempotent booking","Signed QR ticket verification and mock payments","Live GPS tracking and a journey planner with fare, time, and carbon estimates"],
    "JerseySee": ["JWT authentication with customer and staff roles","Product variants and SKU-level inventory","Transaction-aware Caffeine cache and optional Cloudinary uploads","Simulated checkout and payment workflows"],
    "Food Mobo Chain": ["Spring Security with JWT cookies and CSRF protection","Spring Data MongoDB and a cached public catalog","Server-signed Cloudinary image upload support","Render staging with a MongoDB readiness endpoint"],
    "Ase Naki?": ["Power Grid Bangladesh and IODA status feeds","Optional Cloudflare Radar integration","Signed-in reporting with image evidence","Persisted snapshots with clear unavailable states"],
    "IncidentCommander AI": ["Plain text, JSON Lines, and CSV log ingestion","TF-IDF, K-Means, and Isolation Forest","Request traces, service dependencies, and evidence-backed cause ranking","Replayable scenarios and optional sensitive-data redaction"],
    "CreatorOS Studio": ["Publishing queue with calendar export","Transcript import, editing, and SRT export","Campaign planning, creator CRM, and approval queues","IndexedDB workspace storage with D1 and R2 support"],
    "StreamNova": ["TMDB discovery for movies, TV, and anime","Regional streaming, rental, and purchase provider links","Watchlist, Continue Watching, ratings, and reviews","HTML5 media playback, HLS, and official trailer embeds"],
    "Neon Bay": ["Five purchasable properties and eight replayable contracts","Adaptive enemy AI and five-star police escalation","Vehicle upgrades, contract rewards, and persistent location data","Multi-slot saves, backups, and legacy-save migration"],
    "Expense Tracker": ["Authenticated expense creation and browsing","Category breakdowns and personal dashboards","MongoDB persistence","Spring Security sessions, CSRF protection, and BCrypt passwords"],
    "Maze Bank Management System": ["Client and administrator workflows backed by SQLite","Atomic transfers with balance validation and rollback","PBKDF2 password hashing","Transaction history and client account management"],
    "Monthly Cost Planner": ["Monthly income, planned spending, and remaining budget","Editable expense categories and amounts","Visual breakdown of budget allocations"],
    "PrintPulse": ["Request form with print options and estimated costs","Campus print queue with job status","Completed jobs and charge history"],
    "TaskFlow": ["Registration, authentication and user-scoped dashboards", "Tasks with priority, status, due dates, search and filtering", "Profile editing and password management", "Deployed full-stack Django application"],
    "Assignment Writer Hire": ["Student and administrator stakeholder workflows", "Requests, writer selection, orders and history", "Administration screens for users and writers", "JavaFX, FXML and MySQL architecture"],
    "Real Madrid Club Management": ["Players, matches, transfers and training management", "Formation editing and performance records", "FXML controllers and database persistence", "Six documented working screens"],
    "CareerPilot AI": ["Explainable ATS scoring and skills-gap analysis", "Role matching and a 90-day roadmap", "Interview practice and private application tracking"],
    "CivicLens AI": ["Road hazard reports with location and evidence", "Severity, duplicate warnings, and an authority dashboard", "Rule-based demo inference and an optional FastAPI / ONNX service"],
    "Firebase CRUD App": ["Firebase Authentication", "Realtime Database create, update and delete operations", "Restaurant, food and order screens", "Android learning project"],
    "CPU Scheduling Visualizer": ["Six CPU scheduling algorithms", "Editable process inputs and Round Robin quantum", "Gantt charts and per-process metrics", "Side-by-side comparisons with independent inputs"],
    "DVWA Security Casebook": ["Ten controlled-lab vulnerability modules", "Twenty-five payload and command records", "Thirty-eight indexed evidence screenshots", "Search, severity filters, fullscreen evidence and remediation guidance"]
  };
  const studies = {
    "TaskFlow": "/projects/taskflow",
    "Assignment Writer Hire": "/projects/assignment-writer-hire",
    "Real Madrid Club Management": "/projects/real-madrid-management",
    "DVWA Security Casebook": "/projects/dvwa-security-casebook"
  };

  const show = (requested) => {
    imageIndex = (requested + images.length) % images.length;
    stage.src = images[imageIndex].src;
    stage.alt = images[imageIndex].alt || `${modalTitle.textContent} screenshot ${imageIndex + 1}`;
    counter.textContent = `${imageIndex + 1} / ${images.length}`;
    previous.hidden = images.length < 2;
    next.hidden = images.length < 2;
    [...thumbs.children].forEach((button, index) => button.classList.toggle("active", index === imageIndex));
  };

  const open = (card, trigger) => {
    returnFocus = trigger;
    const name = card.querySelector(".project-body h3")?.textContent.trim() || "Project details";
    const type = card.querySelector(".project-type")?.textContent.trim() || "Portfolio project";
    const description = card.querySelector(".project-body > p:not(.project-type)")?.textContent.trim() || "";
    const technologies = [...card.querySelectorAll(".project-body li")].map((item) => item.textContent.trim());
    const links = [...card.querySelectorAll(".project-links a")];
    images = [...card.querySelectorAll("figure img")].map((image) => ({ src: image.dataset.src || image.currentSrc || image.src, alt: image.alt }));
    if (!images.length) images = [{ src: "/assets/images/projects/project-fallback.svg", alt: `${name} project visual` }];

    q("[data-type]").textContent = type;
    modalTitle.textContent = name;
    q("[data-description]").textContent = description;
    q("[data-tech]").replaceChildren(...technologies.map((text) => Object.assign(document.createElement("li"), { textContent: text })));
    q("[data-highlights]").replaceChildren(...(highlights[name] || ["Portfolio project summary", `${images.length} project visuals`, "Verified links are shown below"]).map((text) => Object.assign(document.createElement("li"), { textContent: text })));
    q("[data-actions]").replaceChildren(...links.map((link) => { const clone = link.cloneNode(true); clone.className = "project-details-action"; return clone; }));
    thumbs.replaceChildren(...images.map((data, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `Show screenshot ${index + 1}`);
      const image = document.createElement("img");
      image.src = data.src;
      image.alt = "";
      image.loading = "lazy";
      button.appendChild(image);
      button.addEventListener("click", () => show(index));
      return button;
    }));
    imageIndex = 0;
    show(0);
    modal.showModal();
    document.body.classList.add("project-details-open");
    q(".project-details-close").focus();
  };

  cards.forEach((card) => {
    const name = card.querySelector(".project-body h3")?.textContent.trim();
    const links = card.querySelector(".project-links");
    if (!links) return;
    if (studies[name]) {
      const link = document.createElement("a");
      link.className = "project-case-study-link";
      link.href = studies[name];
      link.textContent = "Full case study ↗";
      links.prepend(link);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "project-view-details";
    button.textContent = "Quick view ↗";
    button.addEventListener("click", () => open(card, button));
    links.prepend(button);
  });

  previous.addEventListener("click", () => show(imageIndex - 1));
  next.addEventListener("click", () => show(imageIndex + 1));
  const close = () => { modal.close(); document.body.classList.remove("project-details-open"); returnFocus?.focus(); };
  q(".project-details-close").addEventListener("click", close);
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  modal.addEventListener("cancel", (event) => { event.preventDefault(); close(); });
  document.addEventListener("keydown", (event) => { if (!modal.open) return; if (event.key === "ArrowLeft") show(imageIndex - 1); if (event.key === "ArrowRight") show(imageIndex + 1); });
})();
