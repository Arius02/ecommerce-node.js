import { Router } from "express";
import {
  changePassword,
  deleteUser,
  forgetPassword,
  getAllUsers,
  getUser,
  logOut,
  resetPassword,
  signIn,
  signUp,
  toggleBlock,
  updateUser,
} from "./user.controller.js";
import { validationCoreFunction } from "../../middlewares/validation.middleware.js";
import {
  changePassSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updateUserSchema,
} from "../../validators/user.validator.js";
import auth, { allowTo } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
const router = Router();

router.post("/signup", validationCoreFunction(signUpSchema), signUp);
router.post("/signin", validationCoreFunction(signInSchema), signIn);
router.patch("/forgetPassword", forgetPassword);
router.patch(
  "/reset/:token",
  validationCoreFunction(resetPasswordSchema),
  resetPassword
);
router.patch(
  "/changePassword/",
  auth(),
  allowTo([systemRoles.USER]),
  validationCoreFunction(changePassSchema),
  changePassword
);
router.patch("/logout", auth(), allowTo([systemRoles.USER]), logOut);
router
  .route("/")
  .put(
    auth(),
    allowTo([systemRoles.USER]),
    validationCoreFunction(updateUserSchema),
    updateUser
  )
  .get(auth(), allowTo([systemRoles.USER]), getUser)
  .delete(auth(), allowTo([systemRoles.USER]), deleteUser);
router.get(
  "/allUsers",
  auth(),
  allowTo([systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
  getAllUsers
);
router.patch(
  "/toggleBlock",
  auth(),
  allowTo([systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
  toggleBlock
);
export default router;
