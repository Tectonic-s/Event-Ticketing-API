# Event Ticketing API — Project Documentation

## Team of 4 — Contribution Breakdown

| Person | Area of Work |
|--------|-------------|
| **Alex** | Project setup, database connection, server entry point |
| **Jordan** | Data models (User, Event, Ticket) |
| **Sam** | Authentication system (register, login, JWT middleware) |
| **Taylor** | Event & ticket controllers, routes, Swagger UI docs |

---

# Alex's Work — Project Setup & Infrastructure

## Files: `server.js`, `app.js`, `config/database.js`, `.env`, `.gitignore`, `.env.example`, `package.json`

---

### What Alex built and why

Alex was responsible for the foundation of the project — the parts that make everything else run. Without this, none of the other team members' code would work.

---

### `server.js` — The Entry Point

```js
const app = require("./app");
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

**What it does:**
This is the file you run to start the whole application (`npm run dev`). It imports the fully configured app and tells it to start listening for requests on port 5050.

**Why it's separate from `app.js`:**
Keeping the server start logic separate from the app setup is a best practice. It makes the app easier to test — you can import `app.js` in tests without actually starting a server.

---

### `app.js` — The App Configuration

```js
const express = require("express");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const connectDB = require("./config/database");
const eventRoutes = require("./routes/eventRoutes");
const authRoutes = require("./routes/authRoutes");

dotenv.config();
const app = express();
app.use(express.json());
connectDB();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/", (req, res) => res.send("API Running..."));
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

module.exports = app;
```

**What it does:**
Sets up the Express app, connects to the database, registers all routes, and mounts Swagger UI. `module.exports = app` is intentionally the last line — everything must be configured before the app is handed to `server.js`.

**A mistake that was fixed here:**
Originally `module.exports = app` was placed in the middle of the file. This meant `server.js` received an app with no routes attached and no database connection. Moving it to the last line fixed this.

**Key rule to remember:**
> Always put `module.exports` as the very last line in `app.js`. Export only after everything is set up.

---

### `config/database.js` — MongoDB Connection

```js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

**What it does:**
Connects the app to MongoDB using the URI stored in `.env`. If the connection fails, `process.exit(1)` shuts the app down immediately — there's no point running an API with no database.

**What is Mongoose?**
Mongoose is a library that lets you interact with MongoDB using JavaScript objects instead of raw database queries. You define the shape of your data (called a schema) and Mongoose handles the rest.

---

### `.env` — Environment Variables

```
PORT=5050
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/eventDB
JWT_SECRET=your_secret_key
```

**What it does:**
Stores sensitive configuration values outside of the code. If you hardcode your database password in the code and push it to GitHub, anyone can access your database. `.env` keeps secrets out of the codebase.

**A mistake that was fixed here:**
The original `MONGO_URI` was missing the cluster subdomain (`u6kzcmv`), causing a DNS error on startup. Always copy the connection string directly from MongoDB Atlas.

---

### `.gitignore` — Protecting Sensitive Files

```
node_modules/
.env
```

**What it does:**
Tells Git to never track these files. `node_modules/` contains thousands of dependency files that don't belong in version control — anyone can recreate it with `npm install`. `.env` contains secrets that must never be pushed to GitHub.

---

### `.env.example` — Template for New Developers

```
PORT=5050
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/<dbname>
JWT_SECRET=<your_secret_key>
```

**What it does:**
Since `.env` is ignored by Git, new team members cloning the project wouldn't know what variables are needed. `.env.example` is a safe placeholder file that gets committed to Git, showing exactly what to fill in.

---

### `package.json` — Project Configuration

**What Alex fixed:**
- `"main"` was pointing to `index.js` which doesn't exist. Changed to `server.js`
- Added `start` and `dev` scripts so the team doesn't have to type long commands

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

Now the whole team just runs `npm run dev` to start the server with auto-restart on file changes.

---

# Jordan's Work — Data Models

## Files: `models/User.js`, `models/Event.js`, `models/Ticket.js`

---

### What Jordan built and why

Jordan designed the data layer — the blueprints for every piece of data stored in MongoDB. Think of models as the structure of your database tables. Every time data is saved or retrieved, it follows these blueprints.

---

### `models/Event.js` — The Event Blueprint

```js
const eventSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  totalSeats:     { type: Number, required: true },
  availableSeats: { type: Number, required: true }
});
```

**What it does:**
Defines what an Event looks like in the database. Every event has a name, a total seat count, and a running count of available seats. `availableSeats` decreases when tickets are booked and increases when tickets are cancelled.

**What is a Schema?**
A schema is like a form template. It says "every document saved in this collection must have these fields, of these types". If you try to save an event without a name, Mongoose will reject it.

---

### `models/Ticket.js` — The Ticket Blueprint

```js
const ticketSchema = new mongoose.Schema({
  ticketCode: { type: String, unique: true },
  event:      { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  status:     { type: String, enum: ["booked", "cancelled"], default: "booked" }
});
```

**What it does:**
Defines what a Ticket looks like. Each ticket has:
- `ticketCode` — a unique human-readable code like `TICKET-911iq6l8c`
- `event` — a reference (link) to the Event it belongs to using the Event's MongoDB ID
- `status` — either `"booked"` or `"cancelled"`, defaults to `"booked"` when created

**What is `ObjectId` and `ref`?**
MongoDB stores every document with a unique `_id` (called an ObjectId). By storing the event's `_id` in the ticket, we create a relationship between the two — like a foreign key in SQL. The `ref: "Event"` tells Mongoose which collection to look in when you want to fetch the full event details.

**What is `enum`?**
`enum` restricts the value to only the options listed. A ticket status can only ever be `"booked"` or `"cancelled"` — anything else will be rejected by Mongoose.

---

### `models/User.js` — The User Blueprint

```js
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
```

**What it does:**
Defines what a User looks like. Each user has a name, a unique email, and a password.

**What is the `pre("save")` hook?**
This is a function that runs automatically before a user is saved to the database. It takes the plain text password and hashes it — scrambles it into an unreadable string using `bcryptjs`. This means even if someone hacks the database, they can't read the passwords.

Example:
```
Plain:  mypassword123
Hashed: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

**What is `matchPassword`?**
A custom method added to every User document. When a user logs in, we can't un-hash the stored password — instead we hash what they typed and compare the two hashes. `bcrypt.compare()` does this safely.

**A bug that was fixed here:**
The original hook was written as `async function(next)` and called `next()` at the end. Mongoose does not pass `next` to async hooks — it waits for the promise to resolve. Calling `next()` on `undefined` caused a `TypeError: next is not a function` crash. The fix was to remove `next` entirely.

---

# Sam's Work — Authentication System

## Files: `controllers/authController.js`, `routes/authRoutes.js`, `middleware/auth.js`

---

### What Sam built and why

Sam built the security layer of the API. Without this, anyone on the internet could create events, book tickets, or delete data. Sam's work ensures that only registered, logged-in users can perform sensitive actions.

---

### `controllers/authController.js` — Register & Login Logic

#### Register

```js
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password });
    res.status(201).json({ message: "User registered", token: generateToken(user._id) });
  } catch (err) {
    next(err);
  }
};
```

**What it does step by step:**
1. Takes `name`, `email`, `password` from the request body
2. Checks if a user with that email already exists — if yes, returns a 400 error
3. Creates the user (the password gets auto-hashed by Jordan's model)
4. Returns a JWT token so the user is immediately logged in after registering

#### Login

```js
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });

    res.json({ message: "Login successful", token: generateToken(user._id) });
  } catch (err) {
    next(err);
  }
};
```

**What it does step by step:**
1. Takes `email` and `password` from the request body
2. Finds the user by email
3. Uses `matchPassword()` (from Jordan's User model) to compare the entered password with the stored hash
4. If everything matches, returns a JWT token

**What is a JWT token?**
JWT stands for JSON Web Token. It's a long encrypted string that proves who you are. Think of it like a wristband at a concert — you get it at the entrance (login) and show it every time you want to access something restricted.

Example token:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0YWJjMTIzIn0.abc123...
```

It contains your user ID encoded inside it. The server can decode it using `JWT_SECRET` to know who you are.

#### generateToken

```js
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
```

Creates a token that contains the user's ID and expires after 7 days. After 7 days the user must log in again.

---

### `middleware/auth.js` — The JWT Guard

```js
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};
```

**What is middleware?**
Middleware is a function that sits between the request and the route handler. It runs first, and only calls `next()` to pass control to the route if everything checks out. Think of it as a bouncer at a door.

**What it does step by step:**
1. Reads the `Authorization` header from the request
2. Checks it starts with `"Bearer "` — the standard format for JWT tokens
3. Extracts the token from `"Bearer <token>"`
4. Verifies the token using `JWT_SECRET` — if tampered with or expired, this throws an error
5. Attaches the decoded user info to `req.user` so route handlers can access it
6. Calls `next()` to let the request through to the actual route

**How to send the token in a request:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**A bug that was fixed here:**
The original `protect` was a regular (non-async) function. Express 5 requires middleware in async chains to be declared as `async` to handle errors correctly. Changing it to `async` fixed a `TypeError: next is not a function` crash.

---

