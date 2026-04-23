const express = require("express");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const connectDB = require("./config/database");
const eventRoutes = require("./routes/eventRoutes");
const authRoutes = require("./routes/authRoutes");
const path = require("path");

dotenv.config();

const app = express();

app.use(express.json());

connectDB();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: { url: "/api-docs/swagger.json" }
}));

app.get("/api-docs/swagger.json", (req, res) => res.json(swaggerSpec));

// ✅ static files
app.use(express.static("public"));

// ✅ THIS is the missing piece
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

module.exports = app;