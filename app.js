// ── 1. Load all dependencies at the top BEFORE anything else runs ──────────────
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/database");   // moved up from bottom
const eventRoutes = require("./routes/eventRoutes"); // moved up from bottom

// ── 2. Initialise env vars immediately so every module below can read them ──────
dotenv.config();

const app = express();

app.use(express.json());

// ── 3. Connect to DB here, BEFORE the app is exported and the server starts ─────
//    Previously connectDB() was called AFTER module.exports, so the exported app
//    was handed to server.js before the DB connection was ever attempted.
connectDB();

app.get("/", (req, res) => {
  res.send("API Running...");
});

// ── 4. Register routes BEFORE exporting ─────────────────────────────────────────
//    Previously these lines sat after module.exports, so server.js received an
//    app with NO routes attached — every /api/events call returned 404.
app.use("/api/events", eventRoutes);

// ── 5. Export LAST, only after the app is fully configured ──────────────────────
module.exports = app;