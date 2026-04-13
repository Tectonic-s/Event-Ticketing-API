# Learning.md — What We Fixed & Why

This file explains every change made to the EventTicketingAPI project in simple terms.
Great for beginners who want to understand what went wrong and how it was fixed.

---

## 1. The Wrong MongoDB URL (`.env`)

**File:** `.env`

**What was wrong:**
The database connection URL was missing a part of the address. It looked like:
```
cluster0.mongodb.net
```
But the real address from MongoDB Atlas was:
```
cluster0.u6kzcmv.mongodb.net
```
That `u6kzcmv` part is a unique ID for your specific cluster. Without it, the app couldn't find the database — like trying to send a letter with an incomplete address.

**Fix:** Updated `MONGO_URI` in `.env` with the correct full address from MongoDB Atlas.

---

## 2. Code Running in the Wrong Order (`app.js`)

**File:** `app.js`

**What was wrong:**
In Node.js, `module.exports` is the line that says *"here is what I'm sharing with other files"*. The problem was that `module.exports = app` was placed in the middle of the file. The lines after it (registering routes and connecting to the database) still ran, but by the time `server.js` received the app, those things hadn't happened yet.

Think of it like handing someone a sandwich before you've added the filling.

**Fix:** Moved all `require()` calls to the top, called `connectDB()` and registered routes before `module.exports`, and put `module.exports = app` as the very last line.

**Correct order:**
```
1. require() all dependencies
2. dotenv.config()
3. create the app
4. connect to database
5. register routes
6. module.exports = app  ← always last
```

---

## 3. A Stray Letter Crashing the App (`eventController.js`)

**File:** `controllers/eventController.js`

**What was wrong:**
There was a random letter `s` at the very end of the file, making the last line look like `};s` instead of `};`. JavaScript didn't know what `s` meant and crashed with:
```
ReferenceError: s is not defined
```

**Fix:** Removed the stray `s`.

---

## 4. A Function Defined After It Was Exported (`eventController.js`)

**File:** `controllers/eventController.js`

**What was wrong:**
The `getEventStats` function was written *after* the `module.exports` line. This means it was never included in the exports. When `eventRoutes.js` tried to use it, it got `undefined` — causing a crash.

Think of it like putting items in a box, sealing it, and then trying to add more items. The extra items never make it in.

**Fix:** Moved `getEventStats` above `module.exports` and added it to the exports list:
```js
module.exports = { createEvent, getEvents, bookTicket, cancelTicket, validateTicket, getEventStats };
```

---

## 5. Missing Import in Routes (`eventRoutes.js`)

**File:** `routes/eventRoutes.js`

**What was wrong:**
`getEventStats` was being used in the routes file but was never imported. It's like trying to use a tool you never took out of the toolbox.

**Fix:** Added `getEventStats` to the destructured import at the top:
```js
const { createEvent, getEvents, bookTicket, cancelTicket, validateTicket, getEventStats } = require("../controllers/eventController");
```

---

## 6. No `.gitignore` File (Git Setup)

**File:** `.gitignore` *(newly created)*

**What was wrong:**
There was no `.gitignore` file, which means sensitive files like `.env` (which contains your database password) and the massive `node_modules/` folder would have been pushed to GitHub.

- `.env` contains secrets — **never push this to GitHub**
- `node_modules/` contains thousands of files that don't need to be stored — anyone can recreate it by running `npm install`

**Fix:** Created a `.gitignore` file that tells Git to ignore both:
```
node_modules/
.env
```

---

## 7. Added `.env.example` (Git Setup)

**File:** `.env.example` *(newly created)*

**What was wrong:**
Since `.env` is now ignored by Git, anyone who clones the project won't know what environment variables are needed to run it.

**Fix:** Created `.env.example` with placeholder values so others know exactly what to fill in:
```
PORT=5050
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/<dbname>?appName=Cluster0
```

---

## 8. Fixed `package.json`

**File:** `package.json`

