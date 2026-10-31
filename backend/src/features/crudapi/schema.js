import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Customer name must be at least 2 characters"],
      maxlength: [100, "Customer name cannot exceed 100 characters"],
    },

    service: {
      type: String,
      required: [true, "Service is required"],
      trim: true,
      minlength: [2, "Service must be at least 2 characters"],
      maxlength: [100, "Service cannot exceed 100 characters"],
    },

    dateTime: {
      type: Date,
      required: [true, "Appointment date and time are required"],
    },

    status: {
      type: String,
      enum: {
        values: ["Pending", "Confirmed", "Cancelled"],
        message: "Status must be Pending, Confirmed or Cancelled",
      },
      default: "Pending",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

appointmentSchema.index({ status: 1, dateTime: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;