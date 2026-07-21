# Azizul Hakim Omor — Spring Boot Portfolio

A responsive research and software portfolio built with Spring Boot 4.1, Java 17, Thymeleaf, HTML, CSS and JavaScript. The repository also includes a visually matching static Vercel deployment.

## Included sections

- Cinematic hero entrance with animated network canvas, typing roles and portrait system
- Scroll-linked section headings and reduced-motion accessibility
- About, technical toolkit and education
- Filterable featured-project gallery with pointer spotlights and smooth layout transitions
- Collapsible project archive for smaller coursework projects
- Detailed project dialogs with screenshots, technology stacks and verified links
- TaskFlow full-stack Django case study with its Render deployment and repository
- Featured Dual-Band research, Thyro-RIFT and DhakaStreetPlastic entries
- Expandable research abstracts and honest status labels
- ICE penetration-testing lab and cybersecurity certificates
- Email, GitHub, LinkedIn, Codeforces, Instagram and Facebook links
- Validated contact form using FormSubmit
- Responsive mobile navigation, lazy image loading and reduced-motion support

The site intentionally contains no tutor, teacher, teaching, employment, professional-experience or CGPA claims.

## Run locally

Requirements: Java 17 or newer. The Gradle wrapper downloads the matching Gradle distribution and dependencies on the first run.

```bash
./gradlew bootRun
```

Open `http://localhost:8080`.

On Windows:

```powershell
.\gradlew.bat bootRun
```

## Build the production JAR

```bash
./gradlew clean test bootJar
java -jar build/libs/azizul-hakim-omor-portfolio-1.0.0.jar
```

## Deploy the genuine Spring Boot application

### Render

1. Push the project to GitHub.
2. In Render, create a new Blueprint and select the repository.
3. Render reads `render.yaml` and builds the supplied `Dockerfile`.
4. The health check is available at `/health`.

The same Dockerfile can be used on Railway, Fly.io or another JVM/Docker host.

### Vercel

Vercel does not run the long-lived Spring Boot JVM application. This project therefore includes `vercel-static/index.html` and `vercel.json`, which deploy a matching static edition on Vercel while preserving the genuine Spring Boot source for a JVM host.

1. Import the repository into Vercel.
2. Choose **Other** as the framework preset.
3. Deploy with the included `vercel.json`.

The `main` branch is connected to the Vercel production project. Every push to `main` triggers a production redeployment, while pushes to other branches create preview deployments.

The Spring Boot and static Vercel editions use FormSubmit's standard HTML POST flow. This avoids browser cross-origin AJAX failures and redirects visitors back to the portfolio after submission.

## Contact-form activation

1. Deploy the portfolio.
2. Send one test message through the contact form.
3. Open `mdomor01815@gmail.com` and confirm the FormSubmit activation email.
4. Submit the test again. Future messages will arrive in that Gmail inbox.

If the activation message is not visible, check the Spam and Promotions folders.

## Content accuracy

The supplied CV included teaching, tutoring, assistant-lecturer, experience and CGPA claims that the owner explicitly said were false or should be hidden. The portfolio uses the corrected CV in `src/main/resources/static/assets/downloads/Azizul_Hakim_Omor_CV_2026.pdf` instead.

Research drafts are not described as accepted publications. Coursework/reference archives with uncertain or different authorship are labeled accordingly. See `CONTENT_AUDIT.md` for the source-by-source audit.

The CPTE issue date shown in the source material is future-dated relative to July 21, 2026. The deployed interface hides that date and marks it as pending verification until the certificate date is confirmed.

## Public-download policy

- Project source ZIPs, coursework archives, UI reports, lab reports and the DhakaStreetPlastic full report are not included in deployable assets.
- Project screenshots and concise case-study descriptions remain visible.
- TaskFlow, Real Madrid, Assignment Writer Hire and ICE Lab use direct repository links; TaskFlow also links to its live Render application.
- The corrected CV PDF and certificate PDFs remain public portfolio evidence. The editable CV DOCX is not published.

## Main source files

- `src/main/java/com/azizulportfolio/portfolio/PortfolioApplication.java`
- `src/main/java/com/azizulportfolio/portfolio/controller/PortfolioController.java`
- `src/main/resources/templates/index.html`
- `src/main/resources/static/assets/css/style.css`
- `src/main/resources/static/assets/css/upgrade.css`
- `src/main/resources/static/assets/js/app.js`
- `src/main/resources/static/assets/js/upgrade.js`
