# Azizul Hakim Omor — Portfolio V3

A responsive research, software and cybersecurity portfolio built with Spring Boot 4.1, Java 17, Thymeleaf, HTML, CSS and JavaScript. The same homepage source is served by both Spring Boot and Vercel, preventing deployment copies from drifting apart.

## Portfolio V3 highlights

- Cinematic hero entrance, network canvas, typing roles and technical terminal panel
- Persistent light/dark theme with reduced-motion accessibility
- Interactive capability map connecting skills to project and research evidence
- Advanced project search and filters for web, Java, mobile, security and database work
- Four dedicated data-driven case studies with clean URLs:
  - `/projects/taskflow`
  - `/projects/assignment-writer-hire`
  - `/projects/real-madrid-management`
  - `/projects/ice-pentest-lab`
- Project architecture diagrams, screenshots, engineering challenges, results and next steps
- Live GitHub repository cards with safe fallbacks when API limits are reached
- Live Codeforces rating, solved-problem estimate and common tags from the public API
- Research workflow visualization and expandable research abstracts
- Spring mail contact endpoint with validation, honeypot protection and per-address rate limiting
- Automatic FormSubmit fallback for the static Vercel deployment
- Canonical metadata, structured Person data, sitemap, robots file and web manifest
- GitHub Actions checks for JavaScript syntax, Spring tests and Lighthouse quality thresholds

The portfolio intentionally contains no tutor, teacher, teaching, employment, professional-experience or CGPA claims.

## Run locally

Requirements: Java 17 or newer.

```bash
./gradlew bootRun
```

On Windows:

```powershell
.\gradlew.bat bootRun
```

Open `http://localhost:8080`.

## Build the production JAR

```bash
./gradlew clean test bootJar
java -jar build/libs/azizul-hakim-omor-portfolio-1.0.0.jar
```

## Contact email configuration

The Spring application can send email through SMTP. Keep credentials in hosting environment variables, never in GitHub.

```text
PORTFOLIO_CONTACT_ENABLED=true
PORTFOLIO_CONTACT_RECIPIENT=mdomor01815@gmail.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_AUTH=true
SMTP_STARTTLS=true
```

When these values are missing or the Spring endpoint is unavailable, the browser automatically uses the hosted FormSubmit flow. FormSubmit must be activated once from the recipient inbox.

## Deployment

### Render or another JVM host

1. Push the repository to GitHub.
2. Create the service using the included Docker/Render configuration.
3. Add the optional SMTP variables in the host dashboard.
4. Use `/health` for the health check.

### Vercel

Vercel serves the Thymeleaf homepage file as static HTML and serves the same static assets and case-study page used by Spring Boot. The `main` branch is connected to production, so pushes to `main` trigger a new deployment.

The routing is defined in `vercel.json`. There is no longer a duplicated `vercel-static/index.html` homepage.

## Automated quality checks

The `Portfolio Quality` workflow runs:

- Node syntax checks for the main JavaScript modules
- `./gradlew clean test`
- Lighthouse CI against the production homepage and selected case studies after a main-branch push

The thresholds are stored in `lighthouserc.json`.

## Content accuracy

Research drafts are not described as accepted publications. Coursework/reference archives with uncertain or different authorship remain labeled accordingly. The future-dated CPTE issue date is hidden in the deployed interface until the source date is confirmed.

## Public-download policy

- Project source ZIPs, coursework archives and private reports are not included in deployable assets.
- Project screenshots and concise case-study descriptions remain visible.
- TaskFlow, Real Madrid, Assignment Writer Hire and ICE Lab use direct repository links.
- The corrected CV PDF and certificate PDFs remain public portfolio evidence.

## Main source files

- `src/main/java/com/azizulportfolio/portfolio/PortfolioApplication.java`
- `src/main/java/com/azizulportfolio/portfolio/controller/PortfolioController.java`
- `src/main/resources/templates/index.html`
- `src/main/resources/static/projects/index.html`
- `src/main/resources/static/assets/css/style.css`
- `src/main/resources/static/assets/css/upgrade.css`
- `src/main/resources/static/assets/css/v3.css`
- `src/main/resources/static/assets/css/case-study.css`
- `src/main/resources/static/assets/js/app.js`
- `src/main/resources/static/assets/js/project-details.js`
- `src/main/resources/static/assets/js/v3-foundation.js`
- `src/main/resources/static/assets/js/v3-live.js`
- `src/main/resources/static/assets/js/v3-contact.js`
- `src/main/resources/static/assets/js/case-study-data.js`
- `src/main/resources/static/assets/js/case-study.js`