**What was wrong:**
- `"main"` was pointing to `index.js` which doesn't exist. The real entry file is `server.js`.
- There were no `start` or `dev` scripts, so you had to manually type `node server.js` or `npx nodemon server.js` every time.

**Fix:**
```json
"main": "server.js",
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```
Now you can just run:
- `npm start` → runs the app normally
- `npm run dev` → runs with nodemon (auto-restarts on file changes)

---

## How to Run the Project

1. Clone the repo
2. Run `npm install` to install dependencies
3. Copy `.env.example` to `.env` and fill in your real values
4. Run `npm run dev` to start the development server

---

## 9. CSRF Vulnerability Fixed with JWT Auth (High Severity)

**Files affected:** `routes/eventRoutes.js`, `middleware/auth.js` *(newly created)*

### What is CSRF?

CSRF stands for **Cross-Site Request Forgery**. It's an attack where a malicious website tricks a logged-in user's browser into making unwanted requests to your API — like booking or cancelling tickets without the user knowing.

Example: You're logged into the ticketing app. You visit a shady website. That website secretly sends a POST request to `/api/events/:id/book` using your browser. Without protection, the API has no way to tell it wasn't you.

### Why were the POST and PUT routes vulnerable?

The routes for creating events, booking tickets, and cancelling tickets had no protection at all — anyone could call them:
```js
router.post("/", createEvent);           // no protection
router.post("/:id/book", bookTicket);    // no protection
router.put("/ticket/:id/cancel", cancelTicket); // no protection
```

### How it was fixed — JWT Authentication

Since this is a REST API (not a browser app with cookies/sessions), the best fix is **JWT (JSON Web Token)** authentication.

Here's how it works:
1. When a user logs in, the server gives them a **token** — a long encrypted string
2. For every sensitive request, the user must send that token in the request header
3. The server checks the token before allowing the action

A browser-based CSRF attack **cannot** attach this token because it lives in JavaScript memory, not in cookies.

**New file created — `middleware/auth.js`:**
```js
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); // token is valid, continue to the route
  } catch (err) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};
```

**Routes updated to use the `protect` middleware:**
```js
router.post("/", protect, createEvent);
router.post("/:id/book", protect, bookTicket);
router.put("/ticket/:id/cancel", protect, cancelTicket);
```

The `protect` middleware sits between the route and the controller — it checks the token first, and only lets the request through if it's valid.

### What was added to `.env`

A new secret key was added:
```
JWT_SECRET=your_super_secret_key_here
```
This is the key used to sign and verify tokens. Keep it secret — never push it to GitHub.

### How to test a protected route

Add this header to your API request (e.g. in Postman):
```
Authorization: Bearer <your_token_here>
```
Without it, the server will respond with `401 Unauthorized`.

---

## 10. Added User Register & Login (Auth System)

**New files:** `models/User.js`, `controllers/authController.js`, `routes/authRoutes.js`

### Why do we need this?

Earlier we added JWT protection to routes, but there was no way to actually *get* a token. It was like putting a lock on a door but never giving anyone a key.

Now we have two new routes:
- `POST /api/auth/register` — create a new account, get a token back
- `POST /api/auth/login` — log in with email + password, get a token back

### What is bcryptjs?

Storing passwords as plain text is dangerous. If your database gets hacked, everyone's password is exposed.

`bcryptjs` **hashes** the password — it converts it into a scrambled string that can't be reversed. When a user logs in, we hash what they typed and compare it to the stored hash.

Example:
```
Plain:  password123
Hashed: $2a$10$Xk9z....(unreadable)
```

### How the User model works (`models/User.js`)

- Stores `name`, `email`, `password`
- Before saving, automatically hashes the password using a `pre("save")` hook
- Has a `matchPassword()` method to compare passwords at login

### How the auth controller works (`controllers/authController.js`)

**Register:**
1. Check if email already exists
2. Create the user (password gets auto-hashed by the model)
3. Return a JWT token

**Login:**
1. Find user by email
2. Compare entered password with stored hash
3. If match, return a JWT token

### The token expires in 7 days

```js
jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" })
```
After 7 days the token stops working and the user needs to log in again.

---

