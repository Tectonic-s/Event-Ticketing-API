const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Running...");
});

module.exports = app;

const eventRoutes = require("./routes/eventRoutes");
app.use("/api/events", eventRoutes);

const connectDB = require("./config/database");

connectDB();