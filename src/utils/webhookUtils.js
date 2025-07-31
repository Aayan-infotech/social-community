import TicketBooking from "../models/ticketBooking.model.js";
import { User } from "../models/user.model.js";
import VirtualEvent from "../models/virtualEvent.model.js";
import { generateAndSendTicket } from "../services/generateTicket.js";
import { ApiError } from "./ApiError.js";
import { isValidObjectId } from "./isValidObjectId.js";

export const updateVirtualEventStatus = async (bookingId, bookingStatus, paymentStatus) => {
    try {
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

        const user = await User.findOne({ userId: booking.userId }).select("userId name email profile_image");


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
            date: booking.bookingDate,
            time: booking.bookingTime,
            venue: booking.eventId.eventLocation,
            noOfTickets: booking.ticketCount,
            attendeeName: user.name,
            price: booking.totalPrice,
            qrCodeData: qrCodeDataEncoded,
        };

        const ticketFilePath = await generateAndSendTicket(
            eventDetails,
            user.email,
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
        console.log("Booking status updated successfully:", updatedBooking);
        console.log("Event details:", eventDetails);
        console.log("User details:", user);

        return {
            updatedBooking,
            eventDetails,
            user
        };



    } catch (error) {
        console.error("Error updating virtual event status:", error);
        throw new ApiError(500, "Failed to update virtual event status", error.message);
    }
};