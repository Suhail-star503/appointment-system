import express from "express";
import AppointmentController from "./controller.js";

const appointmentRouter = express.Router();
const appointmentController = new AppointmentController();

appointmentRouter.post(
  "/appointmentsystem",
  appointmentController.createAppointment
);
// Get all appointments
appointmentRouter.get(
  "/appointmentsystem",
  appointmentController.getAppointments
);
// Update appointment status
appointmentRouter.patch(
  "/appointmentsystem/:appointmentId/status",
  appointmentController.updateAppointmentStatus
);
export default appointmentRouter;