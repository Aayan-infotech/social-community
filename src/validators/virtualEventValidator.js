import Joi from "joi";

const virtualEventSchema = Joi.object({
    eventName: Joi.string().required().messages({
        "string.empty": "Event name is required",
        "any.required": "Event name is required"
    }),
    eventDescription: Joi.string().optional().allow(''),
    eventLocation: Joi.string().required().messages({
        "string.empty": "Event location is required",
        "any.required": "Event location is required"
    }),
    eventStartDate: Joi.date().required().messages({
        "date.base": "Event start date must be a valid date",
        "any.required": "Event start date is required"
    }),
    eventEndDate: Joi.date().required().messages({
        "date.base": "Event end date must be a valid date",
        "any.required": "Event end date is required"
    }),
    eventTimeStart: Joi.string().required().messages({
        "string.empty": "Event start time is required",
        "any.required": "Event start time is required"
    }),
    eventTimeEnd: Joi.string().required().messages({
        "string.empty": "Event end time is required",
        "any.required": "Event end time is required"
    }),
    eventImage: Joi.string().optional().allow(''),
    ticketPrice: Joi.number().required().default(0).messages({
        "number.base": "Ticket price must be a number",
        "any.required": "Ticket price is required"
    })
});

const bookingValidationSchema = Joi.object({
    userId: Joi.string().required().messages({
        "string.empty": "User ID is required",
        "any.required": "User ID is required"
    }),
    eventId: Joi.string().required().messages({
        "string.empty": "Event ID is required",
        "any.required": "Event ID is required"
    }),
    ticketCount: Joi.number().min(1).required().messages({
        "number.base": "Ticket count must be a number",
        "number.min": "Ticket count must be at least 1",
        "any.required": "Ticket count is required"
    }),
    totalPrice: Joi.number().min(0).required().messages({
        "number.base": "Total price must be a number",
        "number.min": "Total price must be at least 0",
        "any.required": "Total price is required"
    }),
    bookingStatus: Joi.string().valid('booked', 'cancelled').required().messages({
        "any.only": "Booking status must be either 'booked' or 'cancelled'",
        "any.required": "Booking status is required"
    }),
    paymentStatus: Joi.string().valid('pending', 'completed', 'failed').required().messages({
        "any.only": "Payment status must be either 'pending', 'completed', or 'failed'",
        "any.required": "Payment status is required"
    }),
    bookingDate: Joi.date().required().messages({
        "date.base": "Booking date must be a valid date",
        "any.required": "Booking date is required"
    })
});

const bookTicketSchema = Joi.object({
    eventId: Joi.string().required().messages({
        "string.empty": "Event ID is required",
        "any.required": "Event ID is required"
    }),
    ticketCount: Joi.number().min(1).required().messages({
        "number.base": "Ticket count must be a number",
        "number.min": "Ticket count must be at least 1",
        "any.required": "Ticket count is required"
    }),
    totalPrice: Joi.number().min(0).required().messages({
        "number.base": "Total price must be a number",
        "number.min": "Total price must be at least 0",
        "any.required": "Total price is required"
    }),
    bookingDate: Joi.date().required().messages({
        "date.base": "Booking date must be a valid date",
        "any.required": "Booking date is required"
    }),
    bookingTime: Joi.string().required().messages({
        "string.empty": "Booking time is required",
        "any.required": "Booking time is required"
    }),
});

const updateBookingStatusSchema = Joi.object({
    bookingId: Joi.string().required().messages({
        "string.empty": "Booking ID is required",
        "any.required": "Booking ID is required"
    }),
    bookingStatus: Joi.string().valid('booked', 'cancelled').required().messages({
        "any.only": "Booking status must be either 'booked' or 'cancelled'",
        "any.required": "Booking status is required"
    }),
    paymentStatus: Joi.string().valid('pending', 'completed', 'failed').required().messages({
        "any.only": "Payment status must be either 'pending', 'completed', or 'failed'",
        "any.required": "Payment status is required"
    })
});

const cancelBookingSchema = Joi.object({
    bookingId: Joi.string().required().messages({
        "string.empty": "Booking ID is required",
        "any.required": "Booking ID is required"
    }),
    cancellationReason: Joi.string().optional()
});

export { virtualEventSchema, bookingValidationSchema, bookTicketSchema, updateBookingStatusSchema, cancelBookingSchema };