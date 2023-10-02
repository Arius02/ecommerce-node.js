import { Router } from "express";
import {addCoupon,updateCoupon,deleteCoupon,getAllCoupons} from "./coupon.controller.js"
import { addCouponSchema, deleteCouponSchema, updateCouponSchema } from "../../validators/coupon.validator.js";
import { validationCoreFunction } from "../../middlewares/validation.middleware.js";
import auth,{allowTo} from "../../middlewares/auth.middleware.js";
import { systemRoles } from '../../utils/systemRoles.js'
const router = Router()
router.route("/")
            .post(auth(),allowTo([systemRoles.SUPER_ADMIN,systemRoles.ADMIN]),validationCoreFunction(addCouponSchema),addCoupon)
            .get(auth(),allowTo([systemRoles.SUPER_ADMIN,systemRoles.ADMIN]),getAllCoupons)
router.route("/:_id")
.put(auth(),allowTo([systemRoles.SUPER_ADMIN,systemRoles.ADMIN]),validationCoreFunction(updateCouponSchema),updateCoupon)
.delete(auth(),allowTo([systemRoles.SUPER_ADMIN,systemRoles.ADMIN]),validationCoreFunction(deleteCouponSchema),deleteCoupon)


export default router