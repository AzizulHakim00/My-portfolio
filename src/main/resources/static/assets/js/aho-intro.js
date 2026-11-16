(() => {
    "use strict";

    const intro = document.querySelector("#aho-intro");
    const video = intro?.querySelector("video");
    const skip = intro?.querySelector("button");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const { hash, pathname, search } = window.location;

    if (!video || !skip || typeof intro.showModal !== "function" || motion.matches || document.hidden ||
        pathname !== "/" || search || (hash && hash !== "#home")) return;

    const sessionKey = "aho-video-intro-seen";
    try {
        if (sessionStorage.getItem(sessionKey)) return;
    } catch {
        // Playback also works when storage is unavailable.
    }

    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    let timeout;

    const finish = () => {
        listeners.abort();
        window.clearTimeout(timeout);
        if (intro.open) intro.close();
        video.pause();
        video.removeAttribute("src");
        video.load();
    };

    const setTimeoutToFinish = (delay) => {
        window.clearTimeout(timeout);
        timeout = window.setTimeout(finish, delay);
    };

    const rememberPlayback = () => {
        try {
            sessionStorage.setItem(sessionKey, "1");
        } catch {
            // The intro can still be dismissed without storage.
        }
    };

    video.addEventListener("playing", () => {
        window.clearTimeout(timeout);
        if (intro.open) return;
        try {
            intro.showModal();
        } catch {
            finish();
            return;
        }
        rememberPlayback();
    }, options);

    video.addEventListener("waiting", () => {
        if (intro.open) setTimeoutToFinish(2500);
    }, options);
    video.addEventListener("ended", finish, options);
    video.addEventListener("error", finish, options);
    skip.addEventListener("click", finish, options);
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

    const cancelPendingIntro = () => {
        if (!intro.open) finish();
    };
    window.addEventListener("pointerdown", cancelPendingIntro, { ...options, capture: true });
    window.addEventListener("keydown", cancelPendingIntro, { ...options, capture: true });
    window.addEventListener("hashchange", finish, options);

    const usePortrait = window.matchMedia("(max-width: 900px) and (orientation: portrait)").matches;
    video.muted = true;
    video.src = usePortrait ? video.dataset.mobileSrc : video.dataset.desktopSrc;
    setTimeoutToFinish(4000);
    video.play().catch(() => {
        if (!listeners.signal.aborted) finish();
    });
})();
