# Job Application Tracker

A MERN stack web application for job seekers to track job applications through different stages.

## Features

- Add job applications with company name, job role, job type, applied date, expected salary, and notes
- Auto-generated Application ID (JA-XXX-### format)
- Status workflow with valid transitions
- Status history timeline
- Auto follow-up date (7 days after applied date) with overdue badge
- Duplicate prevention for active applications
- Filter by status and search by company
- Edit applications (except ID and applied date)
- Delete applications with rules (only Applied or final status, not Interview/Offer)

## Tech Stack

- **Frontend**: React.js, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose

## Project Structure

```
project-root/
├── frontend/
└── backend/
```

## Setup Instructions

### Backend

1. Navigate to backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Create `.env` file based on `.env.example` and add your MongoDB URI
4. Start the server: `npm run dev` (runs on port 5000)

### Frontend

1. Navigate to frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev` (runs on port 5173)

## APIs Created

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/applications` | Get all applications with filters (status, search) and counts |
| GET | `/api/applications/:id` | Get a single application by ID |
| POST | `/api/applications` | Create a new application |
| PUT | `/api/applications/:id/status` | Update application status |
| PUT | `/api/applications/:id` | Update application details |
| DELETE | `/api/applications/:id` | Delete an application |

## Screenshots

![Home Page](screenshots/home.png)
![Add Application](screenshots/add-application.png)
![Application Details](screenshots/application-detail.png)

## Environment Variables

Create a `.env` file in the backend directory with:
```
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=5000
```
