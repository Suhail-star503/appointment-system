import Appointment from "./schema.js";
import handleDatabaseError from "../../errors/databaseError.js";

export default class AppointmentRepository {
  async createAppointment(appointmentData) {
    try {
      const appointment = new Appointment(appointmentData);
      return await appointment.save();
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async getAppointments(filters, options) {
    try {
      // 1. Count matching appointments first
      const totalAppointments =
        await Appointment.countDocuments(filters);

      // 2. Calculate total pages
      const totalPages = Math.ceil(
        totalAppointments / options.limit
      );

      // 3. Return without querying records if page does not exist
      if (options.page > Math.max(totalPages, 1)) {
        return {
          appointments: [],
          totalAppointments,
          totalPages,
        };
      }

      // 4. Fetch appointments only after page verification
      const appointments = await Appointment.find(filters)
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit)
        .lean();

      // 5. Return results and pagination information
      return {
        appointments,
        totalAppointments,
        totalPages,
      };
    } catch (error) {
      handleDatabaseError(error);
    }
  }
  async updateAppointmentStatus(appointmentId, newStatus) {
    try {
      // 1. Find existing appointment
      const existingAppointment = await Appointment.findById(
        appointmentId
      )
        .select("status")
        .lean();

      // 2. Check whether appointment exists
      if (!existingAppointment) {
        return null;
      }

      // 3. Prevent updating to the same status
      if (existingAppointment.status === newStatus) {
        return {
          conflict: "same_status",
        };
      }

      // 4. Atomically update appointment status
      const updatedAppointment = await Appointment.findOneAndUpdate(
        {
          _id: appointmentId,
          status: existingAppointment.status,
        },
        {
          $set: {
            status: newStatus,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      ).lean();

      // 5. Handle concurrent update
      if (!updatedAppointment) {
        return {
          conflict: "concurrent_update",
        };
      }

      // 6. Return updated appointment
      return {
        appointment: updatedAppointment,
      };

    } catch (error) {
      handleDatabaseError(error);
    }
  }
}