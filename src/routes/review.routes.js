import { Router } from "express";
import { createReview, getHostelReviews } from "../controllers/review.controller.js";
import validate from "../middlewares/validate.js";
import { createReviewSchema } from "../validators/review.validator.js";

const router = Router();

router.post("/hostels/:hostelId/reviews", validate(createReviewSchema), createReview);
router.get("/hostels/:hostelId/reviews", getHostelReviews);

export default router;