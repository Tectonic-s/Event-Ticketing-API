# 🎟️ Event Ticketing API

A fast, secure REST API for managing events and tickets — built with Node.js, Express, and MongoDB.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat&logo=swagger&logoColor=black)

---

## Features

- User registration and login with JWT authentication
- Create, view, and delete events
- Book and cancel tickets with real-time seat tracking
- Ticket validation by unique ticket code
- Event statistics — seats sold, available, and total
- Swagger UI for live API exploration and testing
- Secure routes protected against unauthorized access

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcryptjs |
| Docs | Swagger UI (OpenAPI 3.0) |
| Dev Tool | Nodemon |

---

## Getting Started

### Prerequisites
- Node.js v18+
- A MongoDB Atlas account and cluster

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/event-ticketing-api.git
cd event-ticketing-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Fill in your `.env`:
```
PORT=5050
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/eventDB
JWT_SECRET=your_secret_key
```

```bash
# Start the development server
npm run dev
```

---

## API Documentation

Swagger UI is available at:
```
http://localhost:5050/api-docs/
```

All routes are documented with request/response examples. Protected routes show a 🔒 lock icon — click **Authorize** and enter your Bearer token to test them.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user, returns JWT |
| POST | `/api/auth/login` | Login, returns JWT |

### Events
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | No | Get all events |
| POST | `/api/events` | 🔒 | Create a new event |
| DELETE | `/api/events/:id` | 🔒 | Delete event and its tickets |
| GET | `/api/events/:id/stats` | No | Get event statistics |

### Tickets
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/events/:id/book` | 🔒 | Book a ticket for an event |
| PUT | `/api/events/ticket/:id/cancel` | 🔒 | Cancel a ticket by ticket code |
| GET | `/api/events/ticket/validate/:code` | No | Validate a ticket |

---

## Project Structure

```
EventTicketingAPI/
├── config/
│   ├── database.js        — MongoDB connection
│   └── swagger.js         — Swagger/OpenAPI config
├── controllers/
│   ├── authController.js  — Register & login logic
│   └── eventController.js — Event & ticket logic
├── middleware/
│   └── auth.js            — JWT protection middleware
├── models/
│   ├── Event.js           — Event schema
│   ├── Ticket.js          — Ticket schema
│   └── User.js            — User schema with password hashing
├── routes/
│   ├── authRoutes.js      — Auth endpoints
│   └── eventRoutes.js     — Event endpoints
├── .env.example           — Environment variable template
├── app.js                 — App configuration
└── server.js              — Server entry point
```

---

## Security

- Passwords hashed with `bcryptjs` before storage
- JWT tokens expire after 7 days
- All state-changing routes require a valid Bearer token
- Sensitive config stored in `.env`, never committed to version control

---

## Scripts

```bash
npm run dev    # Start with nodemon (auto-restart)
npm start      # Start normally
```
