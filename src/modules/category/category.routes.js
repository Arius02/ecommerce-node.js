import { Router, application } from "express";
import { upload } from "../../utils/multer.js";
import {
  addCategory,
  deleteCategory,
  getAllCategories,
  getAllClassifications,
  getSingleCategory,
  updateCategory,
} from "./category.controller.js";
import { validationCoreFunction } from "../../middlewares/validation.middleware.js";
import {
  addCategorySchema,
  deleteCategorySchema,
  getSingleCategorySchema,
  updateCategorySchema,
} from "../../validators/category.validator.js";
import auth, { allowTo } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";

const router = Router();

router
  .route("/")
  .post(
    auth(),
    allowTo([systemRoles.SUPER_ADMIN]),
    upload().single("image"),
    validationCoreFunction(addCategorySchema),
    addCategory
  )
  .get(getAllCategories);
router
  .route("/:_id")
  .put(
    auth(),
    allowTo([systemRoles.SUPER_ADMIN]),
    upload().single("image"),
    validationCoreFunction(updateCategorySchema),
    updateCategory
  )
  .get(validationCoreFunction(getSingleCategorySchema), getSingleCategory);

router.delete(
  "/:_id",
  auth(),
  allowTo([systemRoles.SUPER_ADMIN]),
  validationCoreFunction(deleteCategorySchema),
  deleteCategory
);
router.get("/classifications/list", getAllClassifications);
export default router;
