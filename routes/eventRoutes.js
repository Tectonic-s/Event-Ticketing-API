const express = require("express");
const router = express.Router();

const { createEvent, getEvents, bookTicket, cancelTicket, validateTicket, getEventStats } = require("../controllers/eventController");
// Create Event
router.post("/", createEvent);

// Get Events
router.get("/", getEvents);

// Book Ticket
router.post("/:id/book", bookTicket);

// Cancel Ticket
router.put("/ticket/:id/cancel", cancelTicket);

// Validate Ticket
router.get("/ticket/validate/:code", validateTicket);

// Attendees
router.get("/:id/stats", getEventStats);


module.exports = router;