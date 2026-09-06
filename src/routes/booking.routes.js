import { Router } from "express";
import { createBooking, getOwnerBookings, getBookingById, updateBookingStatus } from "../controllers/booking.controller.js";
import { authenticateOwner } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { createBookingSchema, updateBookingStatusSchema } from "../validators/booking.validator.js";

const router = Router();

router.post("/hostels/:hostelId/book", validate(createBookingSchema), createBooking);

router.use(authenticateOwner);

router.get("/", getOwnerBookings);
router.get("/:id", getBookingById);
router.patch("/:id/status", validate(updateBookingStatusSchema), updateBookingStatus);

export default router;