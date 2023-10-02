import { Router } from "express"
import { validationCoreFunction } from "../../middlewares/validation.middleware.js"
import { addUserContactInfo, deleteUserContactInfo, setDeliveryAddress, updateUserContactInfo } from "./contactInfo.controller.js"
import { addUserContactInfoSchema, deleteUserContactInfoSchema, setDeliveryAddressSchema, updateUserContactInfoSchema } from "../../validators/contactInfo.validator.js"
import auth,{allowTo} from "../../middlewares/auth.middleware.js";
import { systemRoles } from '../../utils/systemRoles.js'

const router = Router()

router.route("/")
            .post(auth(),allowTo([systemRoles.USER]),validationCoreFunction(addUserContactInfoSchema),addUserContactInfo)
            .put(auth(),allowTo([systemRoles.USER]),validationCoreFunction(updateUserContactInfoSchema),updateUserContactInfo)
            .delete(auth(),allowTo([systemRoles.USER]),validationCoreFunction(deleteUserContactInfoSchema),deleteUserContactInfo)
router.patch("/:id",auth(),allowTo([systemRoles.USER]),validationCoreFunction(setDeliveryAddressSchema),setDeliveryAddress)

export default router
