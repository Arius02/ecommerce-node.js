import { Router } from "express";
import { validationCoreFunction } from "../../middlewares/validation.middleware.js";
import {
  addToCartForUser,
  applyCouponToCart,
  clearUserCart,
  clearGuestCart,
  getLoggedUserCart,
  removeFromCartForUser,
  removeFromCartForGuest,
  addToCartForGuest,
  getGuestCart,
  mergeCart,
} from "./cart.controller.js";
import {
  addToCartSchema,
  addToCartSchemaForGuest,
  applyCouponSchema,
  removeFromCartSchema,
} from "../../validators/cart.validator.js";
import auth, { allowTo } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
const router = Router();
router
  .route("/")
  .post(
    auth(),
    allowTo([systemRoles.USER]),
    validationCoreFunction(addToCartSchema),
    addToCartForUser
  )
  .patch(
    auth(),
    allowTo([systemRoles.USER]),
    validationCoreFunction(removeFromCartSchema),
    removeFromCartForUser
  )
  .delete(auth(), clearUserCart)
  .get(auth(), getLoggedUserCart);
router.get("/guset/:cartId", getGuestCart);

router.post(
  "/guest",
  validationCoreFunction(addToCartSchemaForGuest),
  addToCartForGuest
);
router.patch(
  "/guest",
  validationCoreFunction(removeFromCartSchema),
  removeFromCartForGuest
);
router.delete("/guest/", clearGuestCart);
router.put("/merge", auth(), mergeCart);

router.put(
  "/applyCoupon",
  auth(),
  allowTo([systemRoles.USER]),
  validationCoreFunction(applyCouponSchema),
  applyCouponToCart
);
export default router;
