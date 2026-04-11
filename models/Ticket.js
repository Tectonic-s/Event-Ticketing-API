const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  ticketCode: {
    type: String,
    unique: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event"
  },
  status: {
    type: String,
    enum: ["booked", "cancelled"],
    default: "booked"
  }
});

module.exports = mongoose.model("Ticket", ticketSchema);