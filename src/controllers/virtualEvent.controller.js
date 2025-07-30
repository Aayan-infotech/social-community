import mongoose, { get } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import VirtualEvent from "../models/virtualEvent.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadImage } from "../utils/awsS3Utils.js";
import { isValidObjectId } from "../utils/isValidObjectId.js";
import TicketBooking from "../models/ticketBooking.model.js";
import { paymentSheet } from "../services/stripeService.js";
import { generateAndSendTicket } from "../services/generateTicket.js";
import {
  changeDateTimeZone,
  convertTo12Hour,
  generateRandomPassword,
  generateTicketId,
  generateUniqueUsername,
} from "../utils/HelperFunctions.js";
import { getTimezoneDateProjection } from "../utils/timezoneProjector.js";
import EventLoginUser from "../models/eventLoginUser.model.js";
import { sendEventLoginCredentialEmail } from "../emails/eventLoginCredential.js";
import { sendEmail } from "../services/emailService.js";
import jwt from "jsonwebtoken";
import { loadConfig } from "../config/loadConfig.js";
import { User } from "../models/user.model.js";

const secret = await loadConfig();

const addEvent = asyncHandler(async (req, res) => {
  const {
    eventName,
    eventDescription,
    eventLocation,
    eventStartDate,
    eventEndDate,
    ticketPrice,
    eventTimeStart,
    eventTimeEnd,
    noOfSlots,
  } = req.body;

  if (ticketPrice <= 0) {
    throw new ApiError(400, "Ticket price must be greater than 0");
  }

  const isKYCCompleted = req.user?.isKYCVerified;
  if (!isKYCCompleted) {
    throw new ApiError(
      400,
      "KYC verification is required to create a virtual event"
    );
  }

  const role = req.user?.role;

  if (!role.includes("event_manager")) {
    req.user.role.push("event_manager");
    await req.user.save();
  }


  // eventName is unique, so we check if it already exists
  const existingEvent = await VirtualEvent.findOne({ eventName });
  if (existingEvent) {
    throw new ApiError(400, "Event with this name already exists");
  }

  // Event Start Date and Time
  const eventStartDateTime = `${eventStartDate}T${eventTimeStart}:00`;
  const eventEndDateTime = `${eventEndDate}T${eventTimeEnd}:00`;

  if (new Date(eventStartDateTime) < new Date()) {
    throw new ApiError(400, "Event start date and time cannot be in the past");
  }

  if (new Date(eventStartDateTime) > new Date(eventEndDateTime)) {
    throw new ApiError(400, "Event start date cannot be after the end date");
  }

  // upload event image if provided
  let eventImageUrl = "";
  if (req.files && req.files.eventImage) {
    const eventImage = await uploadImage(req.files.eventImage[0]);
    if (!eventImage.success) {
      throw new ApiError(500, "Failed to upload event image");
    }
    eventImageUrl = eventImage.fileUrl;
  }






  const newEvent = new VirtualEvent({
    eventName,
    eventDescription,
    eventLocation,
    eventStartDate: eventStartDateTime,
    eventEndDate: eventEndDateTime,
    ticketPrice,
    eventTimeStart,
    eventTimeEnd,
    eventImage: eventImageUrl
      ? eventImageUrl
      : "",
    userId: req.user.userId,
    noOfSlots: noOfSlots,
  });

  const savedEvent = await newEvent.save();
  if (!savedEvent) {
    throw new ApiError(400, "Skill is required");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, "Virtual event created successfully", savedEvent)
    );
});

