// Browser renderer for the AHO Optic Burn scene. The timeline uses the
// original 1280 × 720 coordinates, with separate atlases for the scene and logo shards.
const W = 1280;
const H = 720;
const TAU = 2 * Math.PI;
const DEG = Math.PI / 180;
const STORM_STRIKES = [0.36, 1.1, 1.86, 3.8, 5.43, 6.82, 7.9, 10.4];
const BEAM_START = 3.98;
const BEAM_TIME = 1.27;
const BEAM_X = 400;
const BEAM_DISTANCE = 445;
export const INTRO_LENGTH = 14.5;

const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (n) => {
    const q = clamp(n);
    return q * q * (3 - 2 * q);
};
const inOut = (t, a, b, c, d) => smooth((t - a) / (b - a)) * (1 - smooth((t - c) / (d - c)));
const peak = (t, at, span) => Math.max(0, 1 - Math.abs(t - at) / span);
const rgb = (r, g, b) => "rgb(" + r + "," + g + "," + b + ")";
const point = Math.trunc;

function beamTravel(t) {
    return BEAM_X + BEAM_DISTANCE * smooth((t - BEAM_START) / BEAM_TIME);
}

function beamHitAt(x) {
    const distance = clamp((x - BEAM_X) / BEAM_DISTANCE);
    // Invert smoothstep so the pieces break when the beam reaches them.
    return BEAM_START + BEAM_TIME * (0.5 - Math.sin(Math.asin(1 - 2 * distance) / 3));
}

function surface(width, height, options) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas.getContext("2d", options);
}

function createMist() {
    const ctx = surface(360, 118);
    for (let i = 0; i < 26; i++) {
        const x = 42 + i * 10.8;
        const y = 58 + 13 * Math.sin(i * 0.65) + 8 * Math.cos(i * 1.8);
        const radius = 24 + 13 * Math.sin(i * 2.03) ** 2;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1.45, 0.68 + 0.19 * Math.sin(i * 2.2));
        const air = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        air.addColorStop(0, "rgba(38,84,77,.19)");
        air.addColorStop(0.48, "rgba(22,61,60,.13)");
        air.addColorStop(1, "rgba(12,35,39,0)");
        ctx.fillStyle = air;
        ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
        ctx.restore();
    }
    return ctx.canvas;
}

function line(ctx, x0, y0, x1, y1, color, width = 1) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = width === 1 ? 1.24 : width;
    ctx.stroke();
}

function dot(ctx, x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, angle, end, color, width = 1) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, angle, end);
    ctx.strokeStyle = color;
    ctx.lineWidth = width === 1 ? 1.24 : width;
    ctx.stroke();
}

function loadImage(url) {
    const image = new Image();
    image.src = url;
    return image.decode().then(() => image);
}

