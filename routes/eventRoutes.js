const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");

const { createEvent, getEvents, bookTicket, cancelTicket, validateTicket, getEventStats } = require("../controllers/eventController");
// Create Event
router.post("/", protect, createEvent);

// Get Events
router.get("/", getEvents);

// Book Ticket
router.post("/:id/book", protect, bookTicket);

// Cancel Ticket
router.put("/ticket/:id/cancel", protect, cancelTicket);

// Validate Ticket
router.get("/ticket/validate/:code", validateTicket);

// Attendees
router.get("/:id/stats", getEventStats);


module.exports = router;