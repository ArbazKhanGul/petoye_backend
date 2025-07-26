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
            inviteReferralCode: {
              type: "string",
              example: "ABCDEFGH",
              description: "Optional referral code from another user",
            },
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
                referralCode: {
                  type: "string",
                  example: "ABCDEFGH",
                  description: "User's unique referral code",
                },
                tokens: {
                  type: "number",
                  example: 10,
                  description: "User's current token balance",
                },
              },
            },
            token: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
        CreatePost: {
          type: "object",
          properties: {
            content: {
              type: "string",
              example: "This is my new post!",
            },
            mediaFiles: {
              type: "array",
              items: {
                type: "string",
                format: "binary",
              },
              description:
                "Media files (images/videos) for the post, up to 3 files",
            },
          },
        },
        Post: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: {
              type: "object",
              properties: {
                _id: { type: "string" },
                fullName: { type: "string" },
                profileImage: { type: "string" },
              },
            },
            content: { type: "string" },
            mediaFiles: {
              type: "array",
              items: { type: "string" },
            },
            likes: {
              type: "array",
              items: { type: "string" },
            },
            comments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  userId: { type: "string" },
                  content: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
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
