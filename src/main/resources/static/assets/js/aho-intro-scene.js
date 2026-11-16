// The supplied photo and its mist share the same stage coordinates throughout
// the reveal, break and reassembly.
const W = 1280;
const H = 720;
const ART_SIZE = 520;
const ART_X = (W - ART_SIZE) / 2;
const ART_Y = (H - ART_SIZE) / 2;
const TAU = 2 * Math.PI;
const DEG = Math.PI / 180;
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

function surface(width, height, options) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas.getContext("2d", options);
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

function tracePolygon(ctx, points) {
    ctx.moveTo(...points[0]);
    for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
    ctx.closePath();
}

function featherArtwork(image, size) {
    const ctx = surface(size, size);
    ctx.drawImage(image, 0, 0, size, size);
    ctx.globalCompositeOperation = "destination-in";
    for (const [x, y] of [[size, 0], [0, size]]) {
        const fade = ctx.createLinearGradient(0, 0, x, y);
        fade.addColorStop(0, "#fff0");
        fade.addColorStop(0.0375, "#fff");
        fade.addColorStop(0.9625, "#fff");
        fade.addColorStop(1, "#fff0");
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, size, size);
    }
    return ctx.canvas;
}

function prepareFragments(artwork, data) {
    // The stencil is used only for moving fragments and the lighting pass.
    // Assembled frames draw the complete photo, including its original mist.
    const size = data.artSize;
    const texture = surface(size, size);
    texture.beginPath();
    for (const points of data.shape) tracePolygon(texture, points);
    texture.clip();
    texture.drawImage(artwork, 0, 0, size, size);

    const fragments = surface(...data.atlasSize);
    for (const [sx, sy, x, y, width, height, , , , , , points] of data.fragments) {
        fragments.save();
        fragments.translate(x, y);
        fragments.beginPath();
        tracePolygon(fragments, points);
        fragments.clip();
        fragments.drawImage(texture.canvas, sx, sy, width, height, 0, 0, width, height);
        fragments.restore();
    }
    return { texture: texture.canvas, atlas: fragments.canvas };
}

