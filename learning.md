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
