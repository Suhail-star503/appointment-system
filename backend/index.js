import "dotenv/config";

import express from "express";
import cors from "cors";

import appointmentRouter from "./src/features/crudapi/routes.js";
import { errorHandlerMiddleware } from "./src/middlewares/error-handler.middleware.js";
import connectUsingMongoose from "./config/mongooseConfig.js";

// Initialize Express
const app = express();

// Middlewares
app.use(
  cors()
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Welcome to Appointment System API",
  });
});

// Appointment routes
app.use("/api", appointmentRouter);

// 404 middleware
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Centralized error handler (keep this last)
app.use(errorHandlerMiddleware);

// Start server only after database connection
const startServer = async () => {
  try {
    await connectUsingMongoose();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  }
};

startServer();