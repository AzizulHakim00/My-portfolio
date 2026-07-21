(() => {
    "use strict";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const body = document.body;

    const addMeta = (selector, attributes) => {
        let element = document.head.querySelector(selector);
        if (!element) {
            element = document.createElement(attributes.tag || "meta");
            document.head.appendChild(element);
        }
        Object.entries(attributes).forEach(([key, value]) => {
            if (key !== "tag") element.setAttribute(key, value);
        });
        return element;
    };

    const origin = window.location.origin;
    const pageUrl = `${origin}${window.location.pathname}`;
    const previewUrl = `${origin}/assets/images/portrait.jpg`;
    addMeta('link[rel="canonical"]', { tag: "link", rel: "canonical", href: pageUrl });
    addMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    addMeta('meta[property="og:title"]', { property: "og:title", content: "Azizul Hakim Omor | AI Research & Software Portfolio" });
    addMeta('meta[property="og:description"]', { property: "og:description", content: "CSE student working across explainable AI, cybersecurity, IoT, RF sensing and software systems." });
    addMeta('meta[property="og:url"]', { property: "og:url", content: pageUrl });
    addMeta('meta[property="og:image"]', { property: "og:image", content: previewUrl });
    addMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });

    body.classList.add("motion-upgrade-ready");
    requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add("motion-upgrade-play")));

    const headingObserver = "IntersectionObserver" in window
        ? new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("heading-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: .2 })
        : null;

    document.querySelectorAll(".section-heading").forEach((heading) => {
        if (headingObserver && !reducedMotion) headingObserver.observe(heading);
        else heading.classList.add("heading-visible");
    });

    const updateHeadingProgress = () => {
        const viewport = window.innerHeight;
        document.querySelectorAll(".section-heading").forEach((heading) => {
            const rect = heading.getBoundingClientRect();
            const progress = Math.max(0, Math.min(1, (viewport - rect.top) / (viewport * .78)));
            heading.style.setProperty("--section-progress", progress.toFixed(3));
        });
    };
    window.addEventListener("scroll", updateHeadingProgress, { passive: true });
    updateHeadingProgress();

    const cards = [...document.querySelectorAll(".project-card")];
    cards.forEach((card, index) => {
        const figure = card.querySelector("figure");
        if (figure && !figure.querySelector(".project-number")) {
            const number = document.createElement("span");
            number.className = "project-number";
            number.textContent = String(index + 1).padStart(2, "0");
            figure.appendChild(number);
        }
        if (finePointer && !reducedMotion) {
            card.addEventListener("pointermove", (event) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
                card.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
                card.classList.add("spotlight-active");
            });
            card.addEventListener("pointerleave", () => card.classList.remove("spotlight-active"));
        }
    });

    const archiveNames = new Set([
        "Bank Management",
        "Firebase CRUD App",
        "Movie Management System",
        "Café Shop Management",
        "Fruit Market"
    ]);
    const projectGrid = document.querySelector(".projects-grid");
    const archiveCards = cards.filter((card) => archiveNames.has(card.querySelector(".project-body h3")?.textContent.trim()));
    archiveCards.forEach((card) => card.classList.add("portfolio-archive-card"));

    if (projectGrid && archiveCards.length) {
        const wrap = document.createElement("div");
        wrap.className = "archive-toggle-wrap";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "archive-toggle";
        button.setAttribute("aria-expanded", "false");
        button.textContent = `Show project archive (${archiveCards.length})`;
        button.addEventListener("click", () => {
            const open = !projectGrid.classList.contains("archive-open");
            projectGrid.classList.toggle("archive-open", open);
            button.setAttribute("aria-expanded", String(open));
            button.textContent = open ? "Hide project archive" : `Show project archive (${archiveCards.length})`;
        });
        wrap.appendChild(button);
        projectGrid.insertAdjacentElement("afterend", wrap);
    }

    document.querySelectorAll(".research-feature-copy > p:not(.project-type), .primary-research-card > p:not(.project-type)").forEach((paragraph) => {
        if (paragraph.textContent.trim().length < 430) return;
        paragraph.classList.add("clamp-copy");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "copy-toggle";
        button.textContent = "Read full abstract";
        button.addEventListener("click", () => {
            const expanded = paragraph.classList.toggle("expanded");
            button.textContent = expanded ? "Show less" : "Read full abstract";
        });
        paragraph.insertAdjacentElement("afterend", button);
    });

    document.querySelectorAll(".certificate-card dl > div").forEach((row) => {
        const label = row.querySelector("dt")?.textContent.trim().toLowerCase();
        const value = row.querySelector("dd");
        if (label !== "issued" || !value || value.textContent.trim() !== "06 September 2026") return;
        value.textContent = "Pending date verification";
        const note = document.createElement("span");
        note.className = "date-verification-note";
        note.textContent = "Future-dated source hidden until confirmed";
        row.appendChild(note);
    });

    document.querySelectorAll("img").forEach((image, index) => {
        if (index > 1 && !image.hasAttribute("loading")) image.loading = "lazy";
        image.decoding = "async";
    });

    const filterBar = document.querySelector(".project-filters");
    filterBar?.addEventListener("click", (event) => {
        if (reducedMotion || !(event.target instanceof HTMLButtonElement)) return;
        const before = new Map(cards.filter((card) => !card.classList.contains("hidden")).map((card) => [card, card.getBoundingClientRect()]));
        requestAnimationFrame(() => requestAnimationFrame(() => {
            cards.filter((card) => !card.classList.contains("hidden") && before.has(card)).forEach((card) => {
                const oldRect = before.get(card);
                const newRect = card.getBoundingClientRect();
                const dx = oldRect.left - newRect.left;
                const dy = oldRect.top - newRect.top;
                if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
                card.animate([
                    { transform: `translate(${dx}px, ${dy}px)`, opacity: .72 },
                    { transform: "translate(0, 0)", opacity: 1 }
                ], { duration: 520, easing: "cubic-bezier(.16, 1, .3, 1)" });
            });
        }));
    }, true);
})();
