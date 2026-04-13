const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Event Ticketing API",
      version: "1.0.0",
      description: "API for managing events and tickets"
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    servers: [{ url: "http://localhost:5050" }]
  },
  apis: ["./routes/*.js"]
};

module.exports = swaggerJsdoc(options);