### `routes/authRoutes.js` — Auth Endpoints

```js
router.post("/register", register);
router.post("/login", login);
```

**Routes exposed:**
| Method | URL | What it does |
|--------|-----|-------------|
| POST | `/api/auth/register` | Create account, get token |
| POST | `/api/auth/login` | Log in, get token |

Both routes include Swagger JSDoc comments so they appear in the API docs at `/api-docs`.

---

# Taylor's Work — Event Controllers, Routes & Swagger UI

## Files: `controllers/eventController.js`, `routes/eventRoutes.js`, `config/swagger.js`

---

### What Taylor built and why

Taylor built the core business logic of the API — everything to do with events and tickets. Taylor also set up Swagger UI so the whole team and any future developers can test and explore the API visually in a browser.

---

### `controllers/eventController.js` — The Business Logic

Every function follows the same pattern:
- Wrapped in `try/catch` so errors are handled gracefully
- Calls `next(err)` on failure so Express returns a clean error response instead of crashing

#### createEvent

```js
const createEvent = async (req, res, next) => {
  try {
    const newEvent = new Event({
      name: req.body.name,
      totalSeats: req.body.totalSeats,
      availableSeats: req.body.totalSeats  // starts equal to totalSeats
    });
    await newEvent.save();
    res.json({ message: "Event created", event: newEvent });
  } catch (err) { next(err); }
};
```

Creates a new event. `availableSeats` starts equal to `totalSeats` because no tickets have been booked yet.

---

#### getEvents

```js
const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) { next(err); }
};
```

Returns all events from the database. No auth required — anyone can browse events.

---

#### bookTicket

```js
const bookTicket = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.availableSeats <= 0)
      return res.status(400).json({ message: "No seats available" });

    event.availableSeats -= 1;
    await event.save();

    const ticket = new Ticket({
      ticketCode: "TICKET-" + Math.random().toString(36).substr(2, 9),
      event: event._id
    });
    await ticket.save();
    res.json({ message: "Ticket booked", ticket });
  } catch (err) { next(err); }
};
```

**Step by step:**
1. Finds the event by ID
2. Checks if seats are available
3. Decreases `availableSeats` by 1
4. Generates a unique ticket code like `TICKET-911iq6l8c`
5. Saves the ticket linked to the event
6. Returns the ticket to the user — they use this code to validate or cancel

---

#### cancelTicket

```js
const cancelTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({ ticketCode: req.params.id });
    if (!ticket || ticket.status === "cancelled")
      return res.status(400).json({ message: "Invalid ticket" });

    ticket.status = "cancelled";
    await ticket.save();

    const event = await Event.findById(ticket.event);
    event.availableSeats += 1;
    await event.save();
    res.json({ message: "Ticket cancelled" });
  } catch (err) { next(err); }
};
```

Cancels a ticket by its `ticketCode` and gives the seat back to the event.

**A bug that was fixed here:**
The original code used `Ticket.findById()` which expects a MongoDB ObjectId. But the cancel route receives a `ticketCode` string like `TICKET-911iq6l8c`. This caused a `CastError`. Fixed by switching to `Ticket.findOne({ ticketCode })`.

---

#### validateTicket

```js
const validateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({ ticketCode: req.params.code });
    if (!ticket || ticket.status === "cancelled")
      return res.status(400).json({ valid: false, message: "Invalid ticket" });

    res.json({ valid: true, message: "Ticket is valid", ticket });
  } catch (err) { next(err); }
};
```

Checks if a ticket code is valid and not cancelled. Useful for scanning tickets at the event entrance.

---

#### getEventStats

```js
const getEventStats = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const totalTickets = await Ticket.countDocuments({
      event: req.params.id,
      status: "booked"
    });

    res.json({
      eventName: event.name,
      totalSeats: event.totalSeats,
      availableSeats: event.availableSeats,
      ticketsSold: totalTickets
    });
  } catch (err) { next(err); }
};
```

Returns a summary of an event — how many seats total, how many are left, and how many tickets have been sold.

---

#### deleteEvent

```js
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    await Ticket.deleteMany({ event: req.params.id });
    res.json({ message: "Event deleted" });
  } catch (err) { next(err); }
};
```

Deletes an event and all tickets associated with it. `Ticket.deleteMany()` is important here — without it, old tickets would remain in the database pointing to an event that no longer exists (called orphaned data).

---

### `routes/eventRoutes.js` — All Event Endpoints

