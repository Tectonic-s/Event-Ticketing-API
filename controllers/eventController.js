const Event = require("../models/Event");
const Ticket = require("../models/Ticket");

// Create Event
const createEvent = async (req, res) => {
  const newEvent = new Event({
    name: req.body.name,
    totalSeats: req.body.totalSeats,
    availableSeats: req.body.totalSeats
  });

  await newEvent.save();

  res.json({
    message: "Event created",
    event: newEvent
  });
};

// Get Events
const getEvents = async (req, res) => {
  const events = await Event.find();
  res.json(events);
};

// Book Ticket
const bookTicket = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  if (event.availableSeats <= 0) {
    return res.status(400).json({ message: "No seats available" });
  }

  event.availableSeats -= 1;
  await event.save();

  const ticket = new Ticket({
    ticketCode: "TICKET-" + Math.random().toString(36).substr(2, 9),
    event: event._id
  });

  await ticket.save();

  res.json({
    message: "Ticket booked",
    ticket
  });
};

// Cancel Ticket
const cancelTicket = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket || ticket.status === "cancelled") {
    return res.status(400).json({ message: "Invalid ticket" });
  }

  ticket.status = "cancelled";
  await ticket.save();

  const event = await Event.findById(ticket.event);
  event.availableSeats += 1;
  await event.save();

  res.json({ message: "Ticket cancelled" });
};

// Ticket Validation 

const validateTicket = async (req, res) => {
  const code = req.params.code;

  const ticket = await Ticket.findOne({ ticketCode: code });

  if (!ticket || ticket.status === "cancelled") {
    return res.status(400).json({ valid: false, message: "Invalid ticket" });
  }

  res.json({
    valid: true,
    message: "Ticket is valid",
    ticket
  });
};

//Attendees
const getEventStats = async (req, res) => {
  const eventId = req.params.id;

  const event = await Event.findById(eventId);

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  const totalTickets = await Ticket.countDocuments({
    event: eventId,
    status: "booked"
  });

  res.json({
    eventName: event.name,
    totalSeats: event.totalSeats,
    availableSeats: event.availableSeats,
    ticketsSold: totalTickets
  });
};

module.exports = { createEvent, getEvents, bookTicket, cancelTicket, validateTicket,getEventStats };
