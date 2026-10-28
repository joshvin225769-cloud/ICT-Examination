# CampusDesk

**A clearer path from campus issue to resolution.** Individual MERN capstone by **Johan Eljo**, Sahrdaya College of Engineering and Technology, for the ICT Academy of Kerala Full Stack Application Development with ReactJS internship.

## Problem and users

Campus maintenance and service issues reported through scattered messages lack a single place to track responsibility, updates, and resolution. Students need visibility into their own requests; campus administrators need a prioritised work queue.

Students register, submit and track their own requests, edit open requests, add follow-up comments, and delete open requests. Administrators review all requests, set priority, and move requests through the resolution workflow. Administrator accounts are provisioned server-side, never through public registration.

## MVP and design

- Authentication with hashed passwords and expiring HttpOnly cookie sessions.
- Server-enforced role and ownership checks.
- Request CRUD with category, location, description, priority, timestamps, and activity history.
- Search, filters, pagination, overview counts, and category distribution.
- Responsive dashboard, request list, request form, request detail, sign-in and registration screens.
- Central API service, form validation, accessible labels, and loading/empty/error/retry states.

Later: email notifications, file attachments, staff assignment, password reset, and multi-campus support.

Architecture, acceptance criteria, wireframes, data model, and API contract: [Project brief](docs/PROJECT_BRIEF.md). Test evidence: [Testing](docs/TESTING.md). Deployment: [Deployment guide](docs/DEPLOYMENT.md).

![CampusDesk student dashboard](docs/screenshots/04-student-dashboard.png)

## Stack and structure

React + Vite + React Router; Node.js + Express; MongoDB Atlas + Mongoose; bcrypt password hashing; JWT session cookies; custom responsive CSS and Lucide icons.

```text
client/src/  components/, context/, pages/, services/
server/src/  config/, controllers/, middleware/, models/, routes/
server/test/ API integration tests
scripts/     browser verification and report generation
docs/        project brief, test evidence, deployment guide, report, screenshots
```

## Run locally

Requires Node.js 22+ and a MongoDB Atlas database (or local MongoDB).

1. `npm install` at repository root.
2. Copy `server/.env.example` to `server/.env`. Set `MONGODB_URI` and a random `JWT_SECRET` of at least 32 characters. Set a private initial admin email/password if you need administrator access.
3. Copy `client/.env.example` to `client/.env` if using a separate API origin. The default `/api` uses Vite's local API proxy.
4. `npm run dev` starts the API at port 5000 and the UI at http://localhost:5173.
5. Register a student in the UI. The optional initial administrator is created at server startup.

Generate a session secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Never put credentials in the repository or frontend configuration.

## Build and test

```sh
npm run build
npm test
npx playwright install chromium
npm run test:browser
```

API tests use an isolated temporary MongoDB process; no Atlas credentials are required. The first run downloads the MongoDB binary. Browser checks use a temporary database and synthetic demonstration data, exercise student/admin flows, and capture desktop/mobile screenshots. They are not a substitute for live deployment checks.

To serve the production build locally, set production-ready server variables, run `npm run build`, then `npm start`. Express serves `client/dist` with a client-side route fallback.

## Submission status

- Repository: https://github.com/johanisdone/assignment4
- Hosted application: **pending authenticated hosting setup and production Atlas configuration**.
- [Internship report PDF](docs/report/CampusDesk_Internship_Report_Johan_Eljo.pdf)
- [Editable report DOCX](docs/report/CampusDesk_Internship_Report_Johan_Eljo.docx)
- [Report Markdown](docs/report/CampusDesk_Internship_Report_Johan_Eljo.md)
- [Screenshot gallery](docs/SCREENSHOTS.md): 13 major desktop/mobile views.
- Verified locally: 16 API scenarios and 15 browser scenarios passed; zero axe findings on the 13 captured screens for selected rules. See timestamped evidence files.
- Repository public visibility confirmed using the unauthenticated GitHub API on 26 October 2026.
- Live-site core-flow verification: pending deployment.

To regenerate the report after updating deployment details in `docs/submission.json`:

```sh
python -m pip install -r scripts/requirements-report.txt
npm run report
```

The generator requires existing API/browser evidence and screenshots. The report follows the supplied ICTAK Summer Internship Report outline and includes the actual architecture, API, test findings, and client views.

## Limitations and privacy

No real student records are included. Screenshots use fictional data. The MVP does not provide email verification, password reset, attachments, staff assignment, or institutional single sign-on. Session revocation on password change and distributed rate-limit storage would be required for a larger production deployment. List pages are bounded to 50 records, but dashboard aggregation and regex search would need profiling/index strategy as volume grows. Hosting availability and Atlas backup options depend on the chosen plan.

See `.env.example` files for variable names and `docs/DEPLOYMENT.md` for production setup. Report findings distinguish verified local results from pending hosted validation.
