# 🎟️ Event Ticketing API

> A production-grade RESTful API engineered for high-throughput event management and secure ticket lifecycle operations — built on a modern Node.js/Express 5 stack with MongoDB Atlas persistence and stateless JWT authentication.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger_UI-85EA2D?style=flat&logo=swagger&logoColor=black)
![License](https://img.shields.io/badge/license-ISC-blue)

---

## Overview

The Event Ticketing API provides a fully documented, secure, and scalable backend service for managing events and their associated ticket inventory. It exposes a clean RESTful interface with token-gated write operations, real-time seat availability tracking, and an interactive Swagger UI for rapid integration and testing.

Designed with separation of concerns at its core — controllers, models, middleware, and routes are fully decoupled, making the codebase maintainable, testable, and extensible.

---

## Architecture

```
Client Request
     │
     ▼
Express Router
     │
     ▼
JWT Middleware (protect) ── 401 Unauthorized
     │
     ▼
Controller (Business Logic)
     │
     ▼
Mongoose ODM
     │
     ▼
MongoDB Atlas
```

---

## Feature Set

- **Stateless Authentication** — JWT-based auth with bcrypt password hashing, token expiry, and Bearer scheme enforcement
- **Event Lifecycle Management** — Full CRUD operations on events with atomic seat inventory tracking
- **Ticket Operations** — Book, cancel, and validate tickets with unique code generation and status state machine
- **Real-time Seat Tracking** — `availableSeats` is atomically updated on every booking and cancellation
- **Orphan Prevention** — Cascading delete removes all associated tickets when an event is deleted
- **Interactive API Docs** — Swagger UI with OpenAPI 3.0 spec, live request execution, and Bearer token authorization
- **Environment Isolation** — All secrets managed via `.env`, never committed to version control
- **Express 5 Compatible** — Full async/await error propagation with `next(err)` throughout the middleware chain

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js v18+ | JavaScript server runtime |
| Framework | Express 5 | HTTP routing and middleware pipeline |
| ODM | Mongoose | MongoDB schema modeling and query abstraction |
| Database | MongoDB Atlas | Cloud-hosted NoSQL document store |
| Auth | jsonwebtoken | Stateless JWT generation and verification |
| Encryption | bcryptjs | Password hashing with salt rounds |
| Docs | swagger-ui-express + swagger-jsdoc | OpenAPI 3.0 spec generation and UI |
| Dev | Nodemon | Hot-reload development server |

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas cluster (free tier works)

### Installation

```bash
git clone https://github.com/your-username/event-ticketing-api.git
cd event-ticketing-api
npm install
cp .env.example .env
```

Configure `.env`:
```env
PORT=5050
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/eventDB
JWT_SECRET=your_super_secret_key
```

```bash
npm run dev
```

---

## API Reference

### Base URL
```
http://localhost:5050
```

### Interactive Docs
```
http://localhost:5050/api-docs/
```

---

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | ─ | Register user, receive JWT |
| `POST` | `/api/auth/login` | ─ | Authenticate user, receive JWT |

**Register Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Token Response:**
```json
{
  "message": "User registered",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Event Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/events` | ─ | Retrieve all events |
| `POST` | `/api/events` | 🔒 JWT | Create a new event |
| `DELETE` | `/api/events/:id` | 🔒 JWT | Delete event + cascade tickets |
| `GET` | `/api/events/:id/stats` | ─ | Retrieve event statistics |

---

### Ticket Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/events/:id/book` | 🔒 JWT | Book a ticket, decrement seat count |
| `PUT` | `/api/events/ticket/:id/cancel` | 🔒 JWT | Cancel ticket, restore seat count |
| `GET` | `/api/events/ticket/validate/:code` | ─ | Validate ticket by unique code |

---

## Authentication Flow

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are issued on register/login and expire after **7 days**.

---

## Data Models

### Event
```js
{
  name:           String  // required
  totalSeats:     Number  // required
  availableSeats: Number  // decrements on book, increments on cancel
}
```

### Ticket
```js
{
  ticketCode: String    // unique, e.g. "TICKET-9f3kx2a"
  event:      ObjectId  // ref → Event
  status:     String    // enum: ["booked", "cancelled"]
}
```

### User
```js
{
  name:     String  // required
  email:    String  // required, unique
  password: String  // bcrypt hashed, never stored in plain text
}
```

---

## Project Structure

```
EventTicketingAPI/
├── config/
│   ├── database.js        — MongoDB connection with graceful failure
│   └── swagger.js         — OpenAPI 3.0 spec with bearerAuth scheme
├── controllers/
│   ├── authController.js  — Register/login with JWT issuance
│   └── eventController.js — Full event and ticket business logic
├── middleware/
│   └── auth.js            — Async JWT verification middleware
├── models/
│   ├── Event.js           — Event schema with seat tracking
│   ├── Ticket.js          — Ticket schema with status state machine
│   └── User.js            — User schema with pre-save bcrypt hook
├── routes/
│   ├── authRoutes.js      — /api/auth with OpenAPI annotations
│   └── eventRoutes.js     — /api/events with OpenAPI annotations
├── .env.example           — Environment variable contract
├── app.js                 — Middleware pipeline and route mounting
├── package.json           — Dependency manifest and npm scripts
└── server.js              — HTTP server bootstrap
```

---

## Scripts

```bash
npm run dev    # Nodemon dev server with hot reload
npm start      # Production server
```

---

## Security Considerations

-Passwords are securely hashed using bcrypt before being stored in the database.

-Authentication is handled using JWT tokens with a 7-day expiration.

-Protected routes are secured using middleware to ensure only authorized users can perform certain actions.

-Sensitive data such as database credentials and secret keys are stored in environment variables and excluded from version control.

-All database operations are performed using Mongoose, ensuring structured and safe interaction with MongoDB.
