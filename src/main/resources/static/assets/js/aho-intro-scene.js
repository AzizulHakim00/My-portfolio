// Browser renderer for the original AHO Optic Burn scene. All coordinates and
// timestamps use its 1280 × 720, 60 fps master. The atlas contains static art.
const W = 1280;
const H = 720;
const TAU = 2 * Math.PI;
const DEG = Math.PI / 180;
const LX = 253;
const LY = 205;
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

function surface(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas.getContext("2d");
}

function line(ctx, x0, y0, x1, y1, color, width = 1) {
    ctx.beginPath();
    ctx.moveTo(point(x0), point(y0));
    ctx.lineTo(point(x1), point(y1));
    ctx.strokeStyle = color;
    ctx.lineWidth = width === 1 ? 1.24 : width;
    ctx.stroke();
}

function dot(ctx, x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point(x), point(y), radius, 0, TAU);
    ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, angle, end, color, width = 1) {
    ctx.beginPath();
    ctx.ellipse(x, y, point(rx), point(ry), 0, angle, end);
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
    const [backdrop, atlas, data] = await Promise.all([
        loadImage(media("aho-intro-storm.webp")),
        loadImage(media("aho-intro-art.webp")),
        fetch(media("aho-intro-scene.json"), { signal }).then((response) => {
            if (!response.ok) throw new Error("Intro scene unavailable");
            return response.json();
        })
    ]);

    canvas.width = W;
    canvas.height = H;
    const output = canvas.getContext("2d", { alpha: false });
    if (!output) throw new Error("Canvas unavailable");
    const scene = surface(W, H);
    const overlay = surface(W, H);
    const glowScale = 1 / 3;
    const filtered = surface(Math.ceil(W * glowScale), H * glowScale);
    const figureLayer = surface(data.figure[2], data.figure[3]);
    const [,, LW, LH] = data.logo;
    const metalLayer = surface(LW, LH);
    function setResolution(target) {
        const width = Math.round(Math.min(W, Math.max(640, target)));
        const height = Math.round(width * H / W);
        for (const ctx of [scene, overlay, output]) {
            if (ctx.canvas.width !== width || ctx.canvas.height !== height) {
                ctx.canvas.width = width;
                ctx.canvas.height = height;
            }
            ctx.setTransform(width / W, 0, 0, height / H, 0, 0);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
        }
    }
    setResolution(W);

    function sprite(ctx, source, x, y, width = source[2], height = source[3]) {
        ctx.drawImage(atlas, ...source, point(x), point(y), width, height);
    }

    function bloom(paint, blur, power, core = 0) {
        overlay.clearRect(0, 0, W, H);
        paint(overlay);
        scene.save();
        scene.globalCompositeOperation = "lighter";
        if (power > 0) {
            const w = filtered.canvas.width;
            const h = filtered.canvas.height;
            filtered.clearRect(0, 0, w, h);
            filtered.filter = "blur(" + blur * glowScale + "px)";
            filtered.drawImage(overlay.canvas, 0, 0, w, h);
            filtered.filter = "none";
            scene.globalAlpha = power;
            scene.drawImage(filtered.canvas, 0, 0, W, H);
        }
        if (core > 0) {
            scene.globalAlpha = core;
            scene.drawImage(overlay.canvas, 0, 0, W, H);
        }
        scene.restore();
    }

    function circleGlow(x, y, radius, color, power) {
        if (power <= 0) return;
        x = point(x);
        y = point(y);
        const g = scene.createRadialGradient(x, y, 0, x, y, radius);
        for (let i = 0; i <= 8; i++) {
            const p = i / 8;
            g.addColorStop(p, "rgba(" + color + "," + (1 - p * p) ** 2 * power + ")");
        }
        scene.save();
        scene.globalCompositeOperation = "screen";
        scene.fillStyle = g;
        scene.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        scene.restore();
    }

    function wash(color, alpha) {
        scene.save();
        scene.fillStyle = color;
        scene.globalAlpha = alpha;
        scene.fillRect(0, 0, W, H);
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
                    if (j === 0) layer.moveTo(x, y);
                    else layer.lineTo(x, y);
                });
                layer.strokeStyle = "rgb(210,241,244)";
                layer.lineWidth = 2;
                layer.stroke();
            }, 16, amount * 0.65, amount * 0.7);
            wash("rgb(255,252,229)", amount * 0.08);
        });
    }

    function ambient(t) {
        data.stars.forEach(([x, y, velocity, shade, phase], i) => {
            const px = (x * W + 17 * Math.sin(t * 0.37 + phase * 6) + W) % W;
            const py = (y * H - (12 + 39 * velocity) * t + H * 5) % H;
            if (py > 80 && py < 690) {
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
        }, 11, 0.52 * strength, 0.8 * strength);

        const beam = inOut(t, 1, 1.35, 2.17, 2.62);
        if (beam > 0.01) {
            bloom((layer) => line(layer, 640, -50, 640, 535, "rgb(116,255,24)", 20), 32, 0.8 * beam);
            line(scene, 640, -50, 640, 535, "rgb(180,245,115)", Math.max(1, point(4 * beam)));
            circleGlow(640, 530, 180, "105,255,37", 0.35 * beam);
        }
        if (t > 1 && t < 3.4) {
            for (let j = 0; j < 10; j++) {
                const amount = 0.04 + Math.sin(t * 4 + j) ** 2 * 0.11;
                const x = point(640 + Math.sin(j * 1.8 + t) * 18);
                const half = point((40 + j * 16) * amount);
                line(scene, x - half, 514 + 17 * j, x + half, 514 + 17 * j,
                    rgb(54, 80 + point(110 * strength), 19));
            }
        }
    }

    function sorcerer(t) {
        const amount = inOut(t, 6.47, 8.15, 10.2, 11.28);
        if (amount < 0.003) return;
        const q = smooth((t - 6.47) / 1.8);
        const scale = 0.985 + 0.019 * q;
        const w = point(903 * scale);
        const h = point(553 * scale);
        const x = point(640 - w * 0.5 + 3 * Math.sin(t * 0.51));
        const y = point(93 + 20 * (1 - q) + 3 * Math.sin(t * 0.68));
        const maskY = 35 + q * (h + 80);
        figureLayer.clearRect(0, 0, w, h);
        sprite(figureLayer, data.figure, 0, 0, w, h);
        if (maskY < h) {
            const reveal = figureLayer.createLinearGradient(0, maskY, 0, maskY + 120);
            reveal.addColorStop(0, "#fff");
            reveal.addColorStop(1, "#fff0");
            figureLayer.globalCompositeOperation = "destination-in";
            figureLayer.fillStyle = reveal;
            figureLayer.fillRect(0, 0, w, h);
            figureLayer.globalCompositeOperation = "source-over";
        }
        scene.globalAlpha = amount * (0.65 + 0.35 * q);
        scene.drawImage(figureLayer.canvas, 0, 0, w, h, x, y, w, h);
        scene.globalAlpha = 1;
        for (const eye of [547, 681]) {
            circleGlow(eye, 209 + point(3 * Math.sin(t * 0.68)), 26,
                "122,255,62", 0.15 * amount * (0.75 + 0.25 * Math.sin(t * 3) ** 2));
        }

        bloom((layer) => {
            for (let k = 0; k < 20; k++) {
                const phase = t * (0.45 + k * 0.018) + k * 1.31;
                const x = point(640 + (130 + 12 * k) * Math.sin(phase) * 0.9);
                const y = point(495 + 22 * Math.sin(phase * 0.6 + k) + 7 * (k % 6));
                layer.beginPath();
                layer.ellipse(x, y, 46 + 20 * (k % 4), 10 + 5 * (k % 3), 0, 0, TAU);
                layer.fillStyle = rgb(48, 73 + 5 * k, 16);
                layer.fill();
            }
        }, 28, 0.37 * amount);

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
        }, 12, 0.87 * power, 0.78 * power);
    }

    function drawMetal(t) {
        const reveal = smooth((t - 2.13) / 1.22);
        const rebuild = smooth((t - 8.8) / 1.82);
        if (reveal <= 0) return;
        metalLayer.clearRect(0, 0, LW, LH);
        sprite(metalLayer, data.logo, 0, 0);
        if (t > 4.12 && rebuild < 1) {
            const alphaMask = metalLayer.createLinearGradient(0, 0, LW, 0);
            for (let i = 0; i <= 30; i++) {
                const column = i / 30;
                const cut = 4.12 + column * 1.04;
                const opacity = Math.max(1 - smooth((t - cut) / 0.47), rebuild);
                alphaMask.addColorStop(column, "rgba(255,255,255," + opacity + ")");
            }
            metalLayer.globalCompositeOperation = "destination-in";
            metalLayer.fillStyle = alphaMask;
            metalLayer.fillRect(0, 0, LW, LH);
            metalLayer.globalCompositeOperation = "source-over";
        }
        scene.globalAlpha = reveal;
        scene.drawImage(metalLayer.canvas, LX, LY);
        scene.globalAlpha = 1;

        if (t > 3.96 && t < 6.05) {
            const cut = 396 + 440 * smooth((t - 3.98) / 1.25);
            const life = 1 - smooth((t - 5.3) / 0.75);
            metalLayer.clearRect(0, 0, LW, LH);
            metalLayer.save();
            metalLayer.translate(cut - LX, 352 - LY);
            metalLayer.scale(62, 174);
            const heat = metalLayer.createRadialGradient(0, 0, 0, 0, 0, 2.8);
            for (let i = 0; i <= 9; i++) {
                heat.addColorStop(i / 9, "rgba(195,75,25," + life * Math.exp(-((i * 2.8 / 9) ** 2)) + ")");
            }
            metalLayer.fillStyle = heat;
            metalLayer.fillRect(-2.8, -2.8, 5.6, 5.6);
            metalLayer.restore();
            metalLayer.globalCompositeOperation = "destination-in";
            sprite(metalLayer, data.logo, 0, 0);
            metalLayer.globalCompositeOperation = "source-over";
            scene.globalCompositeOperation = "lighter";
            scene.drawImage(metalLayer.canvas, LX, LY);
            scene.globalCompositeOperation = "source-over";
            for (let k = 0; k < 21; k++) {
                const x = cut - 105 + k % 7 * 30;
                if (x < LX || x > LX + LW) continue;
                const y = 352 + point(26 * Math.sin(k * 9.2));
                const length = point((16 + 44 * Math.sin(k * 5.6) ** 2) * (1 + 0.3 * Math.sin(t * 23 + k)));
                line(scene, x, y - length / 2, x + 13 * Math.sin(k * 3), y + length / 2,
                    k % 3 ? "rgb(255,79,21)" : "rgb(255,165,100)", k % 7 === 0 ? 2 : 1);
            }
        }
    }

    function shards(t) {
        if (t > 4.15 && t < 10.85) {
            const returnHome = smooth((t - 8.09) / 2.53);
            data.shards.forEach(([sx, sy, atlasX, atlasY, w, h, vx, vy, spin, delay, phase]) => {
                const hit = 4.17 + (sx + w * 0.5) / LW * 0.93 + delay * 0.15;
                const amount = smooth((t - hit) / 1.06) * (1 - returnHome);
                if (amount < 0.006) return;
                const x = point(LX + sx + vx * amount + 9 * Math.sin(t * 1.8 + phase) * amount);
                const y = point(LY + sy + vy * amount + 5 * Math.cos(t * 1.4 + phase) * amount);
                scene.save();
                scene.translate(x, y);
                scene.beginPath();
                scene.rect(0, 0, w, h);
                scene.clip();
                scene.translate(w * 0.5, h * 0.5);
                scene.rotate(-spin * amount * DEG);
                scene.translate(-w * 0.5, -h * 0.5);
                scene.globalAlpha = 0.98;
                sprite(scene, [atlasX, atlasY, w, h], 0, 0);
                if (t < 6.5) {
                    const hot = (1 - smooth((t - hit) / 1.3)) * smooth((t - hit + 0.2) / 0.3);
                    if (hot > 0.02) {
                        scene.globalAlpha = hot * 0.77;
                        sprite(scene, [atlasX + w + 1, atlasY, w, h], 0, 0);
                    }
                }
                scene.restore();
            });
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
        const tipX = point(-180 + (580 + 445 * smooth((t - 3.98) / 1.27)) * front);
        const tipY = 351 + point(0.9 * Math.sin(t * 10));
        const end = Math.max(-65, tipX);
        bloom((layer) => line(layer, -65, 352, end, tipY, "rgb(187,24,18)", 55), 31, 0.95 * fire);
        bloom((layer) => line(layer, -65, 352, end, tipY, "rgb(252,30,24)", 27), 11, 0.86 * fire);
        const rails = [
            [22, "rgb(229,39,23)"], [12, "rgb(255,82,47)"],
            [6, "rgb(255,193,153)"], [3, "rgb(255,246,238)"]
        ];
        for (const [width, color] of rails) {
            line(scene, -65, 352, end, tipY, color, Math.max(1, point(width * fire)));
        }
        for (const direction of [-1, 1]) {
            const y = point(352 + direction * (13 + 1.6 * Math.sin(t * 25 + direction)));
            line(scene, -20, y, end, y, "rgb(160,40,14)");
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
            dot(scene, tipX, tipY, point(9 * fire + 2), "rgb(255,237,223)");
            for (let k = 0; k < 36; k++) {
                const angle = k / 36 * TAU + t * 9.5;
                const spread = 14 + 31 * (0.5 + 0.5 * Math.sin(k * 3.7 + t * 14) ** 2);
                line(scene, tipX, tipY, tipX + spread * Math.cos(angle), tipY + spread * 0.75 * Math.sin(angle),
                    rgb(255, 77 + k % 4 * 15, 24 + k % 5 * 19));
            }
            bloom((layer) => {
                for (let j = 0; j < 20; j++) {
                    const x = point(tipX + Math.sin(t * 10 + j * 0.81) * 21);
                    const y = 522 + j * 9;
                    const half = point((33 + j * 2.6) * (0.75 + 0.25 * Math.sin(t * 18 + j) ** 2));
                    line(layer, x - half, y, x + half, y, "rgb(155,42,14)");
                }
            }, 10, 0.7 * contact * fire);
            circleGlow(tipX, 450, 160, "210,41,23", 0.13 * contact * fire);
        }
        wash("rgb(255,150,124)", peak(t, 4.26, 0.08) * 0.1);
    }

    function impact(t) {
        if (inOut(t, 4.08, 4.3, 5.35, 6.1) < 0.002) return;
        const hitX = point(400 + 445 * smooth((t - 3.98) / 1.27));
        for (const [r, u, , , angle, speed] of data.sparks) {
            const age = t - (4.21 + u * 0.92);
            if (age <= 0 || age > 1.45) continue;
            const dx = Math.cos(angle * TAU);
            const dy = Math.sin(angle * TAU);
            const velocity = 170 + speed * 550;
            const x = point(hitX + velocity * age * dx);
            const y = point(352 + velocity * age * 0.66 * dy + 35 * age ** 2);
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
                const rx = point((245 + 21 * k) * (1 - 0.54 * power));
                const ry = point((126 + 12 * k) * (1 - 0.40 * power));
                const angle = t * (1.1 + 0.14 * k) + k;
                ellipse(layer, 640, 370, rx, ry, angle, angle + 168 * DEG,
                    rgb(82, 198 + 4 * k, 43), k % 3 === 0 ? 2 : 1);
                for (let j = 0; j < 8; j++) {
                    const a = angle + j * TAU / 8;
                    dot(layer, 640 + rx * Math.cos(a), 370 + ry * Math.sin(a), 2, "rgb(159,255,84)");
                }
            }
        }, 15, 0.82 * q, 0.83 * q);
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
            }, 10, 0.35 * alpha);
        }
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
        scene.drawImage(backdrop, 0, 0, W, H);
        portal(t);
        ambient(t);
        sorcerer(t);
        drawMetal(t);
        shards(t);
        opticBeam(t);
        impact(t);
        rebuildMagic(t);
        storm(t);
        finale(t);

        const z = 1.012 + 0.013 * Math.sin(t * 0.21);
        let dx = 3 * Math.sin(t * 0.32);
        let dy = 2 * Math.sin(t * 0.31);
        if (t > 4.5 && t < 4.9) {
            const shake = peak(t, 4.7, 0.2);
            dx += 5 * shake * Math.sin(t * 47);
            dy += 4 * shake * Math.sin(t * 62);
        }
        output.drawImage(scene.canvas, (1 - z) * W / 2 + dx, (1 - z) * H / 2 + dy, W * z, H * z);
    }

    return { render, setResolution };
}
