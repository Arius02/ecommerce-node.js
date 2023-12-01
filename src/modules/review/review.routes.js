import { Router } from "express";
import {
  addReview,
  deleteReview,
  getProductReviews,
  isAllowToRev,
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
  .post(
    auth(),
    allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
    validationCoreFunction(addReviewSchema),
    addReview
  )
  .put(
    auth(),
    allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
    validationCoreFunction(updateReviewSchema),
    updateReview
  );
router.delete(
  "/:productId/:reviewId",
  auth(),
  allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
  validationCoreFunction(deleteReviewSchema),
  deleteReview
);
router.get(
  "/:productId",
  validationCoreFunction(getProductReviewsSchema),
  getProductReviews
);
router.get("/allow/:productId", auth(), isAllowToRev);

export default router;
