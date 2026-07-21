(() => {
  "use strict";
  const form = document.querySelector("#contact-form");
  if (!form || form.dataset.v3Contact) return;
  form.dataset.v3Contact = "true";
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const status = document.querySelector("#form-status");
    const submit = form.querySelector('button[type="submit"]');
    if (!form.checkValidity()) {
      form.querySelector(":invalid")?.focus();
      if (status) { status.textContent = "Please complete every field with a valid email address."; status.className = "error"; }
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    if (data._honey) return;
    submit?.setAttribute("disabled", "");
    if (status) { status.textContent = "Sending securely…"; status.className = ""; }
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, subject: data.subject, message: data.message, honey: data._honey || "" })
      });
      if (!response.ok || !(response.headers.get("content-type") || "").includes("application/json")) throw new Error("Spring mail endpoint unavailable");
      const payload = await response.json();
      form.reset();
      if (status) { status.textContent = payload.message || "Message sent successfully."; status.className = "success"; }
    } catch {
      if (status) status.textContent = "Using the hosted delivery fallback…";
      const subject = form.querySelector('[name="_subject"]');
      const next = form.querySelector('[name="_next"]');
      if (subject) subject.value = `Portfolio message: ${data.subject}`;
      if (next) {
        const url = new URL(location.href);
        url.searchParams.set("contact", "sent");
        url.hash = "contact";
        next.value = url.toString();
      }
      HTMLFormElement.prototype.submit.call(form);
      return;
    } finally {
      submit?.removeAttribute("disabled");
    }
  }, true);
})();
