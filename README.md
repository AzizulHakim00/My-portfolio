# Azizul Hakim Omor — Spring Boot Portfolio

A complete responsive portfolio built with Spring Boot 4.1, Java 17, Thymeleaf, HTML, CSS and JavaScript. Its single-page information architecture is inspired by the supplied reference portfolio, while its visual system, writing, content, motion and assets are original to Azizul Hakim Omor.

## Included sections

- Hero with animated network canvas, typing roles and portrait
- About, technical toolkit and education
- Filterable project gallery with supplied screenshot carousels and verified links
- Dedicated ICE penetration-testing lab and emphasized cybersecurity capability
- Research section with abstract-only pending works, upcoming cases and honest status labels
- Dual-band sensor and DhakaStreetPlastic image galleries
- Verified 25-page PDF conversion of the DhakaStreetPlastic DOCX report
- Certificate gallery and full-size document lightbox
- Email, GitHub, LinkedIn, Codeforces, Instagram and Facebook links
- Validated contact form with direct email handoff
- Responsive mobile navigation and reduced-motion accessibility

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

Vercel does not run the long-lived Spring Boot JVM application. This project therefore includes `vercel-static/index.html` and `vercel.json`, which deploy a visually identical static edition on Vercel while preserving the genuine Spring Boot source for a JVM host.

1. Import the repository into Vercel.
2. Choose **Other** as the framework preset.
3. Deploy with the included `vercel.json`.

On the static Vercel edition, the contact form opens the visitor's email app. On Spring Boot, the same form also validates through `/api/contact` before opening email.

## Content accuracy

The supplied CV included teaching, tutoring, assistant-lecturer, experience and CGPA claims that the owner explicitly said were false or should be hidden. The portfolio uses the corrected CV in `src/main/resources/static/assets/downloads/Azizul_Hakim_Omor_CV_2026.pdf` instead.

Research drafts are not described as accepted publications. Coursework/reference archives with uncertain or different authorship are labeled accordingly. See `CONTENT_AUDIT.md` for the source-by-source audit.

Thyro-RIFT and the Dual-Band Metamaterial Sensor are marked **Pending for acceptance** and expose only their abstracts plus verified GitHub links. EdgeTHz-Cal, MIRAGE and BAG-ProNet-RQ are marked **Upcoming** with no abstract or repository link. Only Real Madrid has a verified project repository URL; Assignment Writer Hire temporarily links to the verified GitHub profile until its exact repository URL is supplied.

## Main source files

- `src/main/java/com/azizulportfolio/portfolio/PortfolioApplication.java`
- `src/main/java/com/azizulportfolio/portfolio/controller/PortfolioController.java`
- `src/main/resources/templates/index.html`
- `src/main/resources/static/assets/css/style.css`
- `src/main/resources/static/assets/js/app.js`
