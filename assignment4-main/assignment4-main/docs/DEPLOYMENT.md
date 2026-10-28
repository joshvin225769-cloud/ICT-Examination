# Deployment — one origin, three MERN layers

## Current status

The production build and local end-to-end flows are verified. A production MongoDB Atlas database and an authenticated hosting deployment are still required. No hosted URL is claimed in the report until the live site has been tested.

## Suggested path: Render web service + MongoDB Atlas

1. Sign in to MongoDB Atlas. Create a project/cluster and a dedicated database user with read/write permission limited to `campusdesk`. Copy the application's connection string and include `/campusdesk` before its query string. Percent-encode reserved characters in the password.
2. Sign in to Render and connect the public `johanisdone/assignment4` repository. Use the included `render.yaml` Blueprint, or create a Node web service manually. Verify the provider's current free-tier availability and limits before choosing a plan.
3. Build command: `npm ci --include=dev && npm run build`. Start command: `npm start`. Use Node 22+. Health check: `/api/health`. Root directory: repository root.
4. Set production environment variables in the hosting dashboard:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Private Atlas connection string |
| `JWT_SECRET` | Private random 32+ character secret; Blueprint generates one |
| `CLIENT_ORIGIN` | Your exact HTTPS Render origin, with no trailing slash |
| `TRUST_PROXY` | `1` for Render's reverse-proxy setup; verify if using a different host |
| `ADMIN_NAME` | Display name of the initial administrator |
| `ADMIN_EMAIL` | Private initial admin email |
| `ADMIN_PASSWORD` | Private initial admin password, at least 12 characters, at most 72 UTF-8 bytes |

The host sets `PORT`. The frontend defaults to `/api`, so its requests remain on the same HTTPS origin. Do not deploy frontend and backend on unrelated domains with the default SameSite cookie settings. For that architecture, explicitly redesign cookie, CORS, and CSRF settings first.

5. In Atlas Network Access, allow the host's documented outbound IP/range. For local development allow your local IP. Avoid permanent unrestricted access where provider networking permits narrower access.
6. Deploy. Database connection must succeed before the process starts listening. Inspect host logs for startup or validation errors.
7. Once the initial administrator is created, remove `ADMIN_PASSWORD` from the host environment; remove both `ADMIN_EMAIL` and `ADMIN_NAME` as well if bootstrap is no longer needed. Leaving only `ADMIN_EMAIL` without a password makes bootstrap validation fail. Existing account passwords are never silently overwritten.
8. Register a fictional student and run the live checklist below. Do not upload actual student records for evaluation.

## Live acceptance checklist — pending

- [ ] Landing/sign-in page loads over HTTPS and has no browser errors.
- [ ] Register, sign in, refresh, and sign out work with Secure session cookies.
- [ ] Student creates a request and sees it after refreshing.
- [ ] Edit, comment, delete-open, filters, and pagination work on persisted Atlas data.
- [ ] Student A cannot access Student B's request via a copied URL or direct API call.
- [ ] Administrator sees the campus queue and changes status/priority.
- [ ] Student sees that update and cannot edit a non-open request.
- [ ] Refresh `/requests/:id` directly; SPA fallback returns the app.
- [ ] Test 390px mobile navigation and keyboard-only form submission.
- [ ] No API request targets localhost; no secrets appear in source or screenshots.
- [ ] Record the live URL, update `docs/submission.json`, regenerate report, and attach final screenshots if production differs.

## Operations and recovery

Rate limiting is in-process; use an external shared store before scaling across multiple instances. Free web services may sleep. Keep an eye on cold-start delays, server logs, and Atlas storage limits. Atlas backup/restore features vary by plan; confirm your selected plan's capabilities. Before important migrations use an appropriate database export/backup and verify restoration in a separate database. Do not claim backups are enabled unless configured.

If startup fails, check missing environment variables, Atlas credentials, URI encoding, and network allowlists. If browser writes return 403, compare `CLIENT_ORIGIN` with the exact URL shown in the browser. If cookies are absent, check HTTPS and proxy settings.