const getEvents = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const timezone = req.headers?.timezone || "Central Daylight Time";

  // Search Event By Event Name or User Name
  const searchQuery = req.query.search || "";
  const searchRegex = new RegExp(searchQuery, "i");

  const userId = req.query.userId || req.user.userId;

  const aggregation = [];

  aggregation.push({
    $match: {
      eventStartDate: { $gte: new Date() },
      eventEndDate: { $gte: new Date() },
    },
    $match: {
      userId: { $ne: userId }
    },
    $match: {
      status: "approved"
    }
  });

  aggregation.push({
    $sort: { createdAt: -1 },
  });
  aggregation.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "userDetails",
    },
  });
  aggregation.push({
    $unwind: "$userDetails",
  });

  if (searchQuery) {
    aggregation.push({
      $match: {
        $or: [{ eventName: searchRegex }, { "userDetails.name": searchRegex }],
      },
    });
  }

  aggregation.push({
    $facet: {
      virtualEvents: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            eventName: 1,
            eventDescription: 1,
            eventLocation: 1,
            eventStartDate: 1,
            eventEndDate: 1,
            eventTimeStart: 1,
            eventTimeEnd: 1,
            ticketPrice: 1,
            eventImage: 1,
            userId: 1,
            userDetails: {
              userId: "$userDetails.userId",
              name: "$userDetails.name",
              email: "$userDetails.email",
              profile_image: "$userDetails.profile_image",
            },
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await VirtualEvent.aggregate(aggregation);

  const totalCount =
    result.length > 0 ? result[0].totalCount[0]?.count || 0 : 0;
  const virtualEvents = result.length > 0 ? result[0].virtualEvents : [];

  res.json(
    new ApiResponse(
      200,
      virtualEvents.length > 0
        ? "Virtual events fetched successfully"
        : "No virtual events found",
      virtualEvents.length > 0
        ? {
          virtualEvents,
          total_page: Math.ceil(totalCount / limit),
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );
});

const myEvenets = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const type = req.query.type || "all";
  if (!["all", "upcoming", "past"].includes(type)) {
    throw new ApiError(
      400,
      "Invalid type parameter. Must be 'all', 'upcoming', or 'past'"
    );
  }

  const timezone = req.headers?.timezone || "UTC";

  const userId = req.user.userId;

  const aggregation = [];

  aggregation.push({
    $match: {
      userId: userId,
    },
  });
  if (type === "upcoming") {
    aggregation.push({
      $match: {
        eventStartDate: { $gte: new Date() },
      },
    });
  } else if (type === "past") {
    aggregation.push({
      $match: {
        eventEndDate: { $lt: new Date() },
      },
    });
  }

  aggregation.push({
    $sort: { createdAt: -1 },
  });

  aggregation.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "userDetails",
    },
  });

  aggregation.push({
    $unwind: "$userDetails",
  });

  aggregation.push({
    $lookup: {
      from: "eventloginusers",
      localField: "_id",
      foreignField: "eventId",
      as: "eventManager",
    }
  });

  aggregation.push({
    $facet: {
      virtualEvents: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            eventName: 1,
            eventDescription: 1,
            eventLocation: 1,
            // ...getTimezoneDateProjection("eventStartDate", timezone, "eventStartDate"),
            // ...getTimezoneDateProjection("eventEndDate", timezone, "eventEndDate"),
            eventStartDate: 1,
            eventEndDate: 1,
            eventTimeStart: 1,
            eventTimeEnd: 1,
            ticketPrice: 1,
            eventImage: 1,
            userId: 1,
            status: 1,
            eventManager: {
              $map: {
                input: "$eventManager",
                as: "manager",
                in: {
                  userId: "$$manager.userId",
                  name: "$$manager.name",
                  email: "$$manager.email",
                  username: "$$manager.username",
                  password: "$$manager.password",
                },
              },
            },
            userDetails: {
              userId: "$userDetails.userId",
              name: "$userDetails.name",
              email: "$userDetails.email",
              profile_image: "$userDetails.profile_image",
            },
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await VirtualEvent.aggregate(aggregation);

  const totalCount =
    result.length > 0 ? result[0].totalCount[0]?.count || 0 : 0;
  const virtualEvents = result.length > 0 ? result[0].virtualEvents : [];

  res.json(
    new ApiResponse(
      200,
      virtualEvents.length > 0
        ? "Virtual events fetched successfully"
        : "No virtual events found",
      virtualEvents.length > 0
        ? {
          virtualEvents,
          total_page: Math.ceil(totalCount / limit),
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );
});

const updateEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  if (!isValidObjectId(eventId)) {
    throw new ApiError(400, "Invalid event ID");
  }

  const {
    eventName,
    eventDescription,
    eventLocation,
    eventStartDate,
    eventTimeStart,
    eventTimeEnd,
    eventEndDate,
    ticketPrice,
    noOfSlots,
  } = req.body;

  // Check if the event Name is already taken by another event
  const event = await VirtualEvent.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (event.userId.toString() !== req.user.userId) {
    throw new ApiError(403, "You are not authorized to update this event");
  }

  const isKYCCompleted = req.user?.isKYCVerified;
  if (!isKYCCompleted) {
    throw new ApiError(
      403,
      "KYC verification is required to update a virtual event"
    );
  }
  const existingEvent = await VirtualEvent.findOne({
    eventName,
    _id: { $ne: eventId },
  });
  if (existingEvent) {
    throw new ApiError(400, "Event with this name already exists");
  }

  // Event Start Date and Time
  const eventStartDateTime = new Date(`${eventStartDate}T${eventTimeStart}`);
  const eventEndDateTime = new Date(`${eventEndDate}T${eventTimeEnd}`);

  if (eventStartDateTime > eventEndDateTime) {
    throw new ApiError(400, "Event start date cannot be after the end date");
  }

  let eventImageUrl = "";

  if (req.files && req.files.eventImage) {
    const eventImage = await uploadImage(req.files.eventImage[0]);
    if (!eventImage.success) {
      throw new ApiError(500, "Failed to upload event image");
    }
    eventImageUrl = eventImage.fileUrl;
  } else {
    eventImageUrl = event.eventImage;
  }

  const updatedEvent = await VirtualEvent.findByIdAndUpdate(
    eventId,
    {
      eventName,
      eventDescription,
      eventLocation,
      eventStartDate: eventStartDateTime,
      eventEndDate: eventEndDateTime,
      ticketPrice,
      eventTimeEnd,
      eventTimeStart,
      eventImage: eventImageUrl
        ? eventImageUrl
        : "",
      noOfSlots: noOfSlots,
    },
    { new: true }
  );

  if (!updatedEvent) {
    throw new ApiError(404, "Event not found");
  }

  res.json(new ApiResponse(200, "Event updated successfully", updatedEvent));
});

const eventDetails = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  if (!isValidObjectId(eventId)) {
    throw new ApiError(400, "Invalid event ID");
  }

  const aggregation = [];
  aggregation.push({
    $match: {
      _id: new mongoose.Types.ObjectId(eventId),
    },
  });
  aggregation.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "userDetails",
    },
  });

  aggregation.push({
    $unwind: "$userDetails",
  });

  aggregation.push({
    $project: {
      _id: 1,
      eventName: 1,
      eventDescription: 1,
      eventLocation: 1,
      // ...getTimezoneDateProjection("eventStartDate", req.headers?.timezone || "UTC", "eventStartDate"),
      // ...getTimezoneDateProjection("eventEndDate", req.headers?.timezone || "UTC", "eventEndDate"),
      eventStartDate: 1,
      eventEndDate: 1,
      eventTimeStart: 1,
      eventTimeEnd: 1,
      ticketPrice: 1,
      eventImage: 1,
      userId: 1,
      status: 1,
      userDetails: {
        userId: "$userDetails.userId",
        name: "$userDetails.name",
        email: "$userDetails.email",
        profile_image: "$userDetails.profile_image",
      },
    },
  });
  const event = await VirtualEvent.aggregate(aggregation);

  return res.json(
    new ApiResponse(
      200,
      event.length > 0
        ? "Event details fetched successfully"
        : "Event not found",
      event.length > 0 ? event[0] : null
    )
  );
});

