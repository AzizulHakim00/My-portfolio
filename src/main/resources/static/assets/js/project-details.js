(() => {
  "use strict";

  const loadStyle = (href) => {
    if (document.querySelector(`link[href^="${href.split("?")[0]}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  };

  const loadScript = (src) => {
    if (document.querySelector(`script[src^="${src.split("?")[0]}"]`)) return;
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  };

  // Keep the clean pre-V3 homepage presentation and its subtle motion system.
  loadStyle("/assets/css/upgrade.css?v=20260721-motion");
  loadScript("/assets/js/upgrade.js?v=20260721-motion");

  const cards = [...document.querySelectorAll(".project-card[data-category]")];
  if (!cards.length) return;

  loadStyle("/assets/css/project-details.css?v=20260719");

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
  const title = q("[data-title]");
  let images = [];
  let index = 0;
  let returnFocus = null;

  const highlightsByProject = {
    "TaskFlow": ["Registration, authentication and user-scoped dashboards", "Tasks with priority, status, due dates, search and filtering", "Profile editing and password management", "Deployed full-stack Django application"],
    "Assignment Writer Hire": ["Student and administrator stakeholder workflows", "Requests, writer selection, orders and history", "Administration screens for users and writers", "JavaFX, FXML and MySQL architecture"],
    "Real Madrid Club Management": ["Players, matches, transfers and training management", "Formation editing and performance records", "FXML controllers and database persistence", "Six documented working screens"],
    "FoodMoboChain": ["Registration and authentication mobile flow", "Restaurant discovery and food details", "Ordering workflow and cloud-backed direction", "Mobile-first interface case study"],
    "Bank Management": ["Administrator and client dashboards", "Accounts, deposits and transaction records", "Persistent SQLite data", "JavaFX coursework system"],
    "Firebase CRUD App": ["Firebase Authentication", "Realtime Database create, update and delete operations", "Restaurant, food and order screens", "Android learning project"],
    "Movie Management System": ["Collaborative coursework archive", "Desktop management and database direction", "Authorship presented honestly", "Full case study planned after verified evidence"],
    "Café Shop Management": ["Inventory and order-management direction", "JavaFX and FXML structure", "SQL-backed reporting scope", "Upcoming verified case study"],
    "Fruit Market": ["Product cards and storefront layout", "Selection and cart interactions", "Delivery-oriented visual components", "JavaFX, FXML and CSS interface"],
    "ICE Penetration-Testing Lab": ["Authorized Windows 7 test environment", "Nmap reconnaissance and SMB enumeration", "MS17-010 validation and controlled Metasploit workflow", "Meterpreter checks and evidence-driven reporting"]
  };

  const caseStudies = {
    "TaskFlow": "/projects/taskflow",
    "Assignment Writer Hire": "/projects/assignment-writer-hire",
    "Real Madrid Club Management": "/projects/real-madrid-management",
    "ICE Penetration-Testing Lab": "/projects/ice-pentest-lab"
  };

  const show = (requested) => {
    index = (requested + images.length) % images.length;
    stage.src = images[index].src;
    stage.alt = images[index].alt || `${title.textContent} screenshot ${index + 1}`;
    counter.textContent = `${index + 1} / ${images.length}`;
    previous.hidden = images.length < 2;
    next.hidden = images.length < 2;
    [...thumbs.children].forEach((button, i) => button.classList.toggle("active", i === index));
  };

  const open = (card, trigger) => {
    returnFocus = trigger;
    const name = card.querySelector(".project-body h3")?.textContent.trim() || "Project details";
    const type = card.querySelector(".project-type")?.textContent.trim() || "Portfolio project";
    const description = card.querySelector(".project-body > p:not(.project-type)")?.textContent.trim() || "";
    const technologies = [...card.querySelectorAll(".project-body li")].map((item) => item.textContent.trim());
    const links = [...card.querySelectorAll(".project-links a")];
    images = [...card.querySelectorAll("figure img")].map((image) => ({ src: image.currentSrc || image.src, alt: image.alt }));
    if (!images.length) images = [{ src: "/assets/images/projects/project-fallback.svg", alt: `${name} project visual` }];

    q("[data-type]").textContent = type;
    title.textContent = name;
    q("[data-description]").textContent = description;
    q("[data-tech]").replaceChildren(...technologies.map((text) => Object.assign(document.createElement("li"), { textContent: text })));
    q("[data-highlights]").replaceChildren(...(highlightsByProject[name] || ["Portfolio project summary", `${images.length} project visual${images.length === 1 ? "" : "s"}`, "Available source and deployment links are shown below"]).map((text) => Object.assign(document.createElement("li"), { textContent: text })));
    q("[data-actions]").replaceChildren(...links.map((link) => { const clone = link.cloneNode(true); clone.className = "project-details-action"; return clone; }));
    thumbs.replaceChildren(...images.map((data, i) => { const button = document.createElement("button"); button.type = "button"; button.setAttribute("aria-label", `Show screenshot ${i + 1}`); const image = document.createElement("img"); image.src = data.src; image.alt = ""; button.appendChild(image); button.addEventListener("click", () => show(i)); return button; }));
    index = 0;
    show(0);
    modal.showModal();
    document.body.classList.add("project-details-open");
    q(".project-details-close").focus();
  };

  cards.forEach((card) => {
    const name = card.querySelector(".project-body h3")?.textContent.trim();
    if (name === "ICE Penetration-Testing Lab") {
      const gallery = card.querySelector("[data-gallery]");
      const current = gallery?.querySelector(":scope > img.active");
      current?.classList.remove("active");
      const cover = document.createElement("img");
      cover.src = "/assets/images/projects/ice-cybersecurity/00-command-dashboard.svg?v=20260719";
      cover.alt = "ICE Penetration-Testing Lab command, findings and evidence dashboard";
      cover.className = "active";
      gallery?.prepend(cover);
    }

    const links = card.querySelector(".project-links");
    if (!links) return;

    const caseStudyUrl = caseStudies[name];
    if (caseStudyUrl && !links.querySelector(".project-case-study-link")) {
      const caseStudyLink = document.createElement("a");
      caseStudyLink.className = "project-case-study-link";
      caseStudyLink.href = caseStudyUrl;
      caseStudyLink.textContent = "Full case study ↗";
      links.prepend(caseStudyLink);
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "project-view-details";
    button.textContent = "Quick view ↗";
    button.addEventListener("click", () => open(card, button));
    links.prepend(button);
  });

  previous.addEventListener("click", () => show(index - 1));
  next.addEventListener("click", () => show(index + 1));
  const close = () => { modal.close(); document.body.classList.remove("project-details-open"); returnFocus?.focus(); };
  q(".project-details-close").addEventListener("click", close);
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  modal.addEventListener("cancel", (event) => { event.preventDefault(); close(); });
  document.addEventListener("keydown", (event) => { if (!modal.open) return; if (event.key === "ArrowLeft") show(index - 1); if (event.key === "ArrowRight") show(index + 1); });
})();