const media = (name) => new URL("../images/" + name, import.meta.url);
export async function loadIntroScene(canvas, signal) {
    const [mist, atlas, artwork, data] = await Promise.all([
        loadImage(media("aho-intro-emerald-mist.webp")),
        loadImage(media("aho-intro-art.webp")),
        loadImage(media("aho-intro-emerald-art.webp")),
        fetch(media("aho-intro-scene.json?v=emerald-mist-1"), { signal }).then((response) => {
            if (!response.ok) throw new Error("Intro scene unavailable");
            return response.json();
        })
    ]);
    if (signal.aborted) throw signal.reason;

    canvas.width = W;
    canvas.height = H;
    const scene = canvas.getContext("2d");
    if (!scene || !canvas.parentElement) throw new Error("Canvas unavailable");
    const camera = canvas.parentElement;
    const plate = mist.cloneNode();
    mist.className = "aho-intro-art";
    plate.className = "aho-intro-plate";
    for (const layer of [mist, plate]) {
        layer.alt = "";
        layer.setAttribute("aria-hidden", "true");
    }
    camera.prepend(mist, plate);

    const glow = surface(1, 1);
    glow.canvas.className = "aho-intro-glow";
    camera.append(glow.canvas);
    const figureLayer = surface(data.figure[2], data.figure[3]);
    const artworkLayer = surface(1, 1);
    const complete = featherArtwork(artwork, data.artSize);
    const { texture, atlas: shardAtlas } = prepareFragments(artwork, data);
    const unit = ART_SIZE / data.artSize;
    const glowTextures = new Map();
    let view;

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
        const artworkResolution = Math.max(1, Math.min(960, Math.round(ART_SIZE * fit)));
        resize(artworkLayer, artworkResolution, artworkResolution);
        const artScale = artworkResolution / ART_SIZE;
        artworkLayer.setTransform(artScale, 0, 0, artScale, 0, 0);
        artworkLayer.imageSmoothingQuality = "high";
        plate.style.left = (cssWidth - ART_SIZE * view.cameraX) / 2 + "px";
        plate.style.top = (cssHeight - ART_SIZE * view.cameraY) / 2 + "px";
        plate.style.width = ART_SIZE * view.cameraX + "px";
        plate.style.height = ART_SIZE * view.cameraY + "px";
        scene.imageSmoothingQuality = "high";
        glow.canvas.style.setProperty("--intro-glow-blur", Math.max(3, 9 * view.cameraX) + "px");

        return { top: (y + 612 * fit) / height };
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
        const strikes = [0.36, 1.1, 1.86, 3.8, 5.43, 6.82, 7.9, 10.4];
        strikes.forEach((at, i) => {
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
        const amount = inOut(t, 6.47, 8.15, 9.35, 10.64);
        if (amount < 0.003) return;
        const q = smooth((t - 6.47) / 1.8);
        const scale = 0.985 + 0.019 * q;
        const [,, textureWidth, textureHeight] = data.figure;
        const w = textureWidth * scale;
        const h = textureHeight * scale;
        const x = 640 - w * 0.5 + 3 * Math.sin(t * 0.51);
        const y = 93 + 20 * (1 - q) + 3 * Math.sin(t * 0.68);
        const maskY = 35 + q * (textureHeight + 80);
        scene.globalAlpha = amount * (0.65 + 0.35 * q);
        if (maskY < textureHeight) {
            figureLayer.clearRect(0, 0, textureWidth, textureHeight);
            sprite(figureLayer, data.figure, 0, 0);
            const reveal = figureLayer.createLinearGradient(0, maskY, 0, maskY + 120);
            reveal.addColorStop(0, "#fff");
            reveal.addColorStop(1, "#fff0");
            figureLayer.globalCompositeOperation = "destination-in";
            figureLayer.fillStyle = reveal;
            figureLayer.fillRect(0, 0, textureWidth, textureHeight);
            figureLayer.globalCompositeOperation = "source-over";
            scene.drawImage(figureLayer.canvas, x, y, w, h);
        } else {
            sprite(scene, data.figure, x, y, w, h);
        }
        scene.globalAlpha = 1;
        for (const eye of [547, 681]) {
            circleGlow(eye, 209 + (3 * Math.sin(t * 0.68)), 26,
                "122,255,62", 0.15 * amount * (0.75 + 0.25 * Math.sin(t * 3) ** 2));
        }

        bloom((layer) => {
            for (let k = 0; k < 20; k++) {
                const phase = t * (0.45 + k * 0.018) + k * 1.31;
                const x = 640 + (130 + 12 * k) * Math.sin(phase) * 0.9;
                const y = 495 + 22 * Math.sin(phase * 0.6 + k) + 7 * (k % 6);
                layer.beginPath();
                layer.ellipse(x, y, 46 + 20 * (k % 4), 10 + 5 * (k % 3), 0, 0, TAU);
                layer.fillStyle = rgb(48, 73 + 5 * k, 16);
                layer.fill();
            }
        }, 0.25 * amount, 0);

        const power = amount * smooth((t - 7.40) / 1.06);
        if (power <= 0.01) return;
        bloom((layer) => {
            const hands = [[450, 404], [820, 398]];
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

    function drawArtwork(t) {
        if (t < 1.15 || (t > 5.65 && t < 8.72)) return;
        if ((t >= 2.75 && t <= 4.13) || t >= 10.72) {
            scene.drawImage(complete, ART_X, ART_Y, ART_SIZE, ART_SIZE);
            return;
        }

        artworkLayer.clearRect(0, 0, ART_SIZE, ART_SIZE);
        artworkLayer.drawImage(complete, 0, 0, ART_SIZE, ART_SIZE);
        const coverage = artworkLayer.createLinearGradient(0, 0, ART_SIZE, 52);
        for (let i = 0; i <= 18; i++) {
            const column = i / 18;
            const reveal = smooth((t - 1.15 - column * 0.87) / 0.7);
            const burn = 1 - smooth((t - 4.13 - column * 1.05) / 0.47);
            const rebuild = smooth((t - 8.72 - (1 - column) * 0.56) / 1.44);
            const alpha = reveal * Math.max(burn, rebuild);
            coverage.addColorStop(column, "rgba(255,255,255," + alpha + ")");
        }
        artworkLayer.globalCompositeOperation = "destination-in";
        artworkLayer.fillStyle = coverage;
        artworkLayer.fillRect(0, 0, ART_SIZE, ART_SIZE);
        artworkLayer.globalCompositeOperation = "source-over";
        scene.drawImage(artworkLayer.canvas, ART_X, ART_Y, ART_SIZE, ART_SIZE);

        const forming = inOut(t, 1.18, 1.43, 2.36, 2.75);
        const lightX = ART_X + ART_SIZE * smooth((t - 1.18) / 1.5);
        circleGlow(lightX, 356, 138, "103,255,52", 0.23 * forming);
    }

    function shards(t) {
        if (t > 4.15 && t < 10.85) {
            const returnHome = smooth((t - 7.98) / 2.74);
            const assembled = smooth((t - 8.72) / 2);
            for (const [sx, sy, atlasX, atlasY, w, h, vx, vy, spin, delay, phase] of data.fragments) {
                const hit = 4.15 + (sx + w * 0.5) / data.artSize * 1.05 + delay * 0.15;
                const amount = smooth((t - hit) / 0.98) * (1 - returnHome);
                const opacity = smooth((t - hit) / 0.15) * (1 - assembled);
                if (opacity <= 0) continue;

                const swirl = 25 * Math.sin(t * 2.25 + phase) * amount;
                const width = w * unit;
                const height = h * unit;
                const x = ART_X + sx * unit + vx * amount + swirl + width / 2;
                const y = ART_Y + sy * unit + vy * amount + 15 * Math.cos(t * 1.55 + phase) * amount + height / 2;
                const depth = 1 + 0.29 * Math.cos(phase) * amount;
                const tilt = 0.34 + 0.66 * Math.abs(Math.cos((phase + t * 1.6) * amount));

                scene.save();
                scene.translate(x, y);
                scene.rotate(-spin * amount * DEG);
                scene.scale(depth * tilt, depth);
                scene.globalAlpha = 0.99 * opacity;
                scene.drawImage(shardAtlas, atlasX, atlasY, w, h, -width / 2, -height / 2, width, height);
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
        const tipX = -180 + (580 + 445 * smooth((t - 3.98) / 1.27)) * front;
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
        const hitX = 400 + 445 * smooth((t - 3.98) / 1.27);
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
        const shock = (t - 4.37) / 0.94;
        if (shock > 0 && shock < 1) {
            const radius = 36 + 360 * smooth(shock);
            const opacity = 0.34 * Math.sin(Math.PI * shock) * (1 - shock);
            bloom((layer) => ellipse(layer, 638, 353, radius, radius * 0.56, 0, TAU, "#ffbb78", 2),
                opacity, opacity * 0.75);
        }
        wash("rgb(255,206,172)", peak(t, 4.74, 0.09) * 0.21);
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

    function finishArtwork(t) {
        const strength = inOut(t, 10.64, 11.12, 11.91, 12.28);
        if (strength <= 0.002) return;
        const sweep = -85 + (ART_SIZE + 170) * smooth((t - 10.64) / 1.65);
        artworkLayer.clearRect(0, 0, ART_SIZE, ART_SIZE);
        const shine = artworkLayer.createLinearGradient(sweep - 61, 0, sweep + 61, 64);
        shine.addColorStop(0, "#a4ff7e00");
        shine.addColorStop(0.49, "#d9ff9964");
        shine.addColorStop(0.61, "#b8ff8458");
        shine.addColorStop(1, "#a4ff7e00");
        artworkLayer.fillStyle = shine;
        artworkLayer.fillRect(0, 0, ART_SIZE, ART_SIZE);
        artworkLayer.globalCompositeOperation = "destination-in";
        artworkLayer.drawImage(texture, 0, 0, ART_SIZE, ART_SIZE);
        artworkLayer.globalCompositeOperation = "source-over";

        scene.save();
        scene.globalCompositeOperation = "screen";
        scene.globalAlpha = 0.58 * strength;
        scene.drawImage(artworkLayer.canvas, ART_X, ART_Y, ART_SIZE, ART_SIZE);
        scene.restore();
        circleGlow(ART_X + ART_SIZE * 0.76, ART_Y + ART_SIZE * 0.27, 62, "128,255,48", 0.19 * strength);
    }

    function render(t) {
        scene.resetTransform();
        scene.clearRect(0, 0, view.width, view.height);
        project(scene);
        glow.resetTransform();
        glow.clearRect(0, 0, glow.canvas.width, glow.canvas.height);
        glow.globalCompositeOperation = "lighter";
        project(glow, view.glowScale);
        drawArtwork(t);
        portal(t);
        ambient(t);
        sorcerer(t);
        shards(t);
        opticBeam(t);
        impact(t);
        rebuildMagic(t);
        storm(t);
        finishArtwork(t);

        const z = 1.014 + 0.025 * smooth(t / 3.4) - 0.023 * smooth((t - 8.8) / 4.2);
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
