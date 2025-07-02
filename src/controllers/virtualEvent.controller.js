import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import VirtualEvent from "../models/virtualEvent.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadImage } from "../utils/awsS3Utils.js";
import { isValidObjectId } from "../utils/isValidObjectId.js";
import TicketBooking from "../models/ticketBooking.model.js";
import { paymentSheet } from "../services/stripeService.js";
import { generateAndSendTicket } from "../services/generateTicket.js";
import { convertTo12Hour, generateTicketId } from "../utils/HelperFunctions.js";


const addEvent = asyncHandler(async (req, res) => {

    const {
        eventName,
        eventDescription,
        eventLocation,
        eventStartDate,
        eventEndDate,
        ticketPrice
    } = req.body;


    const isKYCCompleted = req.user?.isKYCVerified;
    if (!isKYCCompleted) {
        throw new ApiError(403, "KYC verification is required to create a virtual event");
    }

    // eventName is unique, so we check if it already exists
    const existingEvent = await VirtualEvent.findOne({ eventName });
    if (existingEvent) {
        throw new ApiError(400, "Event with this name already exists");
    }



    if(new Date(eventStartDate) < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        throw new ApiError(400, "Event start date cannot be in the past");
    }

    if (new Date(eventStartDate) > new Date(eventEndDate)) {
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
        eventStartDate,
        eventEndDate,
        ticketPrice,
        eventImage: eventImageUrl ? eventImageUrl : 'https://social-bucket-p8c1ayeq.s3.us-east-1.amazonaws.com/eventImage-1751367872913-592757111.png',
        userId: req.user.userId
    });

    const savedEvent = await newEvent.save();
    if (!savedEvent) {
        throw new ApiError(400, "Skill is required");
    }

    return res.status(201).json(new ApiResponse(200, "Virtual event created successfully", savedEvent));
});

const getEvents = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // Search Event By Event Name or User Name
    const searchQuery = req.query.search || "";
    const searchRegex = new RegExp(searchQuery, "i");

    const userId = req.query.userId || req.user.userId;

    const aggregation = [];



    aggregation.push({
        $match: {
            $or: [
                { eventStartDate: { $gte: new Date() } },
                { eventEndDate: { $lte: new Date() } }
            ]
        }
    });

    aggregation.push({
        $sort: { createdAt: -1 }
    });
    aggregation.push({
        $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "userId",
            as: "userDetails"
        }
    });
    aggregation.push({
        $unwind: "$userDetails",
    });

    if (searchQuery) {
        aggregation.push({
            $match: {
                $or: [
                    { eventName: searchRegex },
                    { "userDetails.name": searchRegex }
                ]
            }
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
                        ticketPrice: 1,
                        eventImage: 1,
                        userId: 1,
                        userDetails: {
                            userId: "$userDetails.userId",
                            name: "$userDetails.name",
                            email: "$userDetails.email",
                            profile_image: "$userDetails.profile_image"
                        }
                    }
                },
            ],
            totalCount: [{ $count: "count" }],
        }
    });


    const result = await VirtualEvent.aggregate(aggregation);

    const totalCount = result.length > 0 ? result[0].totalCount[0]?.count || 0 : 0;
    const virtualEvents = result.length > 0 ? result[0].virtualEvents : [];

    res.json(
        new ApiResponse(
            200,
            virtualEvents.length > 0 ? "Virtual events fetched successfully" : "No virtual events found",
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

    const userId = req.user.userId;

    const aggregation = [];

    aggregation.push({
        $match: {
            userId: userId,
        }
    });

    aggregation.push({
        $sort: { eventStartDate: 1 }
    });

    aggregation.push({
        $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "userId",
            as: "userDetails"
        }
    });

    aggregation.push({
        $unwind: "$userDetails",
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
                        eventStartDate: 1,
                        eventEndDate: 1,
                        ticketPrice: 1,
                        eventImage: 1,
                        userId: 1,
                        userDetails: {
                            userId: "$userDetails.userId",
                            name: "$userDetails.name",
                            email: "$userDetails.email",
                            profile_image: "$userDetails.profile_image"
                        }
                    }
                },
            ],
            totalCount: [{ $count: "count" }],
        }
    });

    const result = await VirtualEvent.aggregate(aggregation);

    const totalCount = result.length > 0 ? result[0].totalCount[0]?.count || 0 : 0;
    const virtualEvents = result.length > 0 ? result[0].virtualEvents : [];

    res.json(
        new ApiResponse(
            200,
            virtualEvents.length > 0 ? "Virtual events fetched successfully" : "No virtual events found",
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


const eventDetails = asyncHandler(async (req, res) => {
    const eventId = req.params.id;
    if (!isValidObjectId(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }

    const aggregation = [];
    aggregation.push({
        $match: {
            _id: new mongoose.Types.ObjectId(eventId)
        }
    });
    aggregation.push({
        $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "userId",
            as: "userDetails"
        }
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
            ticketPrice: 1,
            eventImage: 1,
            userId: 1,
            userDetails: {
                userId: "$userDetails.userId",
                name: "$userDetails.name",
                email: "$userDetails.email",
                profile_image: "$userDetails.profile_image"
            }
        }
    });
    const event = await VirtualEvent.aggregate(aggregation);

    return res.json(new ApiResponse(200, event.length > 0 ? "Event details fetched successfully" : "Event not found", event.length > 0 ? event[0] : null));
});

const bookTickets = asyncHandler(async (req, res) => {
    const { eventId, ticketCount, totalPrice, bookingDate, bookingTime } = req.body;
    if (!isValidObjectId(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }

    if (ticketCount < 1) {
        throw new ApiError(400, "Ticket count must be at least 1");
    }

    // const event = await VirtualEvent.findById(eventId).populate("userId", "userId stripeAccountId");
    const aggregation = [];
    aggregation.push({
        $match: {
            _id: new mongoose.Types.ObjectId(eventId)
        }
    });
    aggregation.push({
        $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "userId",
            as: "userDetails"
        }
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
            ticketPrice: 1,
            eventImage: 1,
            userId: 1,
            userDetails: {
                userId: "$userDetails.userId",
                name: "$userDetails.name",
                stripeAccountId: "$userDetails.stripeAccountId",
                stripeCustomerId: "$userDetails.stripeCustomerId",
            }
        }
    });
    const event = await VirtualEvent.aggregate(aggregation);
    if (!event || event.length === 0) {
        throw new ApiError(404, "Event not found");
    }

    const { userDetails } = event[0];
    if (!userDetails.stripeCustomerId) {
        throw new ApiError(400, "User does not have a Stripe customer ID");
    }
    if (!userDetails.stripeAccountId) {
        throw new ApiError(400, "Event creator does not have a Stripe account ID");
    }

    if(new Date(bookingDate) <= new Date(event[0].eventStartDate) && new Date(bookingDate) >= new Date(event[0].eventEndDate)) {
        throw new ApiError(400, "Booking date must be between event start and end dates");
    }


    const ticketId = generateTicketId();

    const newBooking = await TicketBooking.create({
        userId: req.user.userId,
        eventId,
        ticketCount,
        totalPrice,
        bookingStatus: "booked",
        paymentStatus: "pending",
        bookingDate,
        bookingTime,
        ticketId
    });


    const paymentDetails = await paymentSheet(
        req.user.stripeCustomerId,
        totalPrice,
        'usd',
        userDetails.stripeAccountId,
    );

    if (!paymentDetails || !paymentDetails.paymentIntent) {
        throw new ApiError(500, "Failed to create payment intent");
    }

    return res.json(new ApiResponse(201, "Tickets booked successfully", { booking: newBooking, payment: paymentDetails }));
});


