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

    const filterButtons = [...document.querySelectorAll("[data-filter]")];
    const projectCards = [...document.querySelectorAll(".project-card[data-category]")];
    filterButtons.forEach((button) => button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        filterButtons.forEach((item) => item.classList.toggle("active", item === button));
        projectCards.forEach((card) => {
            const visible = filter === "all" || card.dataset.category === filter;
            card.classList.toggle("hidden", !visible);
            if (visible) card.animate?.([
                { opacity: 0, transform: "translateY(12px)" },
                { opacity: 1, transform: "translateY(0)" }
            ], { duration: 340, easing: "ease-out" });
        });
    }));

    document.querySelectorAll("[data-gallery]").forEach((gallery, galleryIndex) => {
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
            }, 4800 + galleryIndex * 170);
        }
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
    const openEmail = (data) => {
        const subject = encodeURIComponent(data.subject);
        const body = encodeURIComponent(`From: ${data.name} <${data.email}>\n\n${data.message}`);
        window.location.href = `mailto:mdomor01815@gmail.com?subject=${subject}&body=${body}`;
    };
    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const fields = [...form.querySelectorAll("input, textarea")];
        fields.forEach((field) => field.setAttribute("aria-invalid", String(!field.checkValidity())));
        if (!form.checkValidity()) {
            formStatus.textContent = "Please complete every field with a valid email address.";
            formStatus.className = "error";
            form.querySelector(":invalid")?.focus();
            return;
        }
        const data = Object.fromEntries(new FormData(form).entries());
        formStatus.textContent = "Preparing your message…";
        formStatus.className = "";
        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error("Contact endpoint unavailable");
            const result = await response.json();
            formStatus.textContent = result.message;
            formStatus.className = "success";
        } catch {
            formStatus.textContent = "Opening your email app so the message can be sent directly.";
            formStatus.className = "success";
        }
        window.setTimeout(() => openEmail(data), 350);
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
