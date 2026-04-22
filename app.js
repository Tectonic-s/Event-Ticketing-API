const express = require("express");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const connectDB = require("./config/database");
const eventRoutes = require("./routes/eventRoutes");
const authRoutes = require("./routes/authRoutes");

dotenv.config();

const app = express();

app.use(express.json());

connectDB();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { swaggerOptions: { url: "/api-docs/swagger.json" } }));
app.get("/api-docs/swagger.json", (req, res) => res.json(swaggerSpec));

app.get("/", (req, res) => res.send("API Running..."));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

module.exports = app;