const updateBookingStatus = asyncHandler(async (req, res) => {
    const { bookingId, bookingStatus, paymentStatus } = req.body;

    if (!isValidObjectId(bookingId)) {
        throw new ApiError(400, "Invalid booking ID");
    }

    const booking = await TicketBooking.findById(bookingId).populate("eventId", "eventName eventLocation eventStartDate eventEndDate ticketPrice userId");
    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    if (booking.bookingStatus === "completed") {
        throw new ApiError(400, "Booking is already completed");
    }

    if (!["booked", "cancelled"].includes(bookingStatus)) {
        throw new ApiError(400, "Invalid booking status. Must be 'booked' or 'cancelled'");
    }
    if (!["pending", "completed", "failed"].includes(paymentStatus)) {
        throw new ApiError(400, "Invalid payment status. Must be 'pending', 'completed', or 'failed'");
    }

    const bookingTime12 = convertTo12Hour(booking.bookingTime);

    const qrCodeData = `${booking.ticketId}-${booking.eventId._id}`;
    const eventDetails = {
        ticketId: booking.ticketId,
        eventId: booking.eventId._id,
        eventName: booking.eventId.eventName,
        date: booking.bookingDate.toISOString().split('T')[0],
        time: bookingTime12,
        venue: booking.eventId.eventLocation,
        noOfTickets: booking.ticketCount,
        attendeeName: req.user.name,
        price: booking.totalPrice,
        qrcode: qrCodeData
    };

    const ticketFilePath = await generateAndSendTicket(eventDetails, req.user.email);

    // console.log("Ticket file path:", ticketFilePath);
    if (!ticketFilePath.success) {
        throw new ApiError(500, "Failed to generate and send ticket");
    }

    booking.bookingStatus = bookingStatus;
    booking.paymentStatus = paymentStatus;
    const updatedBooking = await booking.save();
    if (!updatedBooking) {
        throw new ApiError(500, "Failed to update booking status");
    }

    return res.json(new ApiResponse(200, "Booking status updated successfully", { updatedBooking, eventDetails }));
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

    return res.json(new ApiResponse(200, "Booking cancelled successfully", updatedBooking));
});


const getBooking = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;
    const aggregation = [];
    aggregation.push({
        $match: {
            userId: req.user.userId
        }
    });

    aggregation.push({
        $sort: { bookingDate: -1 }
    });

    aggregation.push({
        $lookup: {
            from: "virtualevents",
            localField: "eventId",
            foreignField: "_id",
            as: "eventDetails"
        }
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
                        bookingDate: 1,
                        bookingTime: 1,
                        ticketCount: 1,
                        totalPrice: 1,
                        bookingStatus: 1,
                        paymentStatus: 1,
                    }
                },
            ],
            totalCount: [{ $count: "count" }],
        }
    });


    const result = await TicketBooking.aggregate(aggregation);
    const bookings = result[0]?.bookings || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);


    return res.json(new ApiResponse(200, bookings.length > 0 ? "Bookings fetched successfully" : "No bookings found", bookings.length > 0 ? {
        bookings,
        total_page: totalPages,
        current_page: page,
        total_records: totalCount,
        per_page: limit,
    } : null));



});


export {
    addEvent,
    getEvents,
    myEvenets,
    eventDetails,
    bookTickets,
    updateBookingStatus,
    cancelBooking,
    getBooking
};
