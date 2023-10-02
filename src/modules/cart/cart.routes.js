import { Router,  } from "express";
import { validationCoreFunction } from "../../middlewares/validation.middleware.js";
import {addToCart, applyCouponToCart, clearCart, getLoggedUserCart, removeFromCart} from"./cart.controller.js"
import { addToCartSchema, applyCouponSchema, removeFromCartSchema } from "../../validators/cart.validator.js";
import auth,{allowTo} from "../../middlewares/auth.middleware.js";
import { systemRoles } from '../../utils/systemRoles.js'
const router = Router()
router.route("/")
            .post(auth(), allowTo([systemRoles.USER]),validationCoreFunction(addToCartSchema),addToCart)
            .get(auth(),getLoggedUserCart)
            .delete(auth(),clearCart)
router.patch("/:_id", auth(),allowTo([systemRoles.USER]),validationCoreFunction(removeFromCartSchema),removeFromCart)
router.put("/applyCoupon", auth(),allowTo([systemRoles.USER]),validationCoreFunction(applyCouponSchema),applyCouponToCart)
export default router
