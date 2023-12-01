import { Router } from "express";
import { validationCoreFunction } from "../../middlewares/validation.middleware.js";
import {
  addUserContactInfo,
  deleteUserContactInfo,
  setDeliveryAddress,
} from "./contactInfo.controller.js";
import {
  addUserContactInfoSchema,
  deleteUserContactInfoSchema,
  setDeliveryAddressSchema,
} from "../../validators/contactInfo.validator.js";
import auth, { allowTo } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";

const router = Router();

router
  .route("/")
  .post(
    auth(),
    allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
    validationCoreFunction(addUserContactInfoSchema),
    addUserContactInfo
  )
  .patch(
    auth(),
    allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
    validationCoreFunction(setDeliveryAddressSchema),
    setDeliveryAddress
  );

router.delete(
  "/:id",
  auth(),
  allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
  validationCoreFunction(deleteUserContactInfoSchema),
  deleteUserContactInfo
);
export default router;