const media = (name) => new URL("../images/" + name, import.meta.url);
export async function loadIntroScene(canvas, signal) {
    const [backdrop, atlas, logo, data] = await Promise.all([
        loadImage(media("aho-intro-storm-hd.webp")).catch(() => loadImage(media("aho-intro-storm.webp"))),
        loadImage(media("aho-intro-art.webp")),
        loadImage(media("aho-intro-logo-hd.webp")),
        fetch(media("aho-intro-scene.json?v=original-aho-1"), { signal }).then((response) => {
            if (!response.ok) throw new Error("Intro scene unavailable");
            return response.json();
        })
    ]);

    canvas.width = W;
    canvas.height = H;
    const scene = canvas.getContext("2d");
    if (!scene || !canvas.parentElement) throw new Error("Canvas unavailable");
    const camera = canvas.parentElement;
    backdrop.className = "aho-intro-art";
    backdrop.alt = "";
    backdrop.setAttribute("aria-hidden", "true");
    camera.prepend(backdrop);
    const glow = surface(1, 1);
    glow.canvas.className = "aho-intro-glow";
    camera.insertBefore(glow.canvas, canvas);
    const figureLayer = surface(data.figure[2], data.figure[3]);
    const [LW, LH] = data.logoSize;
    const LX = (W - LW) / 2;
    const LY = 352 - LH / 2;
    const metalLayer = surface(1, 1);
    const mist = createMist();
    const glowTextures = new Map();
    let view;

    function paintMetalLogo(ctx, x, y) {
        ctx.drawImage(logo, x, y, LW, LH);
    }

    function resize(ctx, width, height) {
        if (ctx.canvas.width !== width || ctx.canvas.height !== height) {
            ctx.canvas.width = width;
            ctx.canvas.height = height;
        }
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }

    function setViewport(cssWidth, cssHeight, deviceDensity, quality = 1) {
        const density = quality * Math.min(Math.max(deviceDensity || 1, 1.5), 3,
            3840 / Math.max(cssWidth, cssHeight),
            Math.sqrt(3840 * 2160 / (cssWidth * cssHeight)));
        const width = Math.max(1, Math.round(cssWidth * density));
        const height = Math.max(1, Math.round(cssHeight * density));
        const stageWidth = cssWidth < cssHeight ? 970 : W;
        const fit = Math.min(width / stageWidth, height / H);
        const x = (width - W * fit) / 2;
        const y = (height - H * fit) / 2;
        const glowScale = Math.min(1, 820 / Math.max(width, height));
        view = {
            width, height, fit, x, y, left: -x / fit, top: -y / fit, glowScale,
            cameraX: fit * cssWidth / width, cameraY: fit * cssHeight / height
        };

        resize(scene, width, height);
        resize(glow, Math.ceil(width * glowScale), Math.ceil(height * glowScale));
        resize(metalLayer, Math.max(1, Math.min(logo.naturalWidth, Math.round(LW * fit))),
            Math.max(1, Math.min(logo.naturalHeight, Math.round(LH * fit))));
        metalLayer.setTransform(metalLayer.canvas.width / LW, 0, 0, metalLayer.canvas.height / LH, 0, 0);
        metalLayer.imageSmoothingQuality = "high";
        scene.imageSmoothingQuality = "high";
        glow.canvas.style.setProperty("--intro-glow-blur", Math.max(3, 9 * view.cameraX) + "px");

        return {
            top: (y + 605 * fit) / height,
            width: 454 * fit / width,
            height: 68 * fit / height
        };
    }

    function project(ctx, scale = 1) {
        ctx.setTransform(view.fit * scale, 0, 0, view.fit * scale, view.x * scale, view.y * scale);
    }

    function sprite(ctx, source, x, y, width = source[2], height = source[3]) {
        ctx.drawImage(atlas, ...source, x, y, width, height);
    }

    function bloom(paint, power, core) {
        if (power > 0) {
            glow.save();
            glow.globalAlpha = power;
            paint(glow);
            glow.restore();
        }
        if (core > 0) {
            scene.save();
            scene.globalAlpha = core;
            scene.globalCompositeOperation = "lighter";
            paint(scene);
            scene.restore();
        }
    }

    function circleGlow(x, y, radius, color, power) {
        if (power <= 0) return;
        let texture = glowTextures.get(color);
        if (!texture) {
            const ctx = surface(96, 96);
            const gradient = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
            gradient.addColorStop(0, "rgba(" + color + ",1)");
            gradient.addColorStop(0.45, "rgba(" + color + ",.65)");
            gradient.addColorStop(0.75, "rgba(" + color + ",.19)");
            gradient.addColorStop(1, "rgba(" + color + ",0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 96, 96);
            texture = ctx.canvas;
            glowTextures.set(color, texture);
        }
        glow.save();
        glow.globalAlpha = power;
        glow.drawImage(texture, x - radius, y - radius, radius * 2, radius * 2);
        glow.restore();
    }

    function wash(color, alpha) {
        scene.save();
        scene.resetTransform();
        scene.fillStyle = color;
        scene.globalAlpha = alpha;
        scene.fillRect(0, 0, view.width, view.height);
        scene.restore();
    }

    function storm(t) {
        STORM_STRIKES.forEach((at, i) => {
            const amount = peak(t, at, 0.12);
            if (!amount) return;
            bloom((layer) => {
                layer.beginPath();
                data.storm[i].forEach(([x, y], j) => {
                    if (j === 0) layer.moveTo(x, Math.min(y, view.top - 4));
                    else layer.lineTo(x, y);
                });
                layer.strokeStyle = "rgb(210,241,244)";
                layer.lineWidth = 2;
                layer.stroke();
            }, amount * 0.65, amount * 0.7);
            wash("rgb(255,252,229)", amount * 0.08);
        });
    }

    function ambient(t) {
        const width = view.width / view.fit;
        const height = view.height / view.fit;
        data.stars.forEach(([x, y, velocity, shade, phase], i) => {
            const px = view.left + (x * width + 17 * Math.sin(t * 0.37 + phase * 6) + width) % width;
            const py = view.top + (y * height - (12 + 39 * velocity) * t + height * 5) % height;
            if (py > view.top + 80 && py < view.top + height - 30) {
                dot(scene, px, py, i % 7 ? 1 : 2, rgb(65, 140 + point(70 * shade), 50));
            }
        });
    }

    function portal(t) {
        const strength = smooth((t - 0.9) / 1.42);
        if (strength < 0.005) return;
        bloom((layer) => {
            for (let k = 0; k < 7; k++) {
                const rx = 197 + 17 * k + 2 * Math.sin(t * 1.5 + k);
                const ry = 157 + 15 * k;
                const angle = t * (0.65 + 0.13 * k) + k * 61 * DEG;
                ellipse(layer, 640, 354, rx, ry, angle, angle + 175 * DEG,
                    rgb(66, 154 + 12 * k, 30), k < 2 ? 2 : 1);
                for (let j = 0; j < 11; j++) {
                    const a = angle + j * TAU / 11;
                    dot(layer, 640 + rx * Math.cos(a), 354 + ry * Math.sin(a),
                        j % 5 === 0 ? 2 : 1, "rgb(123,235,88)");
                }
            }
        }, 0.52 * strength, 0.62 * strength);

        const beam = inOut(t, 1, 1.35, 2.17, 2.62);
        if (beam > 0.01) {
            const sky = Math.min(-50, view.top - 4);
            bloom((layer) => line(layer, 640, sky, 640, 535, "rgb(116,255,24)", 20), 0.8 * beam, 0);
            line(scene, 640, sky, 640, 535, "rgb(180,245,115)", Math.max(1, point(4 * beam)));
            circleGlow(640, 530, 180, "105,255,37", 0.35 * beam);
        }
        if (t > 1 && t < 3.4) {
            for (let j = 0; j < 10; j++) {
                const amount = 0.04 + Math.sin(t * 4 + j) ** 2 * 0.11;
                const x = 640 + Math.sin(j * 1.8 + t) * 18;
                const half = (40 + j * 16) * amount;
                line(scene, x - half, 514 + 17 * j, x + half, 514 + 17 * j,
                    rgb(54, 80 + point(110 * strength), 19));
            }
        }
    }

    function sorcerer(t) {
        const arrive = smooth((t - 5.93) / 2.01);
        const leave = smooth((t - 8.93) / 2.56);
        const amount = arrive * (1 - leave);
        if (amount <= 0.0005) return;

        const [,, textureWidth, textureHeight] = data.figure;
        const scale = 0.925 + 0.092 * arrive - 0.064 * leave;
        const w = textureWidth * scale;
        const h = textureHeight * scale;
        const x = 640 - w * 0.5 + 4 * Math.sin(t * 0.51);
        const y = 91 + 42 * (1 - arrive) + 39 * leave + 3 * Math.sin(t * 0.68);

        figureLayer.clearRect(0, 0, textureWidth, textureHeight);
        sprite(figureLayer, data.figure, 0, 0);
        const clearest = 0.10 + 0.76 * arrive - 0.36 * leave;
        const reveal = figureLayer.createLinearGradient(0, 0, 0, textureHeight);
        reveal.addColorStop(0, "rgba(255,255,255,.76)");
        reveal.addColorStop(clearest, "#fff");
        reveal.addColorStop(Math.min(1, clearest + 0.29), "#fff0");
        figureLayer.globalCompositeOperation = "destination-in";
        figureLayer.fillStyle = reveal;
        figureLayer.fillRect(0, 0, textureWidth, textureHeight);
        figureLayer.globalCompositeOperation = "source-over";

        scene.save();
        scene.globalAlpha = amount;
        scene.drawImage(figureLayer.canvas, x, y, w, h);
        scene.restore();

        const eyeLight = amount * smooth((t - 6.5) / 0.98) * (1 - smooth((t - 9.12) / 1.93));
        for (const eye of [547, 681]) {
            const ex = x + (eye - 640 + textureWidth / 2) * scale;
            const ey = y + (209 - 93) * scale;
            circleGlow(ex, ey, 29, "122,255,62", eyeLight * (0.15 + 0.035 * Math.sin(t * 3)));
        }

        const power = amount * smooth((t - 7.40) / 1.06);
        if (power <= 0.01) return;
        bloom((layer) => {
            const hands = [[450, 404], [820, 398]].map(([px, py]) =>
                [x + (px - 640 + textureWidth / 2) * scale, y + (py - 93) * scale]);
            hands.forEach(([cx, cy], i) => {
                for (let k = 0; k < 12; k++) {
                    const angle = t * (1.23 + 0.06 * k) + k * 0.67 + i * 2;
                    const rx = 22 + 10 * (k % 4) + 15 * Math.sin(t * 2.2 + k) ** 2;
                    line(layer, cx, cy, cx + rx * Math.cos(angle), cy + rx * 0.72 * Math.sin(angle),
                        "rgb(100,224,38)", k % 5 === 0 ? 2 : 1);
                }
            });
        }, 0.87 * power, 0.65 * power);
    }

    function drawMetal(t) {
        if (t < 1.7 || (t > 5.68 && t < 8.63)) return;

        const approach = smooth((t - 1.7) / 1.68);
        const lightning = STORM_STRIKES.reduce((power, at) => Math.max(power, peak(t, at, 0.17)), 0);
        const charge = inOut(t, 1.82, 2.43, 3.02, 3.55) + inOut(t, 8.95, 9.75, 11.18, 12.25);
        const dark = 0.24 + 0.29 * (1 - approach) - 0.11 * lightning;
        metalLayer.clearRect(0, 0, LW, LH);
        paintMetalLogo(metalLayer, 0, 0);
        metalLayer.globalCompositeOperation = "source-atop";

        const ambientShade = metalLayer.createLinearGradient(0, 0, LW * 0.32, LH);
        ambientShade.addColorStop(0, "rgba(4,30,37," + dark + ")");
        ambientShade.addColorStop(0.58, "rgba(5,25,33," + (dark + 0.08) + ")");
        ambientShade.addColorStop(1, "rgba(0,12,18," + (dark + 0.18) + ")");
        metalLayer.fillStyle = ambientShade;
        metalLayer.fillRect(0, 0, LW, LH);

        const rx = LW * (0.46 + 0.36 * Math.sin(t * 1.43));
        const reflectedLight = metalLayer.createRadialGradient(rx, LH * 0.26, 0, rx, LH * 0.26, LW * 0.72);
        reflectedLight.addColorStop(0, "rgba(138,244,188," + (0.07 + 0.18 * charge + 0.24 * lightning) + ")");
        reflectedLight.addColorStop(0.51, "rgba(44,166,139," + (0.045 + 0.08 * charge) + ")");
        reflectedLight.addColorStop(1, "rgba(40,118,114,0)");
        metalLayer.fillStyle = reflectedLight;
        metalLayer.fillRect(0, 0, LW, LH);

        const heat = inOut(t, 4.03, 4.36, 5.28, 5.68);
        if (heat > 0.001) {
            const hotX = beamTravel(t) - LX;
            const reflection = metalLayer.createLinearGradient(hotX - 59, 14, hotX + 44, LH * 0.12);
            reflection.addColorStop(0, "rgba(226,59,18,0)");
            reflection.addColorStop(0.52, "rgba(255,111,40," + (0.41 * heat) + ")");
            reflection.addColorStop(1, "rgba(255,114,61,0)");
            metalLayer.fillStyle = reflection;
            metalLayer.fillRect(0, 0, LW, LH);
        }

        if (t < 3.37 || (t >= 4.12 && t < 10.78)) {
            const coverage = metalLayer.createLinearGradient(0, 0, LW, 22);
            for (let i = 0; i <= 18; i++) {
                const column = i / 18;
                const reveal = smooth((t - 1.7 - column * 0.66) / 0.99);
                const breakage = 1 - smooth((t - beamHitAt(LX + LW * column)) / 0.39);
                const rebuild = smooth((t - 8.63 - (1 - column) * 0.59) / 1.56);
                coverage.addColorStop(column, "rgba(255,255,255," + reveal * Math.max(breakage, rebuild) + ")");
            }
            metalLayer.globalCompositeOperation = "destination-in";
            metalLayer.fillStyle = coverage;
            metalLayer.fillRect(0, 0, LW, LH);
        }
        metalLayer.globalCompositeOperation = "source-over";
        scene.drawImage(metalLayer.canvas, LX, LY, LW, LH);

        const glowStrength = charge * (t < 4 ? approach : 1) * 0.17;
        circleGlow(LX + LW * 0.55, LY + LH * 0.87, 121, "61,200,87", glowStrength);
    }

    function shards(t) {
        if (t > 4.15 && t < 10.85) {
            const returnHome = smooth((t - 7.96) / 2.82);
            const assembled = smooth((t - 8.63) / 2.15);
            const density = data.shardDensity;
            for (const [sx, sy, atlasX, atlasY, w, h, vx, vy, spin, delay, phase] of data.shards) {
                const hit = beamHitAt(LX + (sx + w / 2) / density) + delay * 0.075;
                const amount = smooth((t - hit) / 1.02) * (1 - returnHome);
                const opacity = smooth((t - hit) / 0.18) * (1 - assembled);
                if (opacity <= 0) continue;

                const width = w / density;
                const height = h / density;
                const x = LX + (sx + w / 2) / density + (vx + 19 * Math.sin(t * 1.8 + phase)) * amount;
                const y = LY + (sy + h / 2) / density + (vy + 11 * Math.cos(t * 1.4 + phase)) * amount;
                const depth = 1 + 0.25 * Math.cos(phase) * amount;
                const turn = 0.35 + 0.65 * Math.abs(Math.cos((phase + t * 1.8) * amount));

                scene.save();
                scene.translate(x, y);
                scene.rotate(-spin * amount * DEG);
                scene.scale(turn * depth, depth);
                scene.globalAlpha = opacity * (0.77 + 0.20 * Math.cos(phase + amount));
                scene.drawImage(atlas, atlasX, atlasY, w, h, -width / 2, -height / 2, width, height);
                scene.restore();
            }
        }
        if (t > 4 && t < 6.2) {
            for (let j = 0; j < 95; j++) {
                const [, u, v] = data.sparks[j];
                const born = 4.08 + u * 1.07;
                const age = t - born;
                if (age <= 0 || age >= 0.73) continue;
                const px = 400 + 440 * smooth((born - 4) / 1.24);
                const x = px + (u - 0.5) * 35 + age * (u - 0.5) * 245;
                const y = 350 + (v - 0.5) * 75 + age * (v - 0.5) * 300 + age * age * 105;
                dot(scene, x, y, j % 11 === 0 ? 2 : 1, rgb(255, 89 + point(age * 60), 24 + point(age * 65)));
            }
        }
    }

    function opticBeam(t) {
        if (t < 3.69 || t > 5.8) return;
        const fire = inOut(t, 3.69, 3.82, 5.56, 5.8);
        if (fire < 0.002) return;
        const contact = smooth((t - 3.88) / 0.16);
        const front = smooth((t - 3.75) / 0.18);
        const tipX = -180 + (180 + beamTravel(t)) * front;
        const tipY = 351 + 0.9 * Math.sin(t * 10);
        const source = Math.min(-65, view.left - 8);
        const end = Math.max(source, tipX);
        bloom((layer) => line(layer, source, 352, end, tipY, "rgb(187,24,18)", 55), 0.56 * fire, 0);
        bloom((layer) => line(layer, source, 352, end, tipY, "rgb(252,30,24)", 27), 0.86 * fire, 0);
        const rails = [
            [22, "rgb(229,39,23)"], [12, "rgb(255,82,47)"],
            [6, "rgb(255,193,153)"], [3, "rgb(255,246,238)"]
        ];
        for (const [width, color] of rails) {
            line(scene, source, 352, end, tipY, color, Math.max(1, width * fire));
        }
        for (const direction of [-1, 1]) {
            const y = 352 + direction * (13 + 1.6 * Math.sin(t * 25 + direction));
            line(scene, Math.min(-20, view.left - 4), y, end, y, "rgb(160,40,14)");
        }
        for (let j = 0; j < 23; j++) {
            const phase = (t * (3.4 + j * 0.016) + j * 0.037) % 1;
            const x = -30 + phase * (end + 30);
            if (x < 0 || x >= W) continue;
            const y = 351 + (j % 3 - 1) * 3;
            line(scene, x - 16 - 8 * (j % 4), y, x + 4, y, "rgb(250,122,89)");
        }
        if (contact > 0.02 && tipX > 0) {
            circleGlow(tipX, tipY, 119, "255,65,31", 0.84 * contact * fire);
            circleGlow(tipX, tipY, 47, "255,147,85", 0.9 * contact * fire);
            dot(scene, tipX, tipY, 9 * fire + 2, "rgb(255,237,223)");
            for (let k = 0; k < 36; k++) {
                const angle = k / 36 * TAU + t * 9.5;
                const spread = 14 + 31 * (0.5 + 0.5 * Math.sin(k * 3.7 + t * 14) ** 2);
                line(scene, tipX, tipY, tipX + spread * Math.cos(angle), tipY + spread * 0.75 * Math.sin(angle),
                    rgb(255, 77 + k % 4 * 15, 24 + k % 5 * 19));
            }
            bloom((layer) => {
                for (let j = 0; j < 20; j++) {
                    const x = tipX + Math.sin(t * 10 + j * 0.81) * 21;
                    const y = 522 + j * 9;
                    const half = (33 + j * 2.6) * (0.75 + 0.25 * Math.sin(t * 18 + j) ** 2);
                    line(layer, x - half, y, x + half, y, "rgb(155,42,14)");
                }
            }, 0.7 * contact * fire, 0);
            circleGlow(tipX, 450, 160, "210,41,23", 0.13 * contact * fire);
        }
        wash("rgb(255,150,124)", peak(t, 4.26, 0.08) * 0.1);
    }

    function impact(t) {
        if (inOut(t, 4.08, 4.3, 5.35, 6.1) < 0.002) return;
        const hitX = beamTravel(t);
        for (const [r, u, , , angle, speed] of data.sparks) {
            const age = t - (4.21 + u * 0.92);
            if (age <= 0 || age > 1.45) continue;
            const dx = Math.cos(angle * TAU);
            const dy = Math.sin(angle * TAU);
            const velocity = 170 + speed * 550;
            const x = hitX + velocity * age * dx;
            const y = 352 + velocity * age * 0.66 * dy + 35 * age ** 2;
            line(scene, x, y, x - 20 * dx, y - 20 * dy, rgb(255, 138 + point(90 * r), 110 + point(100 * r)));
        }
        wash("rgb(255,206,172)", peak(t, 4.74, 0.09) * 0.28);
    }

    function rebuildMagic(t) {
        const q = inOut(t, 8, 8.55, 10.6, 11.3);
        if (q < 0.005) return;
        const power = smooth((t - 8.32) / 1.5);
        bloom((layer) => {
            for (let k = 0; k < 10; k++) {
                const rx = (245 + 21 * k) * (1 - 0.54 * power);
                const ry = (126 + 12 * k) * (1 - 0.40 * power);
                const angle = t * (1.1 + 0.14 * k) + k;
                ellipse(layer, 640, 370, rx, ry, angle, angle + 168 * DEG,
                    rgb(82, 198 + 4 * k, 43), k % 3 === 0 ? 2 : 1);
                for (let j = 0; j < 8; j++) {
                    const a = angle + j * TAU / 8;
                    dot(layer, 640 + rx * Math.cos(a), 370 + ry * Math.sin(a), 2, "rgb(159,255,84)");
                }
            }
        }, 0.82 * q, 0.7 * q);
        data.sparks.forEach(([, u, , , angle, speed], k) => {
            const theta = t * (0.9 + speed * 0.25) + angle * TAU;
            const radius = (45 + u * 310) * (1 - power * 0.82);
            dot(scene, 640 + radius * Math.cos(theta), 360 + radius * 0.57 * Math.sin(theta),
                k % 8 === 0 ? 2 : 1, "rgb(132,255,87)");
        });
        if (t > 9.4 && t < 10.9) {
            const alpha = inOut(t, 9.25, 9.8, 10.6, 11);
            bloom((layer) => {
                for (let i = 0; i < 20; i++) {
                    const theta = i * TAU / 20 + t * 2;
                    dot(layer, 640 + 300 * Math.cos(theta), 360 + 120 * Math.sin(theta), 2, "rgb(165,255,117)");
                }
            }, 0.35 * alpha, 0);
        }
    }

    function foregroundMist(t) {
        const forming = inOut(t, 1.18, 2.19, 3.24, 4.21);
        const doom = inOut(t, 5.66, 6.66, 10.55, 11.91);
        const wake = inOut(t, 4.26, 4.84, 5.33, 6.28);
        const drift = 52 * Math.sin(t * 0.42);
        scene.save();
        scene.globalAlpha = 0.25 + 0.46 * forming + 0.42 * doom + 0.18 * wake;
        scene.drawImage(mist, 229 + drift, 373 + 12 * Math.sin(t * 0.65), 824, 161);
        scene.globalAlpha = 0.12 + 0.27 * forming + 0.28 * doom;
        scene.drawImage(mist, 361 - drift * 0.63, 263 + 17 * Math.sin(t * 0.9), 591, 119);
        scene.restore();
    }

    function finale(t) {
        const opacity = smooth((t - 12.9) / 0.75);
        if (opacity > 0) {
            scene.globalAlpha = opacity;
            sprite(scene, data.button, 411, 569);
            scene.globalAlpha = 1;
        }
        const sweep = inOut(t, 13.38, 13.62, 14.12, 14.44);
        if (sweep <= 0.001) return;
        const x = point(415 + 450 * sweep);
        line(scene, x, 573, x + 26, 634, "rgb(165,250,106)", 2);
        circleGlow(x, 601, 29, "150,246,46", sweep * 0.12);
    }

    function render(t) {
        scene.resetTransform();
        scene.clearRect(0, 0, view.width, view.height);
        project(scene);
        glow.resetTransform();
        glow.clearRect(0, 0, glow.canvas.width, glow.canvas.height);
        glow.globalCompositeOperation = "lighter";
        project(glow, view.glowScale);
        portal(t);
        ambient(t);
        sorcerer(t);
        const approach = smooth((t - 1.7) / 1.64);
        scene.save();
        scene.translate(640 + 3.2 * Math.sin(t * 0.8), 352 + 13 * (1 - approach) + 3.5 * Math.sin(t * 0.93));
        scene.rotate(-0.105 * (1 - approach) + 0.016 * Math.sin(t * 0.81));
        scene.transform(0.71 + 0.29 * approach, -0.075 * (1 - approach), 0, 1, 0, 0);
        scene.translate(-640, -352);
        drawMetal(t);
        shards(t);
        scene.restore();
        opticBeam(t);
        impact(t);
        rebuildMagic(t);
        storm(t);
        foregroundMist(t);
        finale(t);

        const z = 1.025 + 0.024 * smooth(t / 3.4) - 0.032 * smooth((t - 8.8) / 4.2);
        let dx = 3 * Math.sin(t * 0.32);
        let dy = 2 * Math.sin(t * 0.31);
        if (t > 4.5 && t < 4.9) {
            const shake = inOut(t, 4.5, 4.68, 4.72, 4.9);
            dx += 2.5 * shake * Math.sin(t * 28);
            dy += 2 * shake * Math.sin(t * 34);
        }
        // Let the compositor move the camera without a second full-frame Canvas draw.
        camera.style.transform = "translate3d(" + dx * view.cameraX + "px," + dy * view.cameraY + "px,0) scale(" + z + ")";
    }

    return { render, setViewport };
}
