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
  reduceFromUserCart,
  reduceFromCartForGuest,
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
    allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
    validationCoreFunction(addToCartSchema),
    addToCartForUser
  )
  .patch(
    auth(),
    allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
    validationCoreFunction(removeFromCartSchema),
    removeFromCartForUser
  )
  .put(
    auth(),
    allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
    validationCoreFunction(removeFromCartSchema),
    reduceFromUserCart
  )
  .delete(
    auth(),
    allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
    clearUserCart
  )
  .get(
    auth(),
    allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
    getLoggedUserCart
  );
router.get("/guset/:cartId", getGuestCart);

router.post(
  "/guest",
  validationCoreFunction(addToCartSchemaForGuest),
  addToCartForGuest
);
router
  .route("/guest")
  .patch(validationCoreFunction(removeFromCartSchema), removeFromCartForGuest)
  .put(validationCoreFunction(removeFromCartSchema), reduceFromCartForGuest);
router.delete("/guest/", clearGuestCart);
router.put("/merge", auth(), mergeCart);

router.put(
  "/applyCoupon",
  auth(),
  allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
  validationCoreFunction(applyCouponSchema),
  applyCouponToCart
);
export default router;
