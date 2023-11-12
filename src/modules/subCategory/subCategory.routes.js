import { Router } from "express";
import { upload } from "../../utils/multer.js";
import {
  addSubCategory,
  deleteSubCategory,
  getAllSubCategories,
  getSingleSubCategory,
  updateSubCategory,
} from "./subCategory.controller.js";
import { validationCoreFunction } from "../../middlewares/validation.middleware.js";
import {
  addSubCategorySchema,
  deleteSubCategorySchema,
  getSingleSubCategorySchema,
  updateSubCategorySchema,
} from "../../validators/subCategory.validator.js";
import auth, { allowTo } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
const router = Router();
router
  .route("/")
  .post(
    auth(),
    allowTo([systemRoles.SUPER_ADMIN]),
    upload().single("image"),
    validationCoreFunction(addSubCategorySchema),
    addSubCategory
  )
  .get(getAllSubCategories);
router
  .route("/:_id")
  .put(
    auth(),
    allowTo([systemRoles.SUPER_ADMIN]),
    upload().single("image"),
    validationCoreFunction(updateSubCategorySchema),
    updateSubCategory
  )
  .delete(
    auth(),
    allowTo([systemRoles.SUPER_ADMIN]),
    validationCoreFunction(deleteSubCategorySchema),
    deleteSubCategory
  );
router.get(
  "/:search",
  validationCoreFunction(getSingleSubCategorySchema),
  getSingleSubCategory
);
export default router;
