import mongoose from "mongoose";
import AppointmentRepository from "./repository.js";
import ApplicationError from "../../errors/applicationError.js";

const appointmentRepository = new AppointmentRepository();

export default class AppointmentController {
  async createAppointment(req, res, next) {
    try {
      const { customerName, service, dateTime, status } = req.body;

      // 1. Validate customer name
      if (
        typeof customerName !== "string" ||
        customerName.trim().length < 2
      ) {
        throw new ApplicationError(
          "Customer name must be at least 2 characters",
          400
        );
      }

      // 2. Validate service
      if (
        typeof service !== "string" ||
        service.trim().length < 2
      ) {
        throw new ApplicationError(
          "Service must be at least 2 characters",
          400
        );
      }

      // 3. Validate appointment date and time
      if (!dateTime || typeof dateTime !== "string") {
        throw new ApplicationError(
          "Appointment date and time are required",
          400
        );
      }

      const parsedDate = new Date(dateTime);

      if (Number.isNaN(parsedDate.getTime())) {
        throw new ApplicationError(
          "Please provide a valid appointment date and time",
          400
        );
      }

      // 4. Validate status if provided
      const allowedStatuses = ["Pending", "Confirmed", "Cancelled"];

      if (status !== undefined && !allowedStatuses.includes(status)) {
        throw new ApplicationError(
          "Status must be Pending, Confirmed or Cancelled",
          400
        );
      }

      // 5. Prepare clean appointment data
      const appointmentData = {
        customerName: customerName.trim(),
        service: service.trim(),
        dateTime: parsedDate,
      };

      // Only include status if the client provided it
      if (status !== undefined) {
        appointmentData.status = status;
      }

      // 6. Save appointment through repository
      const savedAppointment =
        await appointmentRepository.createAppointment(appointmentData);

      // 7. Send successful response
      return res.status(201).json({
        success: true,
        message: "Appointment created successfully",
        data: savedAppointment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAppointments(req, res, next) {
    try {
      // 1. Get query parameters
      const {
        page = "1",
        limit = "10",
        status,
        search,
        from,
        to,
        sortBy = "dateTime",
        order = "desc",
      } = req.query;

      // 2. Validate pagination values
      const isPositiveInteger = (value) =>
        typeof value === "string" && /^[1-9]\d*$/.test(value);

      if (!isPositiveInteger(page)) {
        throw new ApplicationError(
          "Page must be a positive integer",
          400
        );
      }

      if (!isPositiveInteger(limit)) {
        throw new ApplicationError(
          "Limit must be a positive integer",
          400
        );
      }

      const pageNumber = Number(page);
      const limitNumber = Number(limit);

      if (!Number.isSafeInteger(pageNumber)) {
        throw new ApplicationError("Invalid page number", 400);
      }

      if (
        !Number.isSafeInteger(limitNumber) ||
        limitNumber > 100
      ) {
        throw new ApplicationError(
          "Limit must be between 1 and 100",
          400
        );
      }

      // 3. Calculate skip safely
      const skip = (pageNumber - 1) * limitNumber;

      if (!Number.isSafeInteger(skip)) {
        throw new ApplicationError(
          "Requested page is too large",
          400
        );
      }

      // 4. Validate status
      const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Cancelled",
      ];

      if (
        status !== undefined &&
        (typeof status !== "string" ||
          !allowedStatuses.includes(status))
      ) {
        throw new ApplicationError(
          "Invalid appointment status",
          400
        );
      }

      // 5. Validate search
      if (search !== undefined) {
        if (
          typeof search !== "string" ||
          !search.trim() ||
          search.trim().length > 100
        ) {
          throw new ApplicationError(
            "Search must be between 1 and 100 characters",
            400
          );
        }
      }

      // 6. Validate sorting
      const allowedSortFields = [
        "dateTime",
        "createdAt",
        "customerName",
      ];

      if (
        typeof sortBy !== "string" ||
        !allowedSortFields.includes(sortBy)
      ) {
        throw new ApplicationError(
          "Invalid sort field",
          400
        );
      }

      if (
        typeof order !== "string" ||
        !["asc", "desc"].includes(order)
      ) {
        throw new ApplicationError(
          "Order must be asc or desc",
          400
        );
      }

      // 7. Validate date filters
      const parseDate = (value, field) => {
        if (typeof value !== "string") {
          throw new ApplicationError(
            `Invalid ${field} date`,
            400
          );
        }

        const isoRegex =
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

        if (!isoRegex.test(value)) {
          throw new ApplicationError(
            `${field} must be an ISO 8601 date with timezone`,
            400
          );
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
          throw new ApplicationError(
            `Invalid ${field} date`,
            400
          );
        }

        return date;
      };

      const fromDate =
        from !== undefined ? parseDate(from, "From") : null;

      const toDate =
        to !== undefined ? parseDate(to, "To") : null;

      if (fromDate && toDate && fromDate > toDate) {
        throw new ApplicationError(
          "From date cannot be greater than to date",
          400
        );
      }

      // 8. Prepare database filters
      const filters = {};

      if (status) {
        filters.status = status;
      }

      if (search !== undefined) {
        const escapedSearch = search.trim().replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        filters.$or = [
          {
            customerName: {
              $regex: escapedSearch,
              $options: "i",
            },
          },
          {
            service: {
              $regex: escapedSearch,
              $options: "i",
            },
          },
        ];
      }

      if (fromDate || toDate) {
        filters.dateTime = {};

        if (fromDate) {
          filters.dateTime.$gte = fromDate;
        }

        if (toDate) {
          filters.dateTime.$lte = toDate;
        }
      }

      // 9. Prepare repository options
      const options = {
        page: pageNumber,
        skip,
        limit: limitNumber,
        sort: {
          [sortBy]: order === "asc" ? 1 : -1,
          _id: order === "asc" ? 1 : -1,
        },
      };

      // 10. Get appointments from repository
      const {
        appointments,
        totalAppointments,
        totalPages,
      } = await appointmentRepository.getAppointments(
        filters,
        options
      );

      // 11. Verify requested page exists
      // Page 1 is allowed even when there are no appointments.
      if (pageNumber > Math.max(totalPages, 1)) {
        throw new ApplicationError(
          `Page ${pageNumber} does not exist. Total available pages: ${totalPages}`,
          404
        );
      }

      // 12. Send successful response
      return res.status(200).json({
        success: true,
        message: "Appointments retrieved successfully",
        data: appointments,
        pagination: {
          currentPage: pageNumber,
          limit: limitNumber,
          totalAppointments,
          totalPages,
          hasNextPage: pageNumber < totalPages,
          hasPrevPage: pageNumber > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  async updateAppointmentStatus(req, res, next) {
    try {
      // 1. Get appointment ID
      const { appointmentId } = req.params;

      // 2. Validate MongoDB ObjectId
      if (
        typeof appointmentId !== "string" ||
        !mongoose.isObjectIdOrHexString(appointmentId)
      ) {
        throw new ApplicationError("Invalid appointment ID", 400);
      }

      // 3. Validate request body
      if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
      ) {
        throw new ApplicationError(
          "Request body must be a valid JSON object",
          400
        );
      }

      // 4. Validate allowed fields
      const allowedFields = ["status"];
      const receivedFields = Object.keys(req.body);

      if (
        receivedFields.length !== 1 ||
        receivedFields.some((field) => !allowedFields.includes(field))
      ) {
        throw new ApplicationError(
          "Only the status field is allowed",
          400
        );
      }

      // 5. Validate status
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Cancelled",
      ];

      if (
        typeof status !== "string" ||
        !allowedStatuses.includes(status)
      ) {
        throw new ApplicationError(
          "Status must be Pending, Confirmed or Cancelled",
          400
        );
      }

      // 6. Update appointment
      const result =
        await appointmentRepository.updateAppointmentStatus(
          appointmentId,
          status
        );

      // 7. Appointment not found
      if (!result) {
        throw new ApplicationError("Appointment not found", 404);
      }

      // 8. Handle conflicts
      if (result.conflict === "same_status") {
        throw new ApplicationError(
          "Appointment already has this status",
          409
        );
      }

      if (result.conflict === "concurrent_update") {
        throw new ApplicationError(
          "Appointment was modified by another request. Please refresh and try again.",
          409
        );
      }

      // 9. Validate repository response
      if (!result.appointment) {
        throw new ApplicationError(
          "Unable to update appointment status",
          500
        );
      }

      // 10. Success response
      return res.status(200).json({
        success: true,
        message: "Appointment status updated successfully",
        data: result.appointment,
      });

    } catch (error) {
      next(error);
    }
  }

}