const bookTickets = asyncHandler(async (req, res) => {
  const { eventId, ticketCount, totalPrice, bookingDate, bookingTime } =
    req.body;
  if (!isValidObjectId(eventId)) {
    throw new ApiError(400, "Invalid event ID");
  }

  if (ticketCount < 1) {
    throw new ApiError(400, "Ticket count must be at least 1");
  }

  const aggregation = [];
  aggregation.push({
    $match: {
      _id: new mongoose.Types.ObjectId(eventId),
    },
  });
  aggregation.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "userDetails",
    },
  });
  aggregation.push({
    $unwind: "$userDetails",
  });
  aggregation.push({
    $project: {
      _id: 1,
      eventName: 1,
      eventDescription: 1,
      eventLocation: 1,
      eventStartDate: 1,
      eventEndDate: 1,
      eventTimeStart: 1,
      eventTimeEnd: 1,
      ticketPrice: 1,
      eventImage: 1,
      noOfSlots: 1,
      userId: 1,
      userDetails: {
        userId: "$userDetails.userId",
        name: "$userDetails.name",
        stripeAccountId: "$userDetails.stripeAccountId",
        stripeCustomerId: "$userDetails.stripeCustomerId",
      },
    },
  });
  const event = await VirtualEvent.aggregate(aggregation);
  if (!event || event.length === 0) {
    throw new ApiError(404, "Event not found");
  }

  const eventDetails = event[0];
  const { userDetails } = eventDetails;
  if (!userDetails.stripeCustomerId) {
    throw new ApiError(400, "User does not have a Stripe customer ID");
  }
  if (!userDetails.stripeAccountId) {
    throw new ApiError(400, "Event creator does not have a Stripe account ID");
  }

  // update the noOfSlots in the event
  if (eventDetails.noOfSlots < ticketCount) {
    throw new ApiError(
      400,
      `Not enough slots available. Only ${eventDetails.noOfSlots} slots left`
    );
  }


  const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
  const eventStartDate = eventDetails?.eventStartDate?.toISOString().split("T")[0];
  const eventStartDateTime = new Date(`${eventStartDate}T${eventDetails?.eventTimeStart}`);
  const eventEndDate = eventDetails?.eventEndDate?.toISOString().split("T")[0];
  const eventEndDateTime = new Date(`${eventEndDate}T${eventDetails?.eventTimeEnd}`);

  if (
    bookingDateTime < eventStartDateTime ||
    bookingDateTime > eventEndDateTime
  ) {
    throw new ApiError(
      400,
      "Booking date and time must be between event start and end dates and times"
    );
  }

  if (eventEndDateTime < new Date()) {
    throw new ApiError(400, "Event Already ended, cannot book tickets");
  }

  const ticketId = generateTicketId();

  const newBooking = await TicketBooking.create({
    userId: req.user.userId,
    eventId,
    ticketCount,
    totalPrice,
    bookingStatus: "pending",
    paymentStatus: "pending",
    bookingDate: bookingDateTime,
    bookingTime,
    ticketId,
  });

  const paymentDetails = await paymentSheet(
    req.user.stripeCustomerId,
    totalPrice,
    "usd",
    userDetails.stripeAccountId
  );

  if (!paymentDetails || !paymentDetails.paymentIntent) {
    throw new ApiError(500, "Failed to create payment intent");
  }

  return res.json(
    new ApiResponse(201, "Tickets booked successfully", {
      booking: newBooking,
      payment: paymentDetails,
    })
  );
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const { bookingId, bookingStatus, paymentStatus } = req.body;

  if (!isValidObjectId(bookingId)) {
    throw new ApiError(400, "Invalid booking ID");
  }

  const booking = await TicketBooking.findById(bookingId).populate(
    "eventId",
    "eventName eventLocation eventStartDate eventEndDate ticketPrice userId"
  );
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.bookingStatus === "completed") {
    throw new ApiError(400, "Booking is already completed");
  }

  if (!["booked", "cancelled"].includes(bookingStatus)) {
    throw new ApiError(
      400,
      "Invalid booking status. Must be 'booked' or 'cancelled'"
    );
  }
  if (!["pending", "completed", "failed"].includes(paymentStatus)) {
    throw new ApiError(
      400,
      "Invalid payment status. Must be 'pending', 'completed', or 'failed'"
    );
  }

  // const bookingDateTime = new Date(booking.bookingDate);
  const bookingDateTime = changeDateTimeZone(
    new Date(booking.bookingDate),
    req.headers?.timezone || "UTC"
  );

  const bookingDate = bookingDateTime.toISOString().split("T")[0];
  const bookingTime = convertTo12Hour(
    bookingDateTime.toTimeString().split(" ")[0]
  );
  if (bookingStatus === "booked" && paymentStatus === "completed") {
    const eventId = booking.eventId._id;
    const eventDetails = await VirtualEvent.findById(eventId);

    if (!eventDetails) {
      throw new ApiError(404, "Event not found");
    }

    if (eventDetails?.noOfSlots !== null && eventDetails?.noOfSlots !== undefined) {
      if (eventDetails.noOfSlots < booking.ticketCount) {
        throw new ApiError(
          400,
          `Not enough slots available. Only ${eventDetails.noOfSlots} slots left`
        );
      }

      // Update the noOfSlots in the event
      eventDetails.noOfSlots -= booking.ticketCount;

      await eventDetails.save();
    }
  }


  const qrCodeData = {
    ticketId: booking.ticketId,
    eventId: booking.eventId._id,
    eventName: booking.eventId.eventName,
    eventLocation: booking.eventId.eventLocation,
  };

  // base 64 encode the qrCodeData
  const qrCodeDataEncoded = Buffer.from(JSON.stringify(qrCodeData)).toString(
    "base64"
  );

  const eventDetails = {
    ticketId: booking.ticketId,
    eventId: booking.eventId._id,
    eventName: booking.eventId.eventName,
    date: bookingDate,
    time: bookingTime,
    venue: booking.eventId.eventLocation,
    noOfTickets: booking.ticketCount,
    attendeeName: req.user.name,
    price: booking.totalPrice,
    qrCodeData: qrCodeDataEncoded,
  };

  const ticketFilePath = await generateAndSendTicket(
    eventDetails,
    req.user.email
  );

  if (!ticketFilePath.success) {
    throw new ApiError(500, "Failed to generate and send ticket");
  }

  booking.bookingStatus = bookingStatus;
  booking.paymentStatus = paymentStatus;
  const updatedBooking = await booking.save();
  if (!updatedBooking) {
    throw new ApiError(500, "Failed to update booking status");
  }

  return res.json(
    new ApiResponse(200, "Booking status updated successfully", {
      updatedBooking,
      eventDetails,
      user: {
        userId: req.user.userId,
        name: req.user.name,
        email: req.user.email,
        profile_image: req.user.profile_image,
      }
    })
  );
});

