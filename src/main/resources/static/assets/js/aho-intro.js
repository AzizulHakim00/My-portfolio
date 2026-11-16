const dialog = document.querySelector("#aho-intro");
const canvas = dialog?.querySelector(".aho-intro-stage");
const enter = dialog?.querySelector(".aho-intro-enter");
const skip = dialog?.querySelector(".aho-intro-skip");
const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
const sessionKey = "aho-silent-intro-seen";

function alreadySeen() {
    try {
        return sessionStorage.getItem(sessionKey) === "1";
    } catch {
        return false;
    }
}

async function playIntro() {
    const { pathname, search, hash } = window.location;
    if (!canvas || !enter || !skip || typeof dialog.showModal !== "function" ||
        motion.matches || document.hidden || pathname !== "/" || search ||
        (hash && hash !== "#home") || alreadySeen()) return;

    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    let frame = 0;
    let deadline = window.setTimeout(finish, 3500);
    let started = 0;

    function finish() {
        listeners.abort();
        window.clearTimeout(deadline);
        window.cancelAnimationFrame(frame);
        if (dialog.open) dialog.close();
    }

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
        const { INTRO_LENGTH, loadIntroScene } = await import("./aho-intro-scene.js?v=optic-2");
        if (listeners.signal.aborted) return;
        const { render, setViewport } = await loadIntroScene(canvas, listeners.signal);
        if (listeners.signal.aborted) return;

        let lastFrame = -1;
        function sizeForViewport() {
            const { width, height } = canvas.getBoundingClientRect();
            if (!width || !height) return;
            const button = setViewport(width, height, window.devicePixelRatio);
            enter.style.top = button.top * 100 + "%";
            enter.style.width = button.width * 100 + "%";
            enter.style.height = button.height * 100 + "%";
            render(Math.max(0, lastFrame));
        }
        dialog.showModal();
        sizeForViewport();
        window.addEventListener("resize", sizeForViewport, options);
        window.visualViewport?.addEventListener("resize", sizeForViewport, options);
        try {
            sessionStorage.setItem(sessionKey, "1");
        } catch {
            // Some browsing modes disable session storage.
        }

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
