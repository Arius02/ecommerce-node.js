import { Router } from "express";
import {addToWishlist,removeFromWishlist,getAllUserWishlist} from "./wishlist.controller.js"
import { validationCoreFunction } from "../../middlewares/validation.middleware.js";
import { wishlistSchema } from "../../validators/wishlist.validator.js";
import auth,{allowTo} from "../../middlewares/auth.middleware.js";
import { systemRoles } from '../../utils/systemRoles.js'
const router = Router()

router.route("/")
            .patch(auth(),allowTo([systemRoles.USER]),validationCoreFunction(wishlistSchema), addToWishlist)
            .delete(auth(),allowTo([systemRoles.USER]),validationCoreFunction(wishlistSchema), removeFromWishlist)
            .get(auth(),allowTo([systemRoles.USER]),getAllUserWishlist)


export default router
