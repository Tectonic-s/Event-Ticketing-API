const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");

const { createEvent, getEvents, bookTicket, cancelTicket, validateTicket, getEventStats } = require("../controllers/eventController");

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event and ticket management
 */

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, totalSeats]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Tech Conference 2025
 *               totalSeats:
 *                 type: number
 *                 example: 100
 *     responses:
 *       200:
 *         description: Event created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, createEvent);

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

/**
 * @swagger
 * /api/events/{id}/book:
 *   post:
 *     summary: Book a ticket for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Ticket booked successfully
 *       400:
 *         description: No seats available
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.post("/:id/book", protect, bookTicket);

/**
 * @swagger
 * /api/events/ticket/{id}/cancel:
 *   put:
 *     summary: Cancel a ticket
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket code (e.g. TICKET-911iq6l8c)
 *     responses:
 *       200:
 *         description: Ticket cancelled successfully
 *       400:
 *         description: Invalid ticket
 *       401:
 *         description: Unauthorized
 */
router.put("/ticket/:id/cancel", protect, cancelTicket);

/**
 * @swagger
 * /api/events/ticket/validate/{code}:
 *   get:
 *     summary: Validate a ticket by code
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket code
 *     responses:
 *       200:
 *         description: Ticket is valid
 *       400:
 *         description: Invalid ticket
 */
router.get("/ticket/validate/:code", validateTicket);

/**
 * @swagger
 * /api/events/{id}/stats:
 *   get:
 *     summary: Get stats for an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event stats returned
 *       404:
 *         description: Event not found
 */
router.get("/:id/stats", getEventStats);

module.exports = router;
