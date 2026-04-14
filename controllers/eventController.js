const Event = require("../models/Event");
const Ticket = require("../models/Ticket");

// Create Event
const createEvent = async (req, res, next) => {
  try {
    const newEvent = new Event({
      name: req.body.name,
      totalSeats: req.body.totalSeats,
      availableSeats: req.body.totalSeats
    });
    await newEvent.save();
    res.json({ message: "Event created", event: newEvent });
  } catch (err) {
    next(err);
  }
};

// Get Events
const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    next(err);
  }
};

// Book Ticket
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
  } catch (err) {
    next(err);
  }
};

// Cancel Ticket
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
  } catch (err) {
    next(err);
  }
};

// Validate Ticket
const validateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({ ticketCode: req.params.code });
    if (!ticket || ticket.status === "cancelled")
      return res.status(400).json({ valid: false, message: "Invalid ticket" });

    res.json({ valid: true, message: "Ticket is valid", ticket });
  } catch (err) {
    next(err);
  }
};

// Get Event Stats
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
  } catch (err) {
    next(err);
  }
};

// Delete Event
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    await Ticket.deleteMany({ event: req.params.id });
    res.json({ message: "Event deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { createEvent, getEvents, bookTicket, cancelTicket, validateTicket, getEventStats, deleteEvent };