| Method | URL | Auth | What it does |
|--------|-----|------|-------------|
| POST | `/api/events` | 🔒 Yes | Create an event |
| GET | `/api/events` | No | Get all events |
| POST | `/api/events/:id/book` | 🔒 Yes | Book a ticket |
| PUT | `/api/events/ticket/:id/cancel` | 🔒 Yes | Cancel a ticket |
| GET | `/api/events/ticket/validate/:code` | No | Validate a ticket |
| GET | `/api/events/:id/stats` | No | Get event stats |
| DELETE | `/api/events/:id` | 🔒 Yes | Delete an event |

---

### `config/swagger.js` — API Documentation Setup

```js
const options = {
  definition: {
    openapi: "3.0.0",
    info: { title: "Event Ticketing API", version: "1.0.0" },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    servers: [{ url: "http://localhost:5050" }]
  },
  apis: ["./routes/*.js"]
};
```

**What is Swagger UI?**
Swagger UI is a webpage that automatically documents your entire API and lets you test it in the browser. Visit `http://localhost:5050/api-docs` while the server is running.

**What is `openapi: "3.0.0"`?**
OpenAPI is the standard format for describing REST APIs. Version 3.0.0 is the current industry standard. Swagger UI reads this format and turns it into a visual interface.

**What is `bearerAuth`?**
This tells Swagger that some routes require a JWT token. Routes with this security scheme show a 🔒 lock icon. Clicking **Authorize** at the top of the Swagger page lets you enter your token once and use it for all protected routes.

**What is `apis: ["./routes/*.js"]`?**
This tells `swagger-jsdoc` to scan all files in the `routes/` folder for JSDoc comments (the `/** @swagger */` blocks above each route). It reads those comments and builds the documentation automatically.

**How Swagger comments work:**
```js
/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of all events
 */
router.get("/", getEvents);
```
The comment sits directly above the route. `swagger-jsdoc` reads it and adds that route to the docs page.

---

# How to Run the Project

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in your values
cp .env.example .env

# 3. Start the development server
npm run dev
```

---

# How to Test with Swagger UI

1. Open `http://localhost:5050/api-docs`
2. Go to `POST /api/auth/register` → click **Try it out** → fill in name, email, password → **Execute**
3. Copy the `token` from the response
4. Click the **Authorize** button at the top of the page
5. Type `Bearer <paste your token here>` → click **Authorize**
6. Now all 🔒 protected routes will work

---

# How to Test with Postman

### Setup
1. New Environment → name it `EventTicketing`
2. Add variable `baseUrl` = `http://localhost:5050`
3. Add variable `token` (leave empty for now)

### Auto-save token
In the **Tests** tab of your register or login request, paste:
```js
pm.environment.set("token", pm.response.json().token);
```
Every login/register will now auto-save the token.

### Set auth on the Collection
Collection → Authorization tab → Type: `Bearer Token` → Token: `{{token}}`
All requests in the collection will inherit this automatically.

### Test order

| Step | Method | URL |
|------|--------|-----|
| 1 | POST | `{{baseUrl}}/api/auth/register` |
| 2 | POST | `{{baseUrl}}/api/auth/login` |
| 3 | POST | `{{baseUrl}}/api/events` |
| 4 | GET | `{{baseUrl}}/api/events` |
| 5 | POST | `{{baseUrl}}/api/events/:id/book` |
| 6 | PUT | `{{baseUrl}}/api/events/ticket/:id/cancel` |
| 7 | GET | `{{baseUrl}}/api/events/ticket/validate/:code` |
| 8 | GET | `{{baseUrl}}/api/events/:id/stats` |
| 9 | DELETE | `{{baseUrl}}/api/events/:id` |

---

# Final Project Structure

```
EventTicketingAPI/
├── config/
│   ├── database.js       — Alex:   MongoDB connection logic
│   └── swagger.js        — Taylor: Swagger/OpenAPI configuration
├── controllers/
│   ├── authController.js — Sam:    Register & login logic
│   └── eventController.js— Taylor: Event & ticket business logic
├── middleware/
│   └── auth.js           — Sam:    JWT token verification guard
├── models/
│   ├── Event.js          — Jordan: Event schema
│   ├── Ticket.js         — Jordan: Ticket schema
│   └── User.js           — Jordan: User schema with password hashing
├── routes/
│   ├── authRoutes.js     — Sam:    /api/auth endpoints + Swagger docs
│   └── eventRoutes.js    — Taylor: /api/events endpoints + Swagger docs
├── .env                  — Alex:   Secret config (never push to GitHub)
├── .env.example          — Alex:   Safe template for new developers
├── .gitignore            — Alex:   Tells Git what to ignore
├── app.js                — Alex:   App setup, middleware, route mounting
├── learning.md           — Team:   This file
├── package.json          — Alex:   Project config and npm scripts
└── server.js             — Alex:   Starts the HTTP server
```
