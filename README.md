# ApplyTrack - Job Application Management System

A full-stack solution built with the MERN stack to help job seekers organize and monitor their employment applications from submission to final decision.

## Project Overview

ApplyTrack provides a centralized platform where users can maintain records of all their job applications, track progress through different hiring stages, and stay on top of follow-ups. The system enforces business rules on both client and server sides to ensure data integrity.

## Core Capabilities

- **Application Logging**: Capture essential details including company information, role specifications, employment type, application timeline, compensation expectations, and personal notes
- **Intelligent ID Generation**: System-generated identifiers following the pattern `JA-XXX-###` with company-specific sequential numbering
- **Workflow Management**: Enforced status transitions mirroring real hiring processes (Applied → Interview → Offer → Accepted/Declined, with Rejection possible at any active stage)
- **Activity Tracking**: Complete audit trail of all status changes with precise timestamps
- **Follow-up Intelligence**: Automated 7-day follow-up calculation with visual indicators for overdue applications
- **Smart Filtering**: Query applications by status or perform case-insensitive company searches
- **Data Validation**: Prevents duplicate active applications for the same company-role combination
- **Controlled Operations**: Edit restrictions, deletion safeguards based on application state

## Technology Stack

- **Client Side**: React 18, React Router DOM, Axios
- **Server Side**: Node.js, Express.js
- **Data Layer**: MongoDB Atlas, Mongoose ODM
- **Styling**: Custom CSS3 with responsive design principles

## Repository Layout

```
project-root/
├── frontend/          # React application
├── backend/           # Express API server
├── screenshots/       # Application screenshots
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn package manager

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your MongoDB connection string
npm run dev
```
Server will run on `http://localhost:5000`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Client will run on `http://localhost:5173`

## REST API Endpoints

| HTTP Method | Route | Purpose |
|-------------|-------|---------|
| `GET` | `/api/applications` | Retrieve all applications with optional status filter and company search. Returns aggregated status counts. |
| `GET` | `/api/applications/:id` | Fetch detailed information for a specific application including full status history. |
| `POST` | `/api/applications` | Submit a new job application. Validates dates, checks for duplicates, generates ID and sets follow-up date. |
| `PUT` | `/api/applications/:id/status` | Transition application status. Only valid transitions are permitted. |
| `PUT` | `/api/applications/:id` | Modify application details (Company, Role, Job Type, Salary, Notes). ID and Applied Date remain immutable. |
| `DELETE` | `/api/applications/:id` | Remove application. Restricted to 'Applied' or terminal states only. |

## Configuration

Add the following to `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
PORT=5000
```

## Visual Documentation

![Main Dashboard](screenshots/home.png)
![New Application Form](screenshots/add-application.png)
![Application Details View](screenshots/application-detail.png)

