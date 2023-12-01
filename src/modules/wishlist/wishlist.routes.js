import { Router } from "express";
import { toggleWishlist, getAllUserWishlist } from "./wishlist.controller.js";
import { validationCoreFunction } from "../../middlewares/validation.middleware.js";
import { wishlistSchema } from "../../validators/wishlist.validator.js";
import auth, { allowTo } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
const router = Router();

router
  .route("/")
  .patch(
    auth(),
    allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
    validationCoreFunction(wishlistSchema),
    toggleWishlist
  )
  .get(
    auth(),
    allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
    getAllUserWishlist
  );

export default router;