const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  if (!isValidObjectId(bookingId)) {
    throw new ApiError(400, "Invalid booking ID");
  }

  const booking = await TicketBooking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  booking.bookingStatus = "cancelled";
  booking.paymentStatus = "failed";
  const updatedBooking = await booking.save();
  if (!updatedBooking) {
    throw new ApiError(500, "Failed to cancel booking");
  }

  return res.json(
    new ApiResponse(200, "Booking cancelled successfully", updatedBooking)
  );
});

const getBooking = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  const aggregation = [];
  aggregation.push({
    $match: {
      userId: req.user.userId,
    },
  });

  aggregation.push({
    $sort: { bookingDate: -1 },
  });

  aggregation.push({
    $lookup: {
      from: "virtualevents",
      localField: "eventId",
      foreignField: "_id",
      as: "eventDetails",
    },
  });

  aggregation.push({
    $unwind: "$eventDetails",
  });

  aggregation.push({
    $facet: {
      bookings: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            ticketId: 1,
            eventId: "$eventDetails._id",
            eventName: "$eventDetails.eventName",
            eventLocation: "$eventDetails.eventLocation",
            eventStartDate: "$eventDetails.eventStartDate",
            eventEndDate: "$eventDetails.eventEndDate",
            eventImage: "$eventDetails.eventImage",
            // ...getTimezoneDateProjection("bookingDate", req.headers?.timezone || "UTC", "bookingDate"),
            bookingDate: 1,
            bookingTime: 1,
            ticketCount: 1,
            totalPrice: 1,
            bookingStatus: 1,
            paymentStatus: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await TicketBooking.aggregate(aggregation);
  const bookings = result[0]?.bookings || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return res.json(
    new ApiResponse(
      200,
      bookings.length > 0
        ? "Bookings fetched successfully"
        : "No bookings found",
      bookings.length > 0
        ? {
          bookings,
          total_page: totalPages,
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );
});

const getAllTickets = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const aggregation = [];
  aggregation.push({
    $match: {
      eventId: new mongoose.Types.ObjectId(req.params.eventId),
    },
  });
  aggregation.push({
    $sort: { bookingDate: -1 },
  });
  aggregation.push({
    $lookup: {
      from: "virtualevents",
      localField: "eventId",
      foreignField: "_id",
      as: "eventDetails",
    },
  });
  aggregation.push({
    $unwind: "$eventDetails",
  });

  aggregation.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "userDetails",
    },
  });
  aggregation.push({
    $unwind: "$userDetails",
  });

  aggregation.push({
    $facet: {
      tickets: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            ticketId: 1,
            eventId: 1,
            userId: 1,
            eventDetails: {
              _id: "$eventDetails._id",
              eventName: "$eventDetails.eventName",
              eventLocation: "$eventDetails.eventLocation",
              // ...getTimezoneDateProjection("eventDetails.eventStartDate", req.headers?.timezone || "UTC", "eventStartDate"),
              // ...getTimezoneDateProjection("eventDetails.eventEndDate", req.headers?.timezone || "UTC", "eventEndDate"),
              eventStartDate: "$eventDetails.eventStartDate",
              eventEndDate: "$eventDetails.eventEndDate",
              eventTimeStart: "$eventDetails.eventTimeStart",
              eventTimeEnd: "$eventDetails.eventTimeEnd",
              eventImage: "$eventDetails.eventImage",
            },
            userDetails: {
              userId: "$userDetails.userId",
              email: "$userDetails.email",
              mobile: "$userDetails.mobile",
              profile_image: "$userDetails.profile_image",
              name: "$userDetails.name",
            },
            // ...getTimezoneDateProjection("bookingDate", req.headers?.timezone || "UTC", "bookingDate"),
            bookingDate: 1,
            bookingTime: 1,
            ticketCount: 1,
            totalPrice: 1,
            bookingStatus: 1,
            paymentStatus: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await TicketBooking.aggregate(aggregation);

  const tickets = result[0]?.tickets || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return res.json(
    new ApiResponse(
      200,
      tickets.length > 0 ? "Tickets fetched successfully" : "No tickets found",
      tickets.length > 0
        ? {
          tickets,
          total_page: totalPages,
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );
});

const getEventDropdown = asyncHandler(async (req, res) => {
  const aggregation = [];
  aggregation.push({
    $match: {
      userId: req.user.userId,
    },
  });
  aggregation.push({
    $project: {
      _id: 1,
      eventName: 1,
    },
  });

  const events = await VirtualEvent.aggregate(aggregation);
  return res.json(
    new ApiResponse(200, "Event dropdown fetched successfully", events)
  );
});

const getAllCancelledTickets = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const aggregation = [];

  aggregation.push({
    $match: {
      eventId: new mongoose.Types.ObjectId(req.params.eventId),
      bookingStatus: "cancelled",
    },
  });

  aggregation.push({
    $sort: { bookingDate: -1 },
  });

  aggregation.push({
    $lookup: {
      from: "virtualevents",
      localField: "eventId",
      foreignField: "_id",
      as: "eventDetails",
    },
  });

  aggregation.push({
    $unwind: "$eventDetails",
  });

  aggregation.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "userDetails",
    },
  });

  aggregation.push({
    $unwind: "$userDetails",
  });

  aggregation.push({
    $facet: {
      cancelledTickets: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            ticketId: 1,
            eventId: 1,
            userId: 1,
            eventDetails: {
              _id: "$eventDetails._id",
              eventName: "$eventDetails.eventName",
              eventLocation: "$eventDetails.eventLocation",
              // ...getTimezoneDateProjection("eventDetails.eventStartDate", req.headers?.timezone || "UTC", "eventStartDate"),
              // ...getTimezoneDateProjection("eventDetails.eventEndDate", req.headers?.timezone || "UTC", "eventEndDate"),
              eventStartDate: "$eventDetails.eventStartDate",
              eventEndDate: "$eventDetails.eventEndDate",
              eventTimeStart: "$eventDetails.eventTimeStart",
              eventTimeEnd: "$eventDetails.eventTimeEnd",
              eventImage: "$eventDetails.eventImage",
            },
            userDetails: {
              userId: "$userDetails.userId",
              email: "$userDetails.email",
              mobile: "$userDetails.mobile",
              profile_image: "$userDetails.profile_image",
              name: "$userDetails.name",
            },
            // ...getTimezoneDateProjection("bookingDate", req.headers?.timezone || "UTC", "bookingDate"),
            bookingDate: 1,
            bookingTime: 1,
            ticketCount: 1,
            totalPrice: 1,
            bookingStatus: 1,
            paymentStatus: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await TicketBooking.aggregate(aggregation);


  const cancelledTickets = result[0]?.cancelledTickets || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return res.json(
    new ApiResponse(
      200,
      cancelledTickets.length > 0
        ? "Cancelled tickets fetched successfully"
        : "No cancelled tickets found",
      cancelledTickets.length > 0
        ? {
          tickets: cancelledTickets,
          total_page: totalPages,
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );
});

const ticketExhaust = asyncHandler(async (req, res) => {
  const { eventId, ticketId } = req.body;

  const event = await VirtualEvent.findById(eventId);
  if (!event) {
    throw new ApiError(400, "Event not found");
  }

  if (event.userId !== req.user.userId) {
    throw new ApiError(400, "You are not authorized to exhaust this ticket");
  }

  const ticket = await TicketBooking.findOne({ ticketId: ticketId });
  if (!ticket) {
    throw new ApiError(400, "Ticket not found");
  }

  if (ticket.bookingStatus === "used") {
    throw new ApiError(400, "Ticket is already used");
  }

  if (ticket.bookingStatus !== "booked") {
    throw new ApiError(400, "Ticket is not booked");
  }



  //   throw new ApiError(400, "Ticket is not booked");

  const updatedTicket = await TicketBooking.findOneAndUpdate(
    { ticketId: ticketId },
    {
      $set: {
        bookingStatus: "used",
      },
    },
    { new: true }
  ).populate("eventId", "eventName eventLocation eventStartDate eventEndDate ticketPrice userId");

  const user = await User.findOne({ userId: updatedTicket.userId }).select(
    "userId name email profile_image");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  updatedTicket.user = user;

  return res.json(
    new ApiResponse(200, "Ticket exhausted successfully", updatedTicket)
  );
});


const registration = asyncHandler(async (req, res) => {
  const { eventId, email, name } = req.body;

  if (!isValidObjectId(eventId)) {
    throw new ApiError(400, "Invalid event ID");
  }

  const event = await VirtualEvent.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // check if the user is already registered for the event
  const existingRegistration = await EventLoginUser.findOne({
    eventId: eventId,
    email: email,
  });
  if (existingRegistration) {
    throw new ApiError(400, "User is already registered for this event");
  }

  // generate unique Username 
  const username = await generateUniqueUsername();
  if (!username) {
    throw new ApiError(500, "Failed to generate unique username");
  }

  const password = await generateRandomPassword(8);
  if (!password) {
    throw new ApiError(500, "Failed to generate random password");
  }

  // send the password to the user via email
  const sendEventLoginHtml = await sendEventLoginCredentialEmail(username, password);
  const send = await sendEmail(
    email,
    "Virtual Event Login Credentials",
    sendEventLoginHtml
  );

  if (!send.success) {
    throw new ApiError(500, "Failed to send event login credentials email");
  }

  const newRegistration = new EventLoginUser({
    eventId: eventId,
    email: email,
    name: name,
    username: username,
    password: password,
    userId: req.user.userId,
  });
  const savedRegistration = await newRegistration.save();
  if (!savedRegistration) {
    throw new ApiError(500, "Failed to register for the event");
  }

  return res.json(
    new ApiResponse(200, "Registration successful", savedRegistration)
  );
});



const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await EventLoginUser.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    let refreshToken = user.refreshToken;
    try {
      jwt.verify(refreshToken, secret.REFRESH_TOKEN_SECRET);
    } catch (error) {
      refreshToken = user.generateRefreshToken();
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
    }

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};


const loginEventUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    throw new ApiError(400, "Username and password are required");
  }
  const user = await EventLoginUser.findOne({ username: username }).populate(
    "eventId",
    "eventName eventLocation eventStartDate eventEndDate eventTimeEnd eventTimeStart ticketPrice userId"
  );

  const eventEndDate = user?.eventId?.eventEndDate?.toISOString().split("T")[0];
  const eventEndDateTime = new Date(`${eventEndDate}T${user?.eventId?.eventTimeEnd}`);
  if (eventEndDateTime < new Date()) {
    throw new ApiError(400, "Event has already ended, cannot login");
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.password !== password) {
    throw new ApiError(401, "Invalid password");
  }
  // Send Access & Refresh Token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await EventLoginUser.findById(user._id).select('-__v -password -createdAt -updatedAt');
  // cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User Logged in Successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );

});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken = req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is required");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      secret.REFRESH_TOKEN_SECRET
    );

    const user = await EventLoginUser.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(404, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    //Generate a new Access Token and update the refresh token of the user
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, "Access Token refreshed Successfully", {
          accessToken,
          refreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Token");
  }
});

