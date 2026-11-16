(() => {
    "use strict";

    const intro = document.querySelector("#aho-intro");
    const stage = intro?.querySelector("canvas");
    const enter = intro?.querySelector(".aho-intro-enter");
    const skip = intro?.querySelector(".aho-intro-skip");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const { pathname, search, hash } = window.location;

    if (!stage || !enter || !skip || typeof intro.showModal !== "function" ||
        motion.matches || document.hidden || pathname !== "/" || search ||
        (hash && hash !== "#home")) return;

    const sessionKey = "aho-web-intro-seen";
    try {
        if (sessionStorage.getItem(sessionKey)) return;
    } catch {
        // Some browsing modes disable session storage.
    }

    const ctx = stage.getContext("2d");
    const art = intro.querySelector(".aho-intro-art");
    const scriptUrl = document.currentScript?.src;
    if (!ctx || !art || !scriptUrl || typeof Path2D !== "function") return;

    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    const duration = 11.4;
    const fadeAt = 10.85;
    const logoWidth = 416;
    const logoHeight = 196;
    const logoX = -logoWidth / 2;
    const logoY = -107;
    const tau = Math.PI * 2;
    const clamp = (n) => Math.min(1, Math.max(0, n));
    const mix = (a, b, n) => a + (b - a) * n;
    const progress = (t, a, b) => clamp((t - a) / (b - a));
    const smooth = (t, a, b) => {
        const x = progress(t, a, b);
        return x * x * (3 - 2 * x);
    };
    const pulse = (t, peak, radius) => 1 - smooth(Math.abs(t - peak), 0, radius);

    let seed = 271828;
    const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
    };

    let frame = 0;
    let deadline = 0;
    let startedAt = 0;
    let width = 1;
    let height = 1;
    let scale = 1;
    let centerY = 0;
    let scene;

    function buildScene() {
        const logo = document.createElement("canvas");
        logo.width = logoWidth * 2;
        logo.height = logoHeight * 2;
        const plate = logo.getContext("2d", { willReadFrequently: true });
        plate.scale(2, 2);
        plate.transform(1, 0, -0.19, 1, 27, 0);

        const letters = new Path2D(
            "M16 162 80 34H114L148 162H119L111 133H62L47 162ZM75 106H104L93 63Z " +
            "M159 34H189V84H237V34H267V162H237V110H189V162H159Z " +
            "M300 34H370L389 48 397 68V128L384 150 365 162H300L281 147 274 128V68L282 48Z " +
            "M307 61 303 70V123L310 135H360L368 125V72L360 61Z"
        );
        const metal = plate.createLinearGradient(88, 27, 129, 166);
        [
            [0, "#effffb"], [0.15, "#839d9b"], [0.23, "#ecf9f2"], [0.43, "#6c8882"],
            [0.52, "#2c4944"], [0.65, "#748f85"], [0.79, "#c0d2c7"], [1, "#41665d"]
        ].forEach(([stop, color]) => metal.addColorStop(stop, color));
        plate.fillStyle = metal;
        plate.fill(letters, "evenodd");
        plate.save();
        plate.clip(letters, "evenodd");
        for (let i = 0; i < 1800; i++) {
            const x = random() * 408;
            const y = 30 + random() * 136;
            const bright = random() > 0.42;
            plate.fillStyle = bright ? "rgba(236,255,250,.2)" : "rgba(5,18,17,.26)";
            plate.fillRect(x, y, 0.25 + random() * 5, 0.25 + random() * 1.2);
        }
        for (let i = 0; i < 52; i++) {
            const x = random() * 402;
            const y = 36 + random() * 125;
            const length = 4 + random() * 24;
            plate.beginPath();
            plate.moveTo(x, y);
            plate.lineTo(x + length * 0.43, y + 2);
            plate.lineTo(x + length, y - length * 0.27);
            plate.strokeStyle = i % 3 === 0 ? "#d3ffe3a0" : "#142e2aba";
            plate.lineWidth = 0.7;
            plate.stroke();
        }
        plate.restore();
        plate.strokeStyle = "#d6fbebba";
        plate.lineWidth = 0.95;
        plate.stroke(letters);
        plate.setTransform(1, 0, 0, 1, 0, 0);

        const pixels = plate.getImageData(0, 0, logo.width, logo.height).data;
        const shards = [];
        for (let y = 30; y < 166; y += 23) {
            for (let x = 5; x < 405; x += 23) {
                const span = 23;
                const upperLeft = pixels[((y + 4) * 2 * logo.width + (x + 5) * 2) * 4 + 3];
                const lowerRight = pixels[((y + 17) * 2 * logo.width + (x + 17) * 2) * 4 + 3];
                if (!upperLeft && !lowerRight) continue;

                const chip = document.createElement("canvas");
                chip.width = span * 2;
                chip.height = span * 2;
                const tile = chip.getContext("2d");
                tile.beginPath();
                tile.moveTo(1, 4 + random() * 15);
                tile.lineTo(chip.width - 6, 1);
                tile.lineTo(chip.width - 1, chip.height * (0.6 + random() * 0.4));
                tile.lineTo(4 + random() * 14, chip.height - 1);
                tile.closePath();
                tile.clip();
                tile.drawImage(logo, -x * 2, -y * 2);
                tile.globalCompositeOperation = "source-atop";
                tile.strokeStyle = "#d2ffec96";
                tile.lineWidth = 2;
                tile.stroke();

                const originX = logoX + x + span / 2;
                const originY = logoY + y + span / 2;
                shards.push({
                    chip, span, x: originX, y: originY,
                    launch: 3.50 + progress(originX, -210, 210) * 0.85,
                    vx: originX * (0.65 + random()) + (random() - 0.5) * 250,
                    vy: (random() - 0.5) * 480,
                    spin: (random() - 0.5) * 8
                });
            }
        }

        const motes = Array.from({ length: 90 }, () => ({
            angle: random() * tau,
            distance: 0.2 + random() * 1.5,
            speed: 0.08 + random() * 0.44,
            size: 0.55 + random() * 1.8,
            phase: random() * tau
        }));
        return { logo, shards, motes };
    }

    function resize() {
        const bounds = intro.getBoundingClientRect();
        width = Math.max(1, bounds.width);
        height = Math.max(1, bounds.height);
        const resolution = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3500000 / (width * height)));
        stage.width = Math.round(width * resolution);
        stage.height = Math.round(height * resolution);
        scale = Math.min(width / 600, height / 495, 1.65);
        centerY = height * (width < height ? 0.49 : 0.50);
    }

    function glow(x, y, rx, ry, inner, alpha) {
        if (alpha <= 0) return;
        const light = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        light.addColorStop(0, inner);
        light.addColorStop(1, "transparent");
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(rx, ry);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = light;
        ctx.fillRect(-1, -1, 2, 2);
        ctx.restore();
    }

    function bolt(x1, y1, x2, y2, roughness, salt, color, alpha, weight) {
        if (alpha <= 0) return;
        const balance = Math.hypot(x2 - x1, y2 - y1) || 1;
        const normalX = (y1 - y2) / balance;
        const normalY = (x2 - x1) / balance;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        for (let i = 1; i < 12; i++) {
            const u = i / 12;
            const jag = Math.sin(i * 9.87 + salt) * roughness * Math.sin(u * Math.PI);
            ctx.lineTo(mix(x1, x2, u) + jag * normalX, mix(y1, y2, u) + jag * normalY);
        }
        ctx.lineTo(x2, y2);
        ctx.save();
        ctx.globalAlpha = alpha * 0.32;
        ctx.strokeStyle = color;
        ctx.lineWidth = weight * 6;
        ctx.stroke();
        ctx.globalAlpha = alpha;
        ctx.lineWidth = weight;
        ctx.strokeStyle = "#d7ffee";
        ctx.stroke();
        ctx.restore();
    }

    function portal(t, strength, surge) {
        if (strength <= 0) return;
        glow(0, 100, 290, 100, "#15bb82", strength * (0.2 + surge * 0.32));
        ctx.save();
        ctx.globalAlpha = strength;
        for (let i = 0; i < 4; i++) {
            const start = i * 1.65 + t * (i % 2 ? -0.39 : 0.36);
            const swell = surge * (i + 1) * 3;
            ctx.beginPath();
            ctx.setLineDash(i === 3 ? [1.3, 6, 9, 12] : []);
            ctx.ellipse(0, 9, 161 + i * 21 + swell, 102 + i * 12 + swell,
                -0.16 + Math.sin(t + i) * 0.035, start, start + tau * (i === 1 ? 0.89 : 0.76));
            ctx.lineWidth = i === 0 ? 1.5 : 0.9;
            ctx.strokeStyle = i % 2 ? "#98ef4eb4" : "#34fab4a2";
            ctx.stroke();
        }
        ctx.restore();

        scene.motes.forEach((mote) => {
            const a = mote.angle + t * mote.speed;
            const r = mote.distance * (1 + surge * 0.28);
            const x = Math.cos(a) * 225 * r;
            const y = Math.sin(a) * 134 * r + 14;
            const flicker = Math.pow(0.5 + Math.sin(t * 3.4 + mote.phase) * 0.5, 2);
            ctx.globalAlpha = strength * flicker * 0.78;
            ctx.fillStyle = mote.size > 1.65 ? "#cbffe3" : "#55ecac";
            ctx.fillRect(x, y, mote.size, mote.size);
        });
        ctx.globalAlpha = 1;
    }

    function drawLogo(t, sweepX, beamY) {
        const reveal = smooth(t, 1.6, 2.55) * (1 - smooth(t, 4.1, 4.45));
        const restored = smooth(t, 7.5, 8.24);
        const opacity = Math.max(reveal, restored);
        if (opacity <= 0) return;

        ctx.save();
        ctx.globalAlpha = opacity;
        const lift = Math.sin(t * 2.1) * 3;
        ctx.translate(0, lift);
        if (t >= 3.50 && t < 4.45) {
            ctx.beginPath();
            ctx.rect(sweepX, -160, 500, 320);
            ctx.clip();
        }
        ctx.shadowColor = "#5bffd5a0";
        ctx.shadowBlur = 20 * scale;
        ctx.drawImage(scene.logo, logoX, logoY, logoWidth, logoHeight);
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = "screen";
        const sheen = pulse(t, 2.56, 0.8) + pulse(t, 8.23, 0.7);
        glow(45, beamY + 25, 185, 58, "#8cffe3", sheen * 0.48);
        ctx.restore();
    }

    function drawShards(t) {
        if (t < 3.50 || t >= 8.22) return;
        const pull = smooth(t, 6.10, 8.19);
        const vanish = 1 - smooth(t, 7.68, 8.22);
        scene.shards.forEach((shard) => {
            if (t < shard.launch) return;
            const travel = 1 - Math.exp(-(t - shard.launch) * 2.25);
            const offsetX = shard.vx * travel;
            const offsetY = shard.vy * travel + Math.sin(t * 2 + shard.spin) * 13 * travel;
            const turn = pull * 2.9;
            const radius = 1 - pull;
            const x = shard.x + radius * (offsetX * Math.cos(turn) - offsetY * Math.sin(turn));
            const y = shard.y + radius * (offsetX * Math.sin(turn) + offsetY * Math.cos(turn));
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(shard.spin * travel * radius + turn);
            ctx.scale(0.45 + Math.abs(Math.cos(travel * 3 + shard.spin + turn)) * 0.95, 1);
            ctx.globalAlpha = vanish * (0.62 + 0.38 * Math.abs(Math.sin(t * 2 + shard.spin)));
            ctx.drawImage(shard.chip, -shard.span / 2, -shard.span / 2, shard.span, shard.span);
            ctx.restore();
        });
    }

    function orbit(t, intensity) {
        if (intensity <= 0) return;
        ctx.save();
        ctx.rotate(-0.26);
        ctx.globalAlpha = intensity;
        const a = t * 1.35 % tau;
        const x = Math.cos(a) * 226;
        const y = Math.sin(a) * 78 + 23;
        const trail = ctx.createLinearGradient(-226, 20, 226, 20);
        trail.addColorStop(0, "#61ffda12");
        trail.addColorStop(0.30, "#a0ffe2");
        trail.addColorStop(1, "#6fffe900");
        ctx.beginPath();
        ctx.ellipse(0, 23, 226, 78, 0, a - 1.95, a);
        ctx.strokeStyle = trail;
        ctx.lineWidth = 3;
        ctx.shadowColor = "#6affda";
        ctx.shadowBlur = 15 * scale;
        ctx.stroke();
        glow(x, y, 25, 13, "#7fffe0", intensity * 0.72);
        ctx.fillStyle = "#ddfff6";
        ctx.beginPath();
        ctx.ellipse(x, y, 3.6, 2.2, 0, 0, tau);
        ctx.fill();
        ctx.restore();
    }

    function draw(t) {
        ctx.setTransform(stage.width / width, 0, 0, stage.height / height, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.translate(width / 2, centerY);
        ctx.scale(scale, scale);
        ctx.globalCompositeOperation = "screen";
        const edgeX = width / (2 * scale);
        const edgeY = centerY / scale;
        const spark = pulse(t, 0.96, 0.53);
        const surge = pulse(t, 7.2, 1.27);
        const ring = smooth(t, 0.7, 1.95);
        const drift = t * 0.14;
        glow(-92 + Math.sin(drift * 5) * 110, 109, 294, 53, "#66eace", 0.19 + surge * 0.25);
        glow(98 - Math.sin(drift * 4) * 130, 132, 229, 30, "#108c7b", 0.36);

        bolt(-edgeX * 0.83, -edgeY, -edgeX * 0.44, -42, 22, 1.7, "#68dfff",
            pulse(t, 0.34, 0.29) * 0.65 + pulse(t, 6.36, 0.22) * 0.42, 1.3);
        bolt(edgeX * 0.72, -edgeY, edgeX * 0.43, -56, 18, 2.9, "#79ffba",
            pulse(t, 0.60, 0.31) * 0.41 + pulse(t, 7.65, 0.36) * 0.54, 1.3);
        glow(0, 56, 43, edgeY * 1.15, "#72ff42", spark * 0.50);
        bolt(0, -edgeY - 6, 0, 138, 2, 1, "#9bff40", spark, 1.8);
        portal(t, ring * 0.82, surge);

        const hit = progress(t, 3.43, 4.39);
        const sweepX = mix(-261, 248, hit);
        const beamY = 14 + Math.sin(t * 20) * 1.6;
        ctx.globalCompositeOperation = "source-over";
        drawLogo(t, sweepX, beamY);
        drawShards(t);
        ctx.globalCompositeOperation = "screen";

        const beam = smooth(t, 3.42, 3.53) * (1 - smooth(t, 4.22, 4.64));
        if (beam > 0) {
            const red = ctx.createLinearGradient(0, beamY - 23, 0, beamY + 23);
            red.addColorStop(0, "#ff2c0000");
            red.addColorStop(0.46, "#ff3819");
            red.addColorStop(0.5, "#fff1d9");
            red.addColorStop(0.54, "#ff401f");
            red.addColorStop(1, "#ff2c0000");
            ctx.globalAlpha = beam;
            ctx.fillStyle = red;
            ctx.fillRect(-edgeX - 2, beamY - 23, Math.max(0, edgeX + sweepX + 2), 46);
            ctx.globalAlpha = 1;
            glow(sweepX, beamY, 76, 59, "#ff331c", beam * 0.82);
            glow(sweepX, beamY, 28, 19, "#fff0c0", beam);
        }

        if (surge > 0.01) {
            for (let i = 0; i < 7; i++) {
                const a = t * 1.25 + i / 7 * tau;
                bolt(Math.cos(a) * 202, Math.sin(a) * 88 + 30, 0, 24,
                    15 + surge * 25, i + Math.floor(t * 13), "#2cffa2",
                    surge * (0.34 + Math.sin(i + t * 7) ** 2 * 0.37), 1.1);
            }
            glow(0, 24, 153, 95, "#50ffad", surge * 0.73);
        }

        orbit(t, smooth(t, 2.18, 2.80) * (1 - smooth(t, 3.6, 4.45)) +
            smooth(t, 7.65, 8.35) * 0.95);
        ctx.globalCompositeOperation = "source-over";
    }

    function finish() {
        listeners.abort();
        window.clearTimeout(deadline);
        window.cancelAnimationFrame(frame);
        if (intro.open) intro.close();
    }

    function animate(now) {
        const t = (now - startedAt) / 1000;
        if (t >= duration) {
            finish();
            return;
        }
        if (t >= fadeAt && !intro.classList.contains("aho-intro-leaving")) {
            intro.classList.add("aho-intro-leaving");
        }
        if (t >= 8.40 && enter.hidden) enter.hidden = false;

        draw(t);
        frame = window.requestAnimationFrame(animate);
    }

    function begin() {
        if (listeners.signal.aborted || intro.open) return;
        try {
            scene = buildScene();
            intro.showModal();
            resize();
            draw(0);
        } catch {
            finish();
            return;
        }

        window.clearTimeout(deadline);
        try {
            sessionStorage.setItem(sessionKey, "1");
        } catch {
            // The animation remains available when storage is disabled.
        }

        window.addEventListener("resize", resize, options);
        deadline = window.setTimeout(finish, (duration + 0.35) * 1000);
        startedAt = performance.now();
        frame = window.requestAnimationFrame(animate);
    }

    skip.addEventListener("click", finish, options);
    enter.addEventListener("click", () => {
        finish();
        const main = document.querySelector("#main");
        main?.focus({ preventScroll: true });
    }, options);
    intro.addEventListener("cancel", (event) => {
        event.preventDefault();
        finish();
    }, options);
    motion.addEventListener("change", (event) => {
        if (event.matches) finish();
    }, options);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) finish();
    }, options);
    window.addEventListener("pagehide", finish, options);
    window.addEventListener("hashchange", finish, options);

    const cancelPendingIntro = () => {
        if (!intro.open) finish();
    };
    window.addEventListener("pointerdown", cancelPendingIntro, { ...options, capture: true });
    window.addEventListener("keydown", cancelPendingIntro, { ...options, capture: true });

    // Load one still only for visitors who will see the animation.
    art.addEventListener("load", begin, options);
    art.addEventListener("error", begin, options);
    deadline = window.setTimeout(begin, 1200);
    art.src = new URL("../images/aho-intro-ruins.webp", scriptUrl).href;
})();
