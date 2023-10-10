import { Router } from "express";
import {
  addReview,
  deleteReview,
  getProductReviews,
  updateReview,
} from "./review.controller.js";
import { validationCoreFunction } from "../../middlewares/validation.middleware.js";
import {
  addReviewSchema,
  updateReviewSchema,
  deleteReviewSchema,
  getProductReviewsSchema,
} from "../../validators/review.validator.js";
import auth, { allowTo } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
const router = Router();

router
  .route("/")
  .post(auth(), validationCoreFunction(addReviewSchema), addReview)
  .put(
    auth(),
    allowTo([systemRoles.USER]),
    validationCoreFunction(updateReviewSchema),
    updateReview
  );
router.delete(
  "/:reviewId",
  auth(),
  allowTo([systemRoles.USER]),
  validationCoreFunction(deleteReviewSchema),
  deleteReview
);
router.get(
  "/:productId",
  validationCoreFunction(getProductReviewsSchema),
  getProductReviews
);

export default router;
