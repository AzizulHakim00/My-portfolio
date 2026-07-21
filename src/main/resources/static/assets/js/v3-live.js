(() => {
  "use strict";
  const projects = document.querySelector("#projects");
  const repos = [
    ["TaskFlow", "task-management-django", "/projects/taskflow"],
    ["Assignment Writer Hire", "Assigment_writer_hire", "/projects/assignment-writer-hire"],
    ["Real Madrid Management", "RealMadrid_Club_Management", "/projects/real-madrid-management"],
    ["ICE Security Lab", "Cyber-Security---Project", "/projects/ice-pentest-lab"]
  ];

  if (projects && !document.querySelector("#github-evidence")) {
    const section = document.createElement("section");
    section.className = "section github-evidence";
    section.id = "github-evidence";
    section.innerHTML = `<div class="shell"><div class="section-heading heading-visible"><p class="eyebrow"><span>04A</span> LIVE REPOSITORY EVIDENCE</p><h2>Selected work, refreshed from <em>GitHub.</em></h2></div><div class="live-repo-grid" aria-live="polite">${repos.map(([title]) => `<article class="live-repo-card loading"><span>LOADING REPOSITORY</span><h3>${title}</h3><p>Retrieving repository metadata…</p></article>`).join("")}</div></div>`;
    projects.insertAdjacentElement("afterend", section);
    const cards = [...section.querySelectorAll(".live-repo-card")];
    Promise.allSettled(repos.map(([, repo]) => fetch(`https://api.github.com/repos/AzizulHakim00/${repo}`, { headers: { Accept: "application/vnd.github+json" } }).then((response) => {
      if (!response.ok) throw new Error(`GitHub ${response.status}`);
      return response.json();
    }))).then((results) => results.forEach((result, index) => {
      const card = cards[index];
      const [title, repo, caseStudy] = repos[index];
      if (!card) return;
      card.classList.remove("loading");
      if (result.status !== "fulfilled") {
        card.innerHTML = `<span>REPOSITORY LINK</span><h3>${title}</h3><p>Live metadata is temporarily unavailable.</p><a href="https://github.com/AzizulHakim00/${repo}" target="_blank" rel="noreferrer">Open repository ↗</a>`;
        return;
      }
      const data = result.value;
      const updated = data.updated_at ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(data.updated_at)) : "Unknown";
      card.innerHTML = `<span>${data.language || "MULTI-LANGUAGE"}</span><h3>${title}</h3><p>${data.description || "Documented portfolio repository."}</p><dl><div><dt>Stars</dt><dd>${data.stargazers_count ?? 0}</dd></div><div><dt>Forks</dt><dd>${data.forks_count ?? 0}</dd></div><div><dt>Updated</dt><dd>${updated}</dd></div></dl><div class="live-repo-links"><a href="${caseStudy}">Case study →</a><a href="${data.html_url}" target="_blank" rel="noreferrer">GitHub ↗</a></div>`;
    }));
  }

  const panel = document.querySelector(".codeforces-panel");
  if (panel && !panel.querySelector(".codeforces-live")) {
    const live = document.createElement("div");
    live.className = "codeforces-live";
    live.innerHTML = "<span>Loading live profile…</span>";
    panel.appendChild(live);
    Promise.all([
      fetch("https://codeforces.com/api/user.info?handles=heythere99").then((response) => response.json()),
      fetch("https://codeforces.com/api/user.status?handle=heythere99&from=1&count=10000").then((response) => response.json())
    ]).then(([info, status]) => {
      if (info.status !== "OK" || status.status !== "OK") throw new Error("Codeforces API unavailable");
      const profile = info.result[0];
      const accepted = status.result.filter((submission) => submission.verdict === "OK");
      const solved = new Set();
      const tags = new Map();
      accepted.forEach((submission) => {
        const problem = submission.problem || {};
        solved.add(`${problem.contestId || ""}-${problem.index || problem.name || ""}`);
        (problem.tags || []).forEach((tag) => tags.set(tag, (tags.get(tag) || 0) + 1));
      });
      const topTags = [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag);
      live.innerHTML = `<div><strong>${profile.rating ?? "Unrated"}</strong><span>Current rating</span></div><div><strong>${profile.maxRating ?? "—"}</strong><span>Maximum rating</span></div><div><strong>${solved.size}</strong><span>Problems solved*</span></div><p>${topTags.map((tag) => `<b>${tag}</b>`).join("")}</p><small>*Calculated from the latest submissions returned by the public API.</small>`;
    }).catch(() => { live.innerHTML = "<span>Live profile data is temporarily unavailable. Open Codeforces for the current record.</span>"; });
  }

  if (!document.querySelector('script[src^="/assets/js/v3-research.js"]')) {
    const script = document.createElement("script");
    script.src = "/assets/js/v3-research.js?v=20260721-v3";
    script.async = false;
    document.head.appendChild(script);
  }
})();
