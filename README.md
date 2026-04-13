# 🪖 Soldierly Nexus
### Indian Army Task Management System — Module 1: Soldier Tracking

---

## Project Overview

Soldierly Nexus is a full-stack web application built for the Indian Army to manage and track daily soldier activities. The system enables managers (Subedars) to monitor deployment status in real-time, assign tasks, and approve soldier completions through a secure role-based interface.

The core feature is a **live pie chart dashboard** showing how many soldiers are free, on duty, on leave, or pending approval — giving the manager complete situational awareness at a glance.

---

## Roles

### Manager / Subedar
- Approves soldier registrations
- Creates the approved task list
- Assigns tasks to soldiers with time, priority, location and notes
- Views real-time pie chart of deployment status
- Approves or rejects soldier task completion requests
- Monitors all assignments across the unit

### Soldier / Jawan
- Registers himself through the app (starts as pending)
- Logs in only after manager approval
- Picks tasks from manager's approved list and self-assigns
- Sets start and end time for the task
- Marks task as done → goes to pending review
- Manager then approves or rejects

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| TypeScript | Type safety |
| MongoDB + Mongoose | Database |
| JWT + HTTP Cookies | Authentication |
| bcrypt | Password hashing |

### Frontend
| Technology | Purpose |
|---|---|
| React + TypeScript | UI framework |
| Tailwind CSS | Styling |
| Redux Toolkit | State management |
| Axios | HTTP client |
| Recharts | Pie chart & data visualization |
| React Router DOM | Client-side routing |

---

## Project Structure

```
soldierly-nexus/
├── server/
│   └── src/
│       ├── models/
│       │   ├── User.ts
│       │   ├── Task.ts
│       │   └── Assignment.ts
│       ├── controllers/
│       │   ├── auth.ts
│       │   └── manager.ts
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── manager.ts
│       │   └── soldier.ts
│       ├── middlewares/
│       │   └── auth.ts
│       └── index.ts
│
└── client/
    └── src/
        ├── api/
        │   └── axios.ts
        ├── store/
        │   ├── store.ts
        │   └── slices/
        │       ├── authSlice.ts
        │       ├── taskSlice.ts
        │       ├── assignmentSlice.ts
        │       └── soldierSlice.ts
        ├── components/
        │   ├── Layout/
        │   │   ├── Sidebar.tsx
        │   │   ├── Layout.tsx
        │   │   └── ProtectedRoute.tsx
        │   └── ui/
        │       ├── Badge.tsx
        │       └── Modal.tsx
        ├── pages/
        │   ├── Login.tsx
        │   ├── Register.tsx
        │   ├── manager/
        │   │   ├── Dashboard.tsx
        │   │   ├── Soldiers.tsx
        │   │   ├── Tasks.tsx
        │   │   └── Assignments.tsx
        │   └── soldier/
        │       ├── Dashboard.tsx
        │       ├── Tasks.tsx
        │       └── Assignments.tsx
        ├── hooks/
        │   └── index.ts
        └── utils/
            ├── baseUrl.ts
            └── constant.ts
```

---

## API Routes

### Auth — `/api/auth`
| Method | Route | Description | Access |
|---|---|---|---|
| POST | /register | Soldier self-registration | Public |
| POST | /login | Login for all roles | Public |
| POST | /logout | Clear session cookie | Auth |
| GET | /me | Get current logged in user | Auth |

### Manager — `/api/manager`
| Method | Route | Description |
|---|---|---|
| GET | /dashboard | Pie chart + deployment data |
| GET | /soldiers | All soldiers with free/busy status |
| PATCH | /soldiers/:id/approve | Approve pending soldier |
| PATCH | /soldiers/:id/status | Change soldier status |
| POST | /tasks | Create approved task |
| GET | /tasks | Get all tasks |
| PATCH | /tasks/:id | Update task |
| DELETE | /tasks/:id | Deactivate task (soft delete) |
| POST | /assignments | Assign task to soldier |
| GET | /assignments | Get all assignments |
| PATCH | /assignments/:id | Edit assignment |
| PATCH | /assignments/:id/approve | Approve completion |
| PATCH | /assignments/:id/reject | Reject completion |

### Soldier — `/api/soldier`
| Method | Route | Description |
|---|---|---|
| GET | /tasks | Get available tasks list |
| GET | /assignments | Get my assignments |
| POST | /assignments | Self-assign a task |
| PATCH | /assignments/:id/done | Mark task as done |

---

## Assignment Status Flow

```
upcoming → active → pending_review → completed
                                   → rejected (back to active)
```

- **upcoming** — task assigned but start time hasn't come yet
- **active** — task is currently ongoing
- **pending_review** — soldier marked done, waiting for manager
- **completed** — manager approved
- **rejected** — manager rejected, soldier remains on duty

---

## How Soldier Tracking Works

A soldier's status is determined in real-time by this logic:

```
if (assignment.startTime <= NOW && assignment.endTime >= NOW)
  → soldier is BUSY
else
  → soldier is FREE
```

The dashboard auto-refreshes every 60 seconds to keep the pie chart current.

---

## Getting Started

### Prerequisites
- Node.js >= 20
- MongoDB
- npm

### Backend Setup
```bash
cd server
npm install
cp .env.example .env
# fill in MONGODB_URI, JWT_SECRET, PORT
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
# create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm run dev
```

### Create First Manager Account
Since manager registration is not public, create it manually:

1. Register through `/api/auth/register` with any army number
2. Go to MongoDB and update that document:
```json
{
  "role": "manager",
  "status": "active"
}
```
3. Login normally — the system will recognize the manager role

---

## Environment Variables

### Backend `.env`
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
```

---

## Key Features

- **Role-based access** — manager and soldier see completely different interfaces
- **Cookie-based auth** — httpOnly cookies, no token in localStorage
- **Real-time pie chart** — auto-refreshes every 60 seconds
- **Overlap detection** — soldiers can't have two tasks at the same time
- **Soft delete** — tasks are deactivated not deleted, preserving assignment history
- **2-step completion** — soldier marks done → manager approves/rejects
- **Pending badge** — sidebar shows count of soldiers awaiting approval