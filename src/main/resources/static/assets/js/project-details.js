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

  loadStyle("/assets/css/upgrade.css?v=20260721-motion");
  loadScript("/assets/js/upgrade.js?v=20260721-motion");

  const grid = document.querySelector(".projects-grid");
  if (!grid) return;

  const cardByTitle = (title) => [...grid.querySelectorAll(".project-card")]
    .find((card) => card.querySelector(".project-body h3")?.textContent.trim() === title);

  const createProjectCard = ({ category, title, type, description, technologies, images, badge, links }) => {
    const article = document.createElement("article");
    article.className = "project-card reveal visible";
    article.dataset.category = category;
    article.innerHTML = `
      <figure class="project-gallery" data-gallery>
        ${images.map((image, index) => `<img${index === 0 ? ' class="active"' : ''} src="${image.src}" alt="${image.alt}"${index === 0 ? '' : ' loading="lazy"'}>`).join("")}
        <span>${badge}</span>
        <div class="gallery-controls"><button type="button" data-prev aria-label="Previous ${title} screenshot">←</button><b>1 / ${images.length}</b><button type="button" data-next aria-label="Next ${title} screenshot">→</button></div>
      </figure>
      <div class="project-body">
        <p class="project-type">${type}</p>
        <h3>${title}</h3>
        <p>${description}</p>
        <ul>${technologies.map((technology) => `<li>${technology}</li>`).join("")}</ul>
        <div class="project-links">${links.map((link) => `<a href="${link.href}"${link.external ? ' target="_blank" rel="noreferrer"' : ''}>${link.label}</a>`).join("")}</div>
      </div>`;
    return article;
  };

  if (!cardByTitle("BusBD Intelligence")) {
    const busCard = createProjectCard({
      category: "web",
      title: "BusBD Intelligence",
      type: "SPRING BOOT · REACT · POSTGRESQL · REDIS",
      description: "An enterprise bus-booking and travel-intelligence platform with passenger profiles, advanced seat layouts, persistent bookings, Redis-compatible seat locking, mock payments, signed QR verification, cancellation, refunds and live route intelligence.",
      technologies: ["Java 21", "Spring Boot", "React", "PostgreSQL", "Redis"],
      images: [
        { src: "/assets/images/projects/busbd-intelligence/01-search-hero.svg", alt: "BusBD Intelligence deployed search and booking homepage" },
        { src: "/assets/images/projects/busbd-intelligence/02-live-tracking.svg", alt: "BusBD Intelligence live tracking and AI arrival prediction interface" }
      ],
      badge: "LIVE ENTERPRISE PLATFORM",
      links: [
        { href: "https://busbd-intelligence.onrender.com/", label: "Live application ↗", external: true },
        { href: "https://github.com/AzizulHakim00/BusBD-Intelligence", label: "GitHub repository ↗", external: true }
      ]
    });
    cardByTitle("TaskFlow")?.insertAdjacentElement("afterend", busCard);
  }

  if (!cardByTitle("Neon Bay")) {
    const neonCard = createProjectCard({
      category: "web",
      title: "Neon Bay",
      type: "THREE.JS · VITE · BROWSER 3D GAME",
      description: "An original browser-based 3D open-city action game with five connected missions, driving, combat, police pursuit, shops, saving, dynamic weather, desktop and mobile controls, modular AI and distinct vehicle handling.",
      technologies: ["Three.js", "JavaScript", "Vite", "Game AI", "WebGL"],
      images: [
        { src: "/assets/images/projects/neon-bay/neon-bay-ocean-drive.svg", alt: "Neon Bay Ocean Drive promotional game visual" },
        { src: "/assets/images/projects/neon-bay/neon-bay-driving-physics.svg", alt: "Neon Bay driving physics promotional visual" },
        { src: "/assets/images/projects/neon-bay/neon-bay-shotgun-combat.svg", alt: "Neon Bay shotgun combat promotional visual" }
      ],
      badge: "PLAYABLE 3D WEB GAME",
      links: [
        { href: "https://neon-bay-gamma.vercel.app/", label: "Play live ↗", external: true },
        { href: "https://github.com/AzizulHakim00/Neon-Bay", label: "GitHub repository ↗", external: true }
      ]
    });
    cardByTitle("BusBD Intelligence")?.insertAdjacentElement("afterend", neonCard);
  }

  const foodCard = cardByTitle("FoodMoboChain");
  if (foodCard) {
    foodCard.querySelector(".project-type").textContent = "ANDROID · FIREBASE · SECURE MARKETPLACE";
    foodCard.querySelector("h3").textContent = "FoodMoboChain Firebase";
    const description = foodCard.querySelector(".project-body > p:not(.project-type)");
    if (description) description.textContent = "A Java/XML Android marketplace MVP with buyer, vendor, student and administrator roles, Firebase Authentication, Realtime Database, server-enforced Security Rules, protected ordering, rentals, reviews, moderation and App Check.";
    foodCard.querySelector("ul")?.replaceChildren(...["Android", "Java", "Firebase Auth", "Realtime DB", "Security Rules"].map((text) => Object.assign(document.createElement("li"), { textContent: text })));
    const links = foodCard.querySelector(".project-links");
    if (links) links.innerHTML = '<a href="https://github.com/AzizulHakim00/FoodMoboChain_Firebase" target="_blank" rel="noreferrer">GitHub repository ↗</a>';
    foodCard.querySelector("figure > span").textContent = "FIREBASE MARKETPLACE";
  }

  const iceCard = cardByTitle("ICE Penetration-Testing Lab");
  if (iceCard) {
    const dvwaCard = createProjectCard({
      category: "security",
      title: "DVWA Security Casebook",
      type: "CYBERSECURITY · WEB APPLICATION SECURITY",
      description: "An evidence-led, controlled DVWA penetration-testing casebook covering ten vulnerability modules, 25 payload and command records, 38 lab-evidence screenshots, security-level observations and developer-focused remediation guidance.",
      technologies: ["DVWA", "Burp Suite", "SQL Injection", "XSS", "CSRF", "Remediation"],
      images: [
        { src: "/assets/images/projects/dvwa-casebook/01-hero-terminal.svg", alt: "DVWA Security Casebook evidence-led assessment overview" },
        { src: "/assets/images/projects/dvwa-casebook/02-module-ledger.svg", alt: "DVWA Security Casebook vulnerability module ledger" }
      ],
      badge: "AUTHORIZED SECURITY CASEBOOK",
      links: [
        { href: "https://azizulhakim00.github.io/dvwa-security-casebook/", label: "Live casebook ↗", external: true },
        { href: "https://github.com/AzizulHakim00/dvwa-security-casebook", label: "GitHub repository ↗", external: true }
      ]
    });
    iceCard.replaceWith(dvwaCard);
  }

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
    "BusBD Intelligence": ["Passenger registration, profiles and multi-point journeys", "Persistent booking records and Redis-compatible seat locking", "Advanced seat layouts, passenger details and mock payment", "Signed QR verification, cancellations and refunds", "Deployed Spring Boot and React platform"],
    "Neon Bay": ["Five connected story missions", "Vehicle-specific speed, grip, steering and drift behavior", "Pistol and shotgun combat with tactical enemy states", "Police pursuit, weather, saving and mobile controls", "Tested Vite production deployment"],
    "Assignment Writer Hire": ["Student and administrator stakeholder workflows", "Requests, writer selection, orders and history", "Administration screens for users and writers", "JavaFX, FXML and MySQL architecture"],
    "Real Madrid Club Management": ["Players, matches, transfers and training management", "Formation editing and performance records", "FXML controllers and database persistence", "Six documented working screens"],
    "FoodMoboChain Firebase": ["Buyer, vendor, student and administrator roles", "Firebase Authentication and Realtime Database", "Server-enforced Security Rules and App Check", "Protected orders, rentals, reviews and moderation", "Spark-plan-compatible Android MVP"],
    "Bank Management": ["Administrator and client dashboards", "Accounts, deposits and transaction records", "Persistent SQLite data", "JavaFX coursework system"],
    "Firebase CRUD App": ["Firebase Authentication", "Realtime Database create, update and delete operations", "Restaurant, food and order screens", "Android learning project"],
    "Movie Management System": ["Collaborative coursework archive", "Desktop management and database direction", "Authorship presented honestly", "Full case study planned after verified evidence"],
    "Café Shop Management": ["Inventory and order-management direction", "JavaFX and FXML structure", "SQL-backed reporting scope", "Upcoming verified case study"],
    "Fruit Market": ["Product cards and storefront layout", "Selection and cart interactions", "Delivery-oriented visual components", "JavaFX, FXML and CSS interface"],
    "DVWA Security Casebook": ["Ten controlled-lab vulnerability modules", "Twenty-five payload and command records", "Thirty-eight indexed evidence screenshots", "Burp Suite and browser-based testing workflows", "Defensive recommendations for every module"]
  };

  const caseStudies = {
    "TaskFlow": "/projects/taskflow",
    "BusBD Intelligence": "/projects/busbd-intelligence",
    "Neon Bay": "/projects/neon-bay",
    "Assignment Writer Hire": "/projects/assignment-writer-hire",
    "Real Madrid Club Management": "/projects/real-madrid-management",
    "FoodMoboChain Firebase": "/projects/foodmobochain-firebase",
    "DVWA Security Casebook": "/projects/dvwa-security-casebook"
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