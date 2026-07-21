# Azizul Hakim Omor — Research & Software Portfolio

A responsive research, software and cybersecurity portfolio built with Spring Boot 4.1, Java 17, Thymeleaf, HTML, CSS and JavaScript. Spring Boot and Vercel serve the same homepage source, preventing deployment copies from drifting apart.

## Current design direction

The homepage uses the cleaner pre-V3 visual system:

- Cinematic but restrained hero entrance
- Animated network canvas and typing roles
- Spacious project, research and certificate sections
- Subtle pointer spotlights and scroll reveals
- Collapsible archive for smaller coursework projects
- Quick-view project dialogs
- Responsive navigation and reduced-motion accessibility

The dashboard-style terminal, statistics blocks, capability map, live repository dashboard, advanced search panel and research progress dashboard are intentionally not loaded on the homepage.

## Preserved engineering upgrades

- Four dedicated data-driven project case studies:
  - `/projects/taskflow`
  - `/projects/assignment-writer-hire`
  - `/projects/real-madrid-management`
  - `/projects/ice-pentest-lab`
- Project architecture, screenshots, challenges, results and planned improvements
- Spring mail contact endpoint with validation, honeypot protection and rate limiting
- FormSubmit support for the static Vercel deployment
- Canonical metadata, structured Person data, sitemap, robots file and web manifest
- GitHub Actions checks for JavaScript syntax, Spring tests and Lighthouse quality thresholds
- One shared homepage source for Spring Boot and Vercel

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

When the Spring endpoint is not configured, the public Vercel contact form continues to use FormSubmit.

## Deployment

### Render or another JVM host

1. Push the repository to GitHub.
2. Create the service using the included Docker/Render configuration.
3. Add the optional SMTP variables in the host dashboard.
4. Use `/health` for the health check.

### Vercel

Vercel serves the Thymeleaf homepage as static HTML and uses the same assets and case-study renderer as Spring Boot. The `main` branch is connected to production, so pushes to `main` trigger a new deployment.

Routing is defined in `vercel.json`. There is no duplicated Vercel homepage file.

## Automated quality checks

The `Portfolio Quality` workflow runs:

- Node syntax checks for the JavaScript modules
- `./gradlew clean test`
- Lighthouse CI after a main-branch deployment

The thresholds are stored in `lighthouserc.json`.

## Content accuracy

Research drafts are not described as accepted publications. Coursework or reference archives with uncertain authorship remain labeled accordingly. The future-dated CPTE issue date is hidden until the source date is confirmed.

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
- `src/main/resources/static/assets/css/case-study.css`
- `src/main/resources/static/assets/js/app.js`
- `src/main/resources/static/assets/js/project-details.js`
- `src/main/resources/static/assets/js/upgrade.js`
- `src/main/resources/static/assets/js/case-study-data.js`
- `src/main/resources/static/assets/js/case-study.js`
