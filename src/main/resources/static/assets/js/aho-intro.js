const dialog = document.querySelector("#aho-intro");
const canvas = dialog?.querySelector(".aho-intro-stage");
const enter = dialog?.querySelector(".aho-intro-enter");
const skip = dialog?.querySelector(".aho-intro-skip");
const sound = dialog?.querySelector(".aho-intro-sound");
const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
const sessionKey = "aho-optic-burn-seen";

function alreadySeen() {
    try {
        return sessionStorage.getItem(sessionKey) === "1";
    } catch {
        return false;
    }
}

async function playIntro() {
    const { pathname, search, hash } = window.location;
    if (!canvas || !enter || !skip || !sound || typeof dialog.showModal !== "function" ||
        motion.matches || document.hidden || pathname !== "/" || search ||
        (hash && hash !== "#home") || alreadySeen()) return;

    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    let frame = 0;
    let deadline = window.setTimeout(finish, 3500);
    let started = 0;
    let audio;
    let soundOn = false;

    function finish() {
        listeners.abort();
        window.clearTimeout(deadline);
        window.cancelAnimationFrame(frame);
        audio?.pause();
        if (dialog.open) dialog.close();
    }

    function setSound(enabled) {
        soundOn = enabled;
        sound.setAttribute("aria-pressed", String(enabled));
        sound.textContent = enabled ? "Sound on" : "Sound off";
    }

    function syncSound() {
        if (audio && audio.readyState > 0) {
            audio.currentTime = Math.min(audio.duration, (performance.now() - started) / 1000);
        }
    }

    sound.addEventListener("click", async () => {
        if (soundOn) {
            setSound(false);
            audio?.pause();
            return;
        }
        if (!audio) {
            const url = new URL("../audio/aho-intro-score.m4a", import.meta.url);
            audio = new Audio(url);
            audio.preload = "none";
            audio.addEventListener("loadedmetadata", syncSound, options);
        }
        setSound(true);
        syncSound();
        try {
            await audio.play();
        } catch {
            if (dialog.open) setSound(false);
        }
    }, options);

    skip.addEventListener("click", finish, options);
    enter.addEventListener("click", () => {
        finish();
        document.querySelector("#main")?.focus({ preventScroll: true });
    }, options);
    dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        finish();
    }, options);
    motion.addEventListener("change", () => {
        if (motion.matches) finish();
    }, options);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) finish();
    }, options);
    window.addEventListener("pagehide", finish, options);
    window.addEventListener("hashchange", finish, options);
    const cancelPending = () => {
        if (!dialog.open) finish();
    };
    window.addEventListener("pointerdown", cancelPending, { ...options, capture: true });
    window.addEventListener("keydown", cancelPending, { ...options, capture: true });

    try {
        const { INTRO_LENGTH, loadIntroScene } = await import("./aho-intro-scene.js?v=optic-1");
        if (listeners.signal.aborted) return;
        const { render, setResolution } = await loadIntroScene(canvas, listeners.signal);
        if (listeners.signal.aborted) return;

        function sizeForViewport() {
            const stageWidth = Math.min(window.innerWidth, window.innerHeight * 16 / 9);
            setResolution(stageWidth * Math.min(window.devicePixelRatio || 1, 1.5));
        }
        sizeForViewport();
        render(0);
        dialog.showModal();
        window.addEventListener("resize", sizeForViewport, options);
        try {
            sessionStorage.setItem(sessionKey, "1");
        } catch {
            // Some browsing modes disable session storage.
        }

        let lastFrame = -1;
        function tick(now) {
            const t = Math.floor(Math.max(0, now - started) * 0.06) / 60;
            if (t >= INTRO_LENGTH) {
                finish();
                return;
            }
            if (t >= 13.1 && enter.hidden) enter.hidden = false;
            if (t !== lastFrame) {
                render(t);
                lastFrame = t;
            }
            frame = window.requestAnimationFrame(tick);
        }

        window.clearTimeout(deadline);
        deadline = window.setTimeout(finish, INTRO_LENGTH * 1000 + 250);
        started = performance.now();
        frame = window.requestAnimationFrame(tick);
    } catch {
        finish();
    }
}

playIntro();
