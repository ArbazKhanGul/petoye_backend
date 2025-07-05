const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Petoye Backend API",
      version: "1.0.0",
      description:
        "API documentation for Petoye authentication and user management",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Register: {
          type: "object",
          required: [
            "fullName",
            "email",
            "password",
            "dateOfBirth",
            "country",
            "phoneNumber",
          ],
          properties: {
            fullName: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@example.com" },
            password: { type: "string", example: "Password@123" },
            dateOfBirth: { type: "string", example: "1990-01-01" },
            country: { type: "string", example: "India" },
            phoneNumber: { type: "string", example: "9876543210" },
          },
        },
        Login: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "john@example.com" },
            password: { type: "string", example: "Password@123" },
          },
        },
        UpdateProfile: {
          type: "object",
          properties: {
            fullName: { type: "string", example: "John Doe" },
            phoneNumber: { type: "string", example: "9876543210" },
            country: { type: "string", example: "India" },
            dateOfBirth: { type: "string", example: "1990-01-01" },
            profileImage: { type: "string", format: "binary" },
          },
        },
        UserResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "User created successfully" },
            user: {
              type: "object",
              properties: {
                _id: { type: "string" },
                fullName: { type: "string" },
                email: { type: "string" },
                dateOfBirth: { type: "string" },
                country: { type: "string" },
                phoneNumber: { type: "string" },
                role: { type: "string" },
                profileImage: { type: "string" },
                emailVerify: { type: "boolean" },
              },
            },
            token: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