const getAllEvents = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const { search, sortBy, sortOrder } = req.query;
  const aggregation = [];

  const role = req.user.role;

  if (!role.includes("admin")) {
    throw new ApiError(403, "You are not authorized to access this resource");
  }

  aggregation.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "user",
    }
  });

  aggregation.push({
    $unwind: {
      path: "$user",
      preserveNullAndEmptyArrays: true
    }
  });


  aggregation.push({
    $lookup: {
      from: "eventloginusers",
      localField: "_id",
      foreignField: "eventId",
      as: "eventManager",
    }
  });



  if (search) {
    aggregation.push({
      $match: {
        $or: [
          { eventName: { $regex: search, $options: "i" } },
          { eventLocation: { $regex: search, $options: "i" } },
          { "user.name": { $regex: search, $options: "i" } },
        ]
      }
    });
  }

  aggregation.push({
    $sort: {
      [sortBy || "createdAt"]: sortOrder === "asc" ? 1 : -1,
    },
  });


  aggregation.push({
    $facet: {
      events: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            eventName: 1,
            eventDescription: 1,
            eventLocation: 1,
            eventStartDate: 1,
            eventEndDate: 1,
            eventTimeStart: 1,
            eventTimeEnd: 1,
            ticketPrice: 1,
            eventImage: 1,
            userId: 1,
            status: 1,
            eventManager: {
              $map: {
                input: "$eventManager",
                as: "manager",
                in: {
                  userId: "$$manager.userId",
                  name: "$$manager.name",
                  email: "$$manager.email",
                  username: "$$manager.username",
                  password: "$$manager.password",
                },
              },
            },
            user: {
              userId: "$user.userId",
              name: "$user.name",
              email: "$user.email",
              mobile: "$user.mobile",
              profile_image: "$user.profile_image",
            },
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });


  const result = await VirtualEvent.aggregate(aggregation);

  const events = result[0]?.events || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(
      200,
      events.length ? "Events fetched successfully" : "No Events found",
      {
        events,
        total_page: totalPages,
        current_page: page,
        total_records: totalCount,
        per_page: limit,
      }
    )
  );
});

