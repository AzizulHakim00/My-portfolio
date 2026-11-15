(() => {
    "use strict";

    const intro = document.querySelector("#aho-intro");
    const { hash, search } = window.location;
    if (!intro || typeof intro.showModal !== "function" || search || (hash && hash !== "#home") ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const storageKey = "aho-motion-intro-seen";
    try {
        if (window.sessionStorage.getItem(storageKey) === "1") return;
    } catch {
        // Playback is available without session storage.
    }

    const canvas = intro.querySelector("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width * .5;
    const cy = height * .49;
    const duration = 9.6;
    const storyboard = new Image();
    const emblem = new Image();

    const clamp = (value) => Math.max(0, Math.min(1, value));
    const ease = (value) => {
        const x = clamp(value);
        return x * x * (3 - 2 * x);
    };
    const progress = (time, from, to) => ease((time - from) / (to - from));
    const mix = (from, to, ratio) => from + (to - from) * ratio;
    const random = (seed) => {
        const number = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return number - Math.floor(number);
    };

    const scenes = [
        { frame: 0, start: 0, pan: -1 },
        { frame: 1, start: 1.05, pan: 1 },
        { frame: 3, start: 3.04, pan: -1 },
        { frame: 6, start: 5.18, pan: 1 },
        { frame: 1, start: 8.15, pan: -1 }
    ];
    const vignette = ctx.createRadialGradient(cx, cy, height * .13, cx, cy, width * .62);
    vignette.addColorStop(0, "rgba(0, 9, 13, .16)");
    vignette.addColorStop(.6, "rgba(0, 8, 13, .42)");
    vignette.addColorStop(1, "#010708");

    function backdrop(scene, time, opacity) {
        const drift = clamp((time - scene.start) / 3);
        const scale = 1.04 + drift * .11;
        const cropHeight = 232;
        const w = Math.max(width, height * 384 / cropHeight) * scale;
        const h = w * cropHeight / 384;
        ctx.globalAlpha = opacity;
        ctx.drawImage(storyboard, 0, scene.frame * 342 + 26, 384, cropHeight,
            (width - w) * .5 + drift * scene.pan * 17, (height - h) * .5 - drift * 9, w, h);
        ctx.globalAlpha = 1;
    }

    function drawBackdrop(time) {
        let sceneIndex = 0;
        while (sceneIndex < scenes.length - 1 && time >= scenes[sceneIndex + 1].start) sceneIndex++;
        const scene = scenes[sceneIndex];
        const dissolve = progress(time, scene.start, scene.start + .52);
        ctx.fillStyle = "#02070a";
        ctx.fillRect(0, 0, width, height);
        if (sceneIndex > 0 && dissolve < 1) backdrop(scenes[sceneIndex - 1], time, 1);
        backdrop(scene, time, sceneIndex ? dissolve : 1);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
    }

    function glow(x, y, radius, color, opacity) {
        if (opacity <= 0) return;
        const light = ctx.createRadialGradient(x, y, 0, x, y, radius);
        light.addColorStop(0, color);
        light.addColorStop(1, "transparent");
        ctx.globalAlpha = opacity;
        ctx.fillStyle = light;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        ctx.globalAlpha = 1;
    }

    function lightning(time) {
        const pulse = Math.max(0, 1 - Math.abs(time - .42) / .20, 1 - Math.abs(time - .94) / .16);
        if (!pulse) return;
        glow(width * .25, height * .15, width * .48, "#4badff", pulse * .34);
        ctx.save();
        ctx.globalAlpha = pulse * .78;
        ctx.strokeStyle = "#a6dfff";
        ctx.shadowColor = "#39aaff";
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(width * .39, 0);
        for (let i = 1; i <= 9; i++) {
            ctx.lineTo(width * (.39 - i * .012) + (random(i + 9) - .5) * 78, i * height * .057);
        }
        ctx.stroke();
        ctx.restore();
    }

    function portal(time, strength) {
        if (strength <= 0) return;
        const radius = height * (.29 + Math.sin(time * 2.6) * .007);
        glow(cx, cy, radius * 1.65, "#12a76a", strength * .28);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * .52);
        ctx.globalAlpha = strength * .8;
        ctx.strokeStyle = "#46fac2";
        ctx.shadowColor = "#00eb8b";
        ctx.shadowBlur = 12;
        ctx.lineWidth = 1.7;
        ctx.setLineDash([28, 13, 5, 21]);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.rotate(-time * .92);
        ctx.setLineDash([]);
        ctx.globalAlpha = strength * .48;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.13, i * Math.PI / 2, i * Math.PI / 2 + .53);
            ctx.stroke();
        }
        ctx.restore();
    }

    const columns = 5;
    const rows = 5;
    const grid = Array.from({ length: (columns + 1) * (rows + 1) }, (_, i) => {
        const x = i % (columns + 1);
        const y = Math.floor(i / (columns + 1));
        return [
            (x + (x > 0 && x < columns ? (random(i) - .5) * .67 : 0)) / columns - .5,
            (y + (y > 0 && y < rows ? (random(i + 55) - .5) * .67 : 0)) / rows - .5
        ];
    });
    const shards = Array.from({ length: columns * rows }, (_, i) => {
        const top = Math.floor(i / columns) * (columns + 1) + i % columns;
        const bottom = top + columns + 1;
        return [[grid[top], grid[top + 1], grid[bottom]], [grid[top + 1], grid[bottom + 1], grid[bottom]]];
    }).flat().map((points, i) => ({
        points,
        x: points.reduce((sum, point) => sum + point[0], 0) / 3,
        y: points.reduce((sum, point) => sum + point[1], 0) / 3,
        spin: (random(i + 75) - .5) * 7,
        reach: .7 + random(i + 119) * .72
    }));

    function drawEmblem(time) {
        const forge = progress(time, 1.18, 2.77);
        const scatter = progress(time, 3.89, 4.99);
        const returnHome = progress(time, 5.9, 8.1);
        const spread = scatter * (1 - returnHome);
        const size = height * (.55 + .12 * forge + .035 * returnHome);
        const opacity = forge * (1 - spread * .16);
        if (opacity <= 0) return;

        const recoil = Math.sin(progress(time, 3.65, 4.03) * Math.PI) * 19;
        ctx.save();
        ctx.translate(cx - recoil, cy);
        ctx.globalAlpha = opacity;

        if (spread < .003) {
            ctx.drawImage(emblem, -size / 2, -size / 2, size, size);
        } else {
            const swirl = Math.sin(returnHome * Math.PI) * .68;
            shards.forEach(({ points, x, y, spin, reach }) => {
                const angle = Math.atan2(y, x) + swirl;
                const distance = spread * (125 + Math.hypot(x, y) * 350) * reach;
                ctx.save();
                ctx.translate(x * size + Math.cos(angle) * distance, y * size + Math.sin(angle) * distance);
                ctx.rotate(spin * spread);
                ctx.beginPath();
                points.forEach(([px, py], i) => {
                    if (!i) ctx.moveTo((px - x) * size, (py - y) * size);
                    else ctx.lineTo((px - x) * size, (py - y) * size);
                });
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(emblem, (-.5 - x) * size, (-.5 - y) * size, size, size);
                ctx.restore();
            });
        }
        ctx.restore();
    }

    function beam(time) {
        if (time < 3.32 || time > 4.2) return;
        const sweep = clamp((time - 3.32) / .64);
        const fade = 1 - progress(time, 3.92, 4.2);
        const startX = width * .94;
        const startY = height * .32;
        const x = mix(startX, -40, sweep);
        const y = mix(startY, height * .66, sweep);
        if (time < 3.92) glow(x, y, 84, "#ff423d", fade * .44);
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.lineCap = "round";
        ctx.shadowColor = "#ff142e";
        ctx.shadowBlur = 25;
        ctx.strokeStyle = "#ff3847";
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.shadowBlur = 8;
        ctx.strokeStyle = "#fff0d9";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }

    const embers = Array.from({ length: 58 }, (_, i) => ({
        angle: random(i + 320) * Math.PI * 2,
        speed: 24 + random(i + 405) * 68,
        phase: random(i + 170),
        size: 1.1 + random(i + 256) * 2.1
    }));

    function drawEmbers(time) {
        const burst = clamp((time - 3.78) / .88);
        const rewind = progress(time, 5.88, 8.13);
        embers.forEach(({ angle, speed, phase, size }) => {
            const life = (phase + time * .14) % 1;
            const isSpark = time > 3.78 && time < 4.84;
            const isReturning = time > 5.88 && time < 8.13;
            const path = isSpark ? burst : isReturning ? 1 - rewind : life;
            const distance = 20 + (70 + speed * 3.3) * path;
            const direction = angle + (isReturning ? rewind * 1.6 : time * .28);
            const x = cx + Math.cos(direction) * distance;
            const y = cy + Math.sin(direction) * distance * .72;
            const angleOffset = isSpark ? 1 : isReturning ? .9 : Math.sin(life * Math.PI) * .45;
            ctx.globalAlpha = angleOffset * (isSpark ? 1 - burst * .64 : 1);
            ctx.fillStyle = isSpark ? "#ff8e51" : "#5effcf";
            ctx.fillRect(x, y, size * (isSpark ? 2.2 : 1), size);
        });
        ctx.globalAlpha = 1;
    }

    function draw(time) {
        drawBackdrop(time);
        lightning(time);
        const charge = progress(time, .9, 2.3) * (1 - progress(time, 3.8, 4.45));
        const rebuild = progress(time, 5.6, 8.22);
        portal(time, charge * .89 + rebuild * .83);
        drawEmblem(time);
        beam(time);
        const hit = Math.max(0, 1 - Math.abs(time - 3.64) / .22);
        const reform = Math.max(0, 1 - Math.abs(time - 8.12) / .38);
        glow(cx, cy, height * .67, "#ff5243", hit * .46);
        glow(cx, cy, height * .74, "#74ffcb", reform * .39);
        drawEmbers(time);
    }

    let request;
    let timer;
    let startedAt;

    function dismiss() {
        if (!intro.open || intro.classList.contains("is-leaving")) return;
        window.cancelAnimationFrame(request);
        window.clearTimeout(timer);
        try {
            window.sessionStorage.setItem(storageKey, "1");
        } catch {
            // Closing the intro does not require storage.
        }
        intro.classList.add("is-leaving");
        window.setTimeout(() => {
            intro.close();
            document.body.classList.remove("aho-intro-open");
        }, 480);
    }

    function tick(now) {
        startedAt ??= now;
        const elapsed = (now - startedAt) / 1000;
        draw(Math.min(duration, elapsed));
        if (elapsed < duration) request = window.requestAnimationFrame(tick);
        else timer = window.setTimeout(dismiss, 640);
    }

    intro.querySelectorAll("[data-aho-intro-enter]").forEach((button) => button.addEventListener("click", dismiss));
    intro.addEventListener("cancel", (event) => {
        event.preventDefault();
        dismiss();
    });
    document.body.classList.add("aho-intro-open");
    intro.showModal();
    timer = window.setTimeout(dismiss, 4500);
    storyboard.src = canvas.dataset.storyboard;
    emblem.src = canvas.dataset.emblem;
    Promise.all([storyboard.decode(), emblem.decode()]).then(() => {
        if (!intro.open || intro.classList.contains("is-leaving")) return;
        window.clearTimeout(timer);
        draw(0);
        intro.classList.add("is-playing");
        request = window.requestAnimationFrame(tick);
    }, dismiss);
})();
