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
    ticketExhaustSchema,
    registrationSchema,
    EventLoginUserSchema
} from "../validators/virtualEventValidator.js";
import {
    addEvent,
    getEvents,
    myEvents,
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
    updateEventStatus,
    getEventDashboard,
    repayment
} from "../controllers/virtualEvent.controller.js";
import { verifyEventAuth } from "../middlewares/eventAuth.middleware.js";

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
router.get("/my-events", verifyJWT, myEvents);
router.get("/event-details/:id", verifyJWT, eventDetails);
router.post(
    "/book-tickets",
    verifyJWT,
    validateRequest(bookTicketSchema),
    bookTickets
);
router.post('/repayment', verifyJWT, repayment);
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

// Registration
router.post('/registration',verifyJWT,validateRequest(registrationSchema),registration);
router.post('/eventlogin',validateRequest(EventLoginUserSchema),loginEventUser);
router.post('/ticket-exhaust',verifyEventAuth,validateRequest(ticketExhaustSchema),ticketExhaust);
router.post('/refresh-access-token',refreshAccessToken);


// Get all events for admin
router.get('/getAllEvents', verifyJWT, getAllEvents);
router.get('/getEventDetails/:eventId',verifyJWT,getEventDetails);
router.put('/updateEvent/:eventId',verifyJWT,updateEventStatus);

router.get('/getEventDashboard',verifyJWT,getEventDashboard);

export default router;