## 11. Added Swagger UI

**New files:** `config/swagger.js`
**Updated:** `app.js`
**Packages installed:** `swagger-ui-express`, `swagger-jsdoc`

### What is Swagger UI?

Swagger UI is a webpage that automatically documents your API and lets you test it directly in the browser — no Postman needed for basic testing.

Once the server is running, visit:
```
http://localhost:5050/api-docs
```

You'll see all your routes listed with descriptions, input fields, and a way to send real requests.

### What is swagger-jsdoc?

Instead of writing a separate documentation file, `swagger-jsdoc` reads special comments (called JSDoc comments) directly above your routes and turns them into documentation automatically.

Example comment above a route:
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

### How to use the Authorize button in Swagger

Protected routes show a 🔒 lock icon in Swagger UI. To test them:

1. First call `POST /api/auth/login` in Swagger and copy the token from the response
2. Click the **Authorize** button at the top of the Swagger page
3. Type `Bearer <your_token>` and click Authorize
4. Now all protected routes will automatically send your token

### How the bearerAuth security scheme works (`config/swagger.js`)

This tells Swagger that the API uses JWT tokens sent in the `Authorization` header:
```js
securitySchemes: {
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT"
  }
}
```
Any route with `security: [{ bearerAuth: [] }]` in its comment will show the 🔒 lock icon.

---

## 12. How to Test with Postman

### Setup — Create an Environment

1. Open Postman → click **Environments** → **New Environment** → name it `EventTicketing`
2. Add a variable called `token` (leave value empty for now)
3. Add a variable called `baseUrl` with value `http://localhost:5050`
4. Select this environment from the top-right dropdown

### Step 1 — Register a user

- Method: `POST`
- URL: `{{baseUrl}}/api/auth/register`
- Body (JSON):
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
Copy the `token` from the response.

### Step 2 — Auto-save the token (Tests tab trick)

In the **Tests** tab of your register/login request, paste this:
```js
pm.environment.set("token", pm.response.json().token);
```
Now every time you register or login, Postman automatically saves the token to your environment.

### Step 3 — Use the token on protected routes

For any protected route (create event, book ticket, cancel ticket):
- Go to the **Authorization** tab
- Type: `Bearer`
- Token: `{{token}}`

Or set it globally on the Collection → Authorization tab so all requests inherit it.

### Step 4 — Test the routes in order

| Step | Method | URL | Auth needed |
|------|--------|-----|-------------|
| Register | POST | `{{baseUrl}}/api/auth/register` | No |
| Login | POST | `{{baseUrl}}/api/auth/login` | No |
| Create Event | POST | `{{baseUrl}}/api/events` | Yes |
| Get Events | GET | `{{baseUrl}}/api/events` | No |
| Book Ticket | POST | `{{baseUrl}}/api/events/:id/book` | Yes |
| Cancel Ticket | PUT | `{{baseUrl}}/api/events/ticket/:id/cancel` | Yes |
| Validate Ticket | GET | `{{baseUrl}}/api/events/ticket/validate/:code` | No |
| Event Stats | GET | `{{baseUrl}}/api/events/:id/stats` | No |

---

## Final Project Structure

```
EventTicketingAPI/
├── config/
│   ├── database.js       — MongoDB connection
│   └── swagger.js        — Swagger/OpenAPI config
├── controllers/
│   ├── authController.js — Register & login logic
│   └── eventController.js — Event & ticket logic
├── middleware/
│   └── auth.js           — JWT protection middleware
├── models/
│   ├── Event.js          — Event schema
│   ├── Ticket.js         — Ticket schema
│   └── User.js           — User schema with password hashing
├── routes/
│   ├── authRoutes.js     — /api/auth routes
│   └── eventRoutes.js    — /api/events routes
├── .env                  — Secret keys (never push to GitHub)
├── .env.example          — Template for others to fill in
├── .gitignore            — Tells Git what to ignore
├── app.js                — App setup and middleware
├── learning.md           — This file!
├── package.json          — Project config and scripts
└── server.js             — Starts the server
```
