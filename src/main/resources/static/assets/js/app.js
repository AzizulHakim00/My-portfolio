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
        }, { threshold: .11, rootMargin: "0px 0px -40px" });
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
            let delay = deleting ? 38 : 64;
            if (!deleting && characterIndex === phrase.length) {
                deleting = true;
                delay = 1250;
            } else if (deleting && characterIndex === 0) {
                deleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                characterIndex = 1;
                delay = 120;
            }
            typedText.textContent = phrases[phraseIndex].slice(0, characterIndex);
            window.setTimeout(type, delay);
        };
        window.setTimeout(type, 1800);
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
                card.style.transform = `perspective(800px) rotateY(${x * 7}deg) rotateX(${y * -7}deg) translateY(-3px)`;
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
        const hero = canvas.closest(".hero");
        const intro = document.querySelector("#aho-intro");

        if (context && hero) {
            let particles = [];
            let width = 0;
            let height = 0;
            let frame = null;
            let previousTime = null;
            let visible = hero.getBoundingClientRect().bottom > 0;

            const resizeCanvas = () => {
                const ratio = Math.min(window.devicePixelRatio || 1, 2);
                const rect = canvas.getBoundingClientRect();
                if (rect.width === width && rect.height === height && canvas.width === Math.floor(width * ratio)) return;

                width = rect.width;
                height = rect.height;
                canvas.width = Math.floor(width * ratio);
                canvas.height = Math.floor(height * ratio);
                context.setTransform(ratio, 0, 0, ratio, 0, 0);
                const count = Math.min(72, Math.max(32, Math.floor(width / 20)));
                particles = Array.from({ length: count }, (_, index) => ({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - .5) * 17,
                    vy: (Math.random() - .5) * 15,
                    radius: .55 + Math.random() * 1.25,
                    phase: Math.random() * Math.PI * 2,
                    color: index % 8 === 0 ? "255, 154, 126" : "92, 230, 167"
                }));
            };

            const draw = (now) => {
                const dt = previousTime === null ? 0 : Math.min((now - previousTime) / 1000, .05);
                previousTime = now;
                const seconds = now / 1000;
                const reach = width < 600 ? 102 : 124;

                context.clearRect(0, 0, width, height);
                particles.forEach((particle) => {
                    const { x, y, vx, vy } = particle;
                    particle.x = Math.max(0, Math.min(width, x + vx * dt));
                    particle.y = Math.max(0, Math.min(height, y + vy * dt));
                    if ((particle.x === 0 && vx < 0) || (particle.x === width && vx > 0)) particle.vx *= -1;
                    if ((particle.y === 0 && vy < 0) || (particle.y === height && vy > 0)) particle.vy *= -1;
                });

                particles.forEach((particle, index) => {
                    let carriedSignal = false;
                    for (let next = index + 1; next < particles.length; next += 1) {
                        const other = particles[next];
                        const dx = other.x - particle.x;
                        const dy = other.y - particle.y;
                        const distanceSquared = dx * dx + dy * dy;
                        if (distanceSquared >= reach * reach) continue;

                        const connection = 1 - Math.sqrt(distanceSquared) / reach;
                        context.beginPath();
                        context.moveTo(particle.x, particle.y);
                        context.lineTo(other.x, other.y);
                        context.lineWidth = .8;
                        context.strokeStyle = `rgba(75, 198, 139, ${connection * .22})`;
                        context.stroke();

                        if (index % 11 === 0 && !carriedSignal && connection > .3) {
                            const phase = (seconds * .22 + index * .037) % 1;
                            carriedSignal = true;
                            context.beginPath();
                            context.arc(particle.x + dx * phase, particle.y + dy * phase, 1.25, 0, Math.PI * 2);
                            context.fillStyle = `rgba(147, 255, 205, ${connection * Math.sin(phase * Math.PI) * .92})`;
                            context.fill();
                        }
                    }

                    const pulse = .53 + Math.sin(seconds * 1.22 + particle.phase) * .24;
                    context.beginPath();
                    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                    context.fillStyle = `rgba(${particle.color}, ${pulse})`;
                    context.fill();
                });
                frame = window.requestAnimationFrame(draw);
            };

            const syncMotion = () => {
                const shouldRun = visible && !document.hidden && !intro?.open;
                hero.classList.toggle("hero-motion-paused", !shouldRun);
                if (shouldRun && frame === null) {
                    previousTime = null;
                    frame = window.requestAnimationFrame(draw);
                } else if (!shouldRun && frame !== null) {
                    window.cancelAnimationFrame(frame);
                    frame = null;
                }
            };

            resizeCanvas();
            if ("ResizeObserver" in window) new ResizeObserver(resizeCanvas).observe(canvas);
            else window.addEventListener("resize", resizeCanvas, { passive: true });

            if ("IntersectionObserver" in window) {
                new IntersectionObserver(([entry]) => {
                    visible = entry.isIntersecting;
                    syncMotion();
                }).observe(hero);
            }
            if (intro) new MutationObserver(syncMotion).observe(intro, { attributes: true, attributeFilter: ["open"] });
            document.addEventListener("visibilitychange", syncMotion);
            syncMotion();
        }
    }
})();
