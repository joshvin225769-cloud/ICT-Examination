# CampusDesk — project definition

Author: Johan Eljo. Institution: Sahrdaya College of Engineering and Technology. Individual project; no deadline specified.

## Scope and measurable goals

Provide one accountable workflow for campus service issues. Students own requests; admins manage the campus queue. MVP includes register/login/logout, ownership-protected CRUD, comments, status history, priority management, search/filter/pagination, and responsive overview screens. Attachments, email, staff assignment, and payments are outside MVP.

Targets: usable at 390px and 1440px with no page-level horizontal scrolling; keyboard-accessible navigation and labelled fields; page size 8 by default, maximum 50; no password hashes or secrets in API responses; no frontend database access; inline validation and explicit retry on fetch failures. Performance is measured during testing rather than claimed in advance.

## Stories and acceptance criteria

| Story | Acceptance criteria |
| --- | --- |
| Register as student | Valid name/email/password creates a student; duplicate email returns 409; supplied admin role is rejected. |
| Sign in and out | Valid credentials create an expiring HttpOnly session; bad credentials return 401; logout clears the cookie. |
| Report an issue | Required title/category/location/description validated on client and server; saved request appears without manual refresh; failed save retains inputs. |
| Track own requests | Student sees only their requests, including dashboard counts; another student's ID cannot be read or edited. |
| Edit or delete open issue | Owner can edit/delete only an open request; confirmation required for delete; non-open requests return 409. |
| Resolve issues as admin | Admin sees all requests; status and priority changes append an activity event; public signup cannot obtain admin access. |
| Follow up | Owner or admin can add nonempty comments; outsiders cannot; actor and date shown. |
| Find requests | Search and category/status filters combine; pagination stays bounded; empty/error/loading states are visible. |

## Architecture

```text
React pages -> services/api.js -> HTTP /api -> Express routes
                                              |
                                    session + validation middleware
                                              |
                                        controllers
                                              |
                                       Mongoose models
                                              |
                                         MongoDB Atlas
```

One same-origin production deployment serves frontend and API; Vite proxies `/api` in development. The browser stores only a short-lived HttpOnly session cookie, with SameSite=Lax and Secure in production. Mutating requests enforce an allowed Origin when an Origin header is present. Backend RBAC and resource ownership are authoritative.

## Wireframes / navigation

```text
DESKTOP (>= 1000px)
+--------------+------------------------------------------------+
| CampusDesk   | Overview                         New request +  |
| Overview     | Welcome / search / filters                     |
| My requests  | [Total] [Open] [In progress] [Resolved]         |
| New request  | Recent requests table   | category breakdown   |
|              |                                                |
| User/logout  | Detail -> description -> updates -> comment    |
+--------------+------------------------------------------------+

MOBILE (390px)
+------------------------+
| CampusDesk     Sign out|
| Overview | Requests | +|
| Heading / action       |
| [Stat] [Stat]          |
| [Stat] [Stat]          |
| Stacked request cards  |
| Filters / pagination   |
+------------------------+
```

Routes: `/login`, `/register`, `/`, `/requests`, `/requests/new`, `/requests/:id`, `/requests/:id/edit`. Protected screens redirect unauthenticated visitors. Admin uses the same layout with a campus-wide queue and resolution controls.

## Data model

**User:** `_id`, `name` (2–80 chars), `email` (unique lowercase indexed), `passwordHash` (excluded by default), `role` (student/admin; student default), `createdAt`, `updatedAt`.

**ServiceRequest:** `_id`, `reference` (unique human-readable ID), `title` (5–120), `description` (15–3000), `category` (IT & Network / Facilities / Academic / Library / Hostel / Other), `location` (3–120), `priority` (Low/Medium/High), `status` (Open/In progress/Resolved/Closed), `owner` (User reference), `activity` (embedded bounded array of actor name/message/type/date), timestamps. Indexes: owner+createdAt, status+createdAt, unique reference. Actors stored as display-name snapshots; activity belongs to its request. Max 200 activity events; further mutations return 409 until an archive strategy exists.

Passwords are bcrypt-hashed. No real personal data is used in the demo. The application collects only display name, email, and request information.

## API contract

Base `/api`. JSON success resources use `{data: ...}`. Errors use `{message, errors?}`. Session endpoints and protected resources never return password hashes.

| Method/path | Input | Success | Errors |
| --- | --- | --- | --- |
| POST /auth/register | name,email,password | 201 user + cookie | 400,409,429 |
| POST /auth/login | email,password | 200 user + cookie | 400,401,429 |
| POST /auth/logout | — | 200 | 403 origin |
| GET /auth/me | session cookie | 200 user | 401 |
| GET /requests | page,limit,search,status,category | 200 data[] + pagination | 400,401 |
| GET /requests/stats | — | 200 scoped counts/categories | 401 |
| POST /requests | title,description,category,location,priority | 201 request | 400,401 |
| GET /requests/:id | ObjectId | 200 request | 400,401,404 |
| PATCH /requests/:id | same content fields, owner, Open only | 200 request | 400,401,403,404,409 |
| PATCH /requests/:id/status | status,priority; admin only | 200 request | 400,401,403,404,409 |
| POST /requests/:id/comments | message | 201 request | 400,401,404,409 |
| DELETE /requests/:id | owner, Open only | 200 | 400,401,403,404,409 |
| GET /health | — | 200 ready / 503 database unavailable | — |

Student resource lookups are scoped by owner and return 404 for inaccessible IDs. Admins can read any request and update its status/priority, but cannot rewrite or delete a student's original report.

## Delivery milestones

1. Brief/repository; 2. backend/schema/auth; 3. frontend/integration; 4. API/browser tests; 5. report/screenshots; 6. hosting/live verification. Report outcomes must reflect observed evidence; no invented benchmark or live link.
