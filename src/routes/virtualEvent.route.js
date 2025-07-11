import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import errorHandler from "../middlewares/errorhandler.middleware.js";
import {
    virtualEventSchema,
    bookTicketSchema,
    updateBookingStatusSchema,
    cancelBookingSchema,
} from "../validators/virtualEventValidator.js";
import {
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
} from "../controllers/virtualEvent.controller.js";

const router = Router();

router.post(
    "/add",
    verifyJWT,
    upload.fields([
        {
            name: "eventImage",
            maxCount: 1,
        },
    ]),
    errorHandler,
    validateRequest(virtualEventSchema),
    addEvent
);
router.put("/update/:id",
    verifyJWT,
    upload.fields([
        {
            name: "eventImage",
            maxCount: 1,
        },
    ]),
    errorHandler,
    validateRequest(virtualEventSchema),
    updateEvent
);

router.get("/get", verifyJWT, getEvents);
router.get("/my-events", verifyJWT, myEvenets);
router.get("/event-details/:id", verifyJWT, eventDetails);
router.post(
    "/book-tickets",
    verifyJWT,
    validateRequest(bookTicketSchema),
    bookTickets
);
router.put(
    "/update-booking-status",
    verifyJWT,
    validateRequest(updateBookingStatusSchema),
    updateBookingStatus
);
router.post('/cancel-booking',verifyJWT,validateRequest(cancelBookingSchema),cancelBooking);
router.get('/get-booking',verifyJWT,getBooking);
router.get('/getAllTickets/:eventId',verifyJWT,getAllTickets);
router.get('/getEventDropdown',verifyJWT,getEventDropdown);
router.get('/getCancelledTickets/:eventId',verifyJWT,getAllCancelledTickets);

export default router;
