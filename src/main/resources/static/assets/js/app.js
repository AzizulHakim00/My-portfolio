(() => {
    "use strict";

    const root = document.documentElement;
    const header = document.querySelector(".site-header");
    const progress = document.querySelector(".scroll-progress span");
    const backToTop = document.querySelector(".back-to-top");
    const nav = document.querySelector(".site-nav");
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = [...document.querySelectorAll(".site-nav a")];
    const sections = [...document.querySelectorAll("main section[id]")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const closeMenu = () => {
        nav?.classList.remove("open");
        document.body.classList.remove("menu-open");
        menuToggle?.setAttribute("aria-expanded", "false");
        menuToggle?.setAttribute("aria-label", "Open menu");
    };

    menuToggle?.addEventListener("click", () => {
        const open = menuToggle.getAttribute("aria-expanded") !== "true";
        menuToggle.setAttribute("aria-expanded", String(open));
        menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        nav?.classList.toggle("open", open);
        document.body.classList.toggle("menu-open", open);
    });
    navLinks.forEach((link) => link.addEventListener("click", closeMenu));

    const updateScrollState = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (progress) progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
        header?.classList.toggle("scrolled", window.scrollY > 35);
        backToTop?.classList.toggle("visible", window.scrollY > 650);

        let current = "home";
        sections.forEach((section) => {
            if (window.scrollY >= section.offsetTop - 180) current = section.id;
        });
        navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${current}`));
    };
    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", () => { if (window.innerWidth > 900) closeMenu(); }, { passive: true });
    updateScrollState();

    window.addEventListener("pointermove", (event) => {
        root.style.setProperty("--mx", `${event.clientX}px`);
        root.style.setProperty("--my", `${event.clientY}px`);
    }, { passive: true });

    if ("IntersectionObserver" in window && !reducedMotion) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: .08, rootMargin: "0px 0px -14px" });
        root.classList.add("motion-ready");
        document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
    } else {
        document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
    }

    const typedText = document.querySelector("#typing-text");
    const phrases = [
        "explainable AI systems",
        "reliable ML experiments",
        "secure software systems",
        "penetration-testing labs",
        "agentic and IoT workflows",
        "microwave sensing research"
    ];
    if (typedText && !reducedMotion) {
        let phraseIndex = 0;
        let characterIndex = phrases[0].length;
        let deleting = true;
        const type = () => {
            const phrase = phrases[phraseIndex];
            characterIndex += deleting ? -1 : 1;
            typedText.textContent = phrase.slice(0, characterIndex);
            let delay = deleting ? 38 : 64;
            if (!deleting && characterIndex === phrase.length) {
                deleting = true;
                delay = 1250;
            } else if (deleting && characterIndex === 0) {
                deleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                delay = 280;
            }
            window.setTimeout(type, delay);
        };
        window.setTimeout(type, 900);
    }

    const projectSection = document.querySelector("#projects");
    const projectCards = [...projectSection.querySelectorAll("[data-project-stage]")];
    const filters = [...projectSection.querySelectorAll("[data-filter]")];
    const additionalProjects = projectSection.querySelector("#additional-projects");
    const showMoreButton = projectSection.querySelector("#project-show-more");
    const projectStatus = projectSection.querySelector("#project-filter-status");
    const groups = [...projectSection.querySelectorAll("[data-project-grid]")];
    const countStage = (stage) => projectCards.filter((card) => card.dataset.projectStage === stage).length;
    const moreCount = countStage("more");
    let category = "all";
    let showMore = false;

    projectSection.querySelector("[data-project-total]").textContent = projectCards.length;
    projectSection.querySelector("[data-project-featured]").textContent = countStage("featured");
    projectSection.querySelector("[data-project-upcoming]").textContent = countStage("upcoming");

    const updateProjects = () => {
        const overview = category === "all";
        filters.forEach((button) => {
            const selected = button.dataset.filter === category;
            button.classList.toggle("active", selected);
            button.setAttribute("aria-pressed", String(selected));
        });

        projectCards.forEach((card) => {
            card.hidden = !overview && card.dataset.category !== category;
        });
        groups.forEach((grid) => {
            const hasResults = Boolean(grid.querySelector(".project-card:not([hidden])"));
            const heading = document.getElementById(grid.getAttribute("aria-labelledby"));
            grid.hidden = !hasResults || (grid === additionalProjects && overview && !showMore);
            if (heading) heading.hidden = grid.hidden;
        });

        showMoreButton.hidden = !overview || !moreCount;
        showMoreButton.setAttribute("aria-expanded", String(!additionalProjects.hidden));
        showMoreButton.textContent = showMore ? "Show fewer projects" : "Show " + moreCount + " more projects";
        projectStatus.hidden = overview || projectCards.some((card) => !card.hidden);
        projectStatus.textContent = projectStatus.hidden ? "" : "No projects match this category.";
    };

    filters.forEach((button) => button.addEventListener("click", () => {
        category = button.dataset.filter;
        updateProjects();
    }));
    showMoreButton.addEventListener("click", () => {
        showMore = !showMore;
        updateProjects();
    });

    document.querySelectorAll("[data-gallery]").forEach((gallery) => {
        const slides = [...gallery.querySelectorAll(":scope > img")];
        const counter = gallery.querySelector(".gallery-controls b");
        const previous = gallery.querySelector("[data-prev]");
        const next = gallery.querySelector("[data-next]");
        if (slides.length < 2) return;

        let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("active")));
        const show = (requestedIndex) => {
            activeIndex = (requestedIndex + slides.length) % slides.length;
            const slide = slides[activeIndex];
            if (slide.dataset.src && !slide.hasAttribute("src")) slide.src = slide.dataset.src;
            slides.forEach((slide, index) => {
                slide.classList.toggle("active", index === activeIndex);
                slide.setAttribute("aria-hidden", String(index !== activeIndex));
            });
            if (counter) counter.textContent = `${activeIndex + 1} / ${slides.length}`;
        };
        previous?.addEventListener("click", () => show(activeIndex - 1));
        next?.addEventListener("click", () => show(activeIndex + 1));
        show(activeIndex);
    });

    const papers = [...document.querySelectorAll("[data-paper-status]")];
    document.querySelectorAll("[data-paper-count]").forEach((count) => {
        const status = count.dataset.paperCount;
        count.textContent = status === "all" ? papers.length : papers.filter((paper) => paper.dataset.paperStatus === status).length;
    });

    if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
        document.querySelectorAll(".tilt-card").forEach((card) => {
            card.addEventListener("pointermove", (event) => {
                const rect = card.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width - .5;
                const y = (event.clientY - rect.top) / rect.height - .5;
                card.style.transform = `perspective(800px) rotateY(${x * 3}deg) rotateX(${y * -3}deg) translateY(-1px)`;
            });
            card.addEventListener("pointerleave", () => { card.style.transform = ""; });
        });

        document.querySelectorAll(".magnetic").forEach((button) => {
            button.addEventListener("pointermove", (event) => {
                const rect = button.getBoundingClientRect();
                const x = (event.clientX - rect.left - rect.width / 2) * .08;
                const y = (event.clientY - rect.top - rect.height / 2) * .08;
                button.style.transform = `translate(${x}px, ${y}px)`;
            });
            button.addEventListener("pointerleave", () => { button.style.transform = ""; });
        });
    }

    const lightbox = document.querySelector("#lightbox");
    const lightboxImage = lightbox?.querySelector("img");
    document.querySelectorAll("[data-lightbox]").forEach((button) => button.addEventListener("click", () => {
        if (!lightbox || !lightboxImage) return;
        lightboxImage.src = button.dataset.lightbox;
        if (typeof lightbox.showModal === "function") lightbox.showModal();
    }));
    lightbox?.querySelector("button")?.addEventListener("click", () => lightbox.close());
    lightbox?.addEventListener("click", (event) => { if (event.target === lightbox) lightbox.close(); });

    const form = document.querySelector("#contact-form");
    const formStatus = document.querySelector("#form-status");
    const contactParams = new URLSearchParams(window.location.search);
    if (formStatus && contactParams.get("contact") === "sent") {
        formStatus.textContent = "Message sent successfully. Thank you—I will reply by email.";
        formStatus.className = "success";
        contactParams.delete("contact");
        const cleanQuery = contactParams.toString();
        window.history.replaceState({}, "", `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}#contact`);
    }

    form?.addEventListener("submit", (event) => {
        const fields = [...form.querySelectorAll("input, textarea")];
        fields.forEach((field) => field.setAttribute("aria-invalid", String(!field.checkValidity())));
        if (!form.checkValidity()) {
            event.preventDefault();
            formStatus.textContent = "Please complete every field with a valid email address.";
            formStatus.className = "error";
            form.querySelector(":invalid")?.focus();
            return;
        }
        const data = Object.fromEntries(new FormData(form).entries());
        if (data._honey) {
            event.preventDefault();
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const subjectField = form.querySelector('[name="_subject"]');
        const nextField = form.querySelector('[name="_next"]');
        if (subjectField) subjectField.value = `Portfolio message: ${data.subject}`;
        if (nextField) {
            const returnUrl = new URL(window.location.href);
            returnUrl.searchParams.set("contact", "sent");
            returnUrl.hash = "contact";
            nextField.value = returnUrl.toString();
        }

        formStatus.textContent = "Sending your message…";
        formStatus.className = "";
        submitButton?.setAttribute("disabled", "");
    });
    form?.querySelectorAll("input, textarea").forEach((field) => field.addEventListener("input", () => field.removeAttribute("aria-invalid")));

    const year = document.querySelector("#year");
    if (year) year.textContent = String(new Date().getFullYear());

    const canvas = document.querySelector("#signal-canvas");
    if (canvas instanceof HTMLCanvasElement && !reducedMotion) {
        const context = canvas.getContext("2d");
        let particles = [];
        let frame = 0;
        const resizeCanvas = () => {
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            const rect = canvas.getBoundingClientRect();
            canvas.width = Math.floor(rect.width * ratio);
            canvas.height = Math.floor(rect.height * ratio);
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            const count = Math.min(70, Math.max(28, Math.floor(rect.width / 22)));
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * rect.width,
                y: Math.random() * rect.height,
                vx: (Math.random() - .5) * .28,
                vy: (Math.random() - .5) * .28,
                r: Math.random() * 1.5 + .6
            }));
        };
        const draw = () => {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            context.clearRect(0, 0, width, height);
            particles.forEach((particle, index) => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                if (particle.x < 0 || particle.x > width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > height) particle.vy *= -1;
                context.beginPath();
                context.fillStyle = index % 8 === 0 ? "rgba(255,127,92,.8)" : "rgba(32,200,196,.68)";
                context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
                context.fill();
                for (let next = index + 1; next < particles.length; next += 1) {
                    const other = particles[next];
                    const dx = particle.x - other.x;
                    const dy = particle.y - other.y;
                    const distance = Math.hypot(dx, dy);
                    if (distance < 118) {
                        context.beginPath();
                        context.strokeStyle = `rgba(66,188,190,${(1 - distance / 118) * .18})`;
                        context.lineWidth = .8;
                        context.moveTo(particle.x, particle.y);
                        context.lineTo(other.x, other.y);
                        context.stroke();
                    }
                }
            });
            frame = window.requestAnimationFrame(draw);
        };
        resizeCanvas();
        draw();
        window.addEventListener("resize", resizeCanvas, { passive: true });
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) window.cancelAnimationFrame(frame);
            else draw();
        });
    }

})();