const getEventDetails = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  if (!isValidObjectId(eventId)) {
    throw new ApiError(400, "Invalid event ID");
  }

  const event = await VirtualEvent.findById(eventId).populate("userId", "name email mobile profile_image");

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  res.json(
    new ApiResponse(200, "Event details fetched successfully", {
      event,
    })
  );
});


const udpateEventStatus = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { status } = req.body;
  if (!isValidObjectId(eventId)) {
    throw new ApiError(400, "Invalid event ID");
  }

  const event = await VirtualEvent.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }
  if (!["approved", "rejected"].includes(status)) {
    throw new ApiError(400, "Invalid status. Must be 'approved' or 'rejected'");
  }

  const role = req.user.role;
  if (!role.includes("admin")) {
    throw new ApiError(403, "You are not authorized to update this event status");
  }
  event.status = status;
  const updatedEvent = await event.save();

  res.json(
    new ApiResponse(200, "Event status updated successfully", {
      event: updatedEvent,
    })
  );
});

export {
  addEvent,
  getEvents,
  myEvenets,
  eventDetails,
  bookTickets,
  updateBookingStatus,
  cancelBooking,
  getBooking,
  updateEvent,
  getAllTickets,
  getEventDropdown,
  getAllCancelledTickets,
  ticketExhaust,
  registration,
  loginEventUser,
  refreshAccessToken,
  getAllEvents,
  getEventDetails,
  udpateEventStatus
};
