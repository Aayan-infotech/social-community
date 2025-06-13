import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import errorHandler from "../middlewares/errorhandler.middleware.js";
import {
    virtualEventSchema,
    bookTicketSchema,
    updateBookingStatusSchema,
} from "../validators/virtualEventValidator.js";
import {
    addEvent,
    getEvents,
    myEvenets,
    eventDetails,
    bookTickets,
    updateBookingStatus,
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

export default router;
