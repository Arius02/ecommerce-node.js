import { Router } from "express";
import { upload } from "../../utils/multer.js";
import {
  addBrand,
  deleteBrand,
  getAllBrands,
  getAllBrandsForOneSubCategory,
  getSinglebBrand,
  updateBrand,
} from "./brand.controller.js";
import { validationCoreFunction } from "../../middlewares/validation.middleware.js";
import {
  addBrandSchema,
  deleteBrandSchema,
  getSingleBrandSchema,
  updateBrandSchema,
} from "../../validators/brand.validator.js";
import auth, { allowTo } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
const router = Router();

router.post(
  "/",
  auth(),
  allowTo([systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
  upload().single("image"),
  validationCoreFunction(addBrandSchema),
  addBrand
);
router.put(
  "/:_id",
  auth(),
  allowTo([systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
  upload().single("image"),
  validationCoreFunction(updateBrandSchema),
  updateBrand
);
router.delete(
  "/:_id",
  auth(),
  allowTo([systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
  validationCoreFunction(deleteBrandSchema),
  deleteBrand
);
router.get("/", getAllBrands);
router.get(
  "/:search",
  validationCoreFunction(getSingleBrandSchema),
  getSinglebBrand
);
router.get("/filter/:subCategoryId", getAllBrandsForOneSubCategory);
export default router;
