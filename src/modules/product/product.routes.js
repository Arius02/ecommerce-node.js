import { Router } from "express";
import { upload } from "../../utils/multer.js";
import {
  addProduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
  toggleDisabled,
  updateProduct,
} from "./product.controller.js";
import { validationCoreFunction } from "../../middlewares/validation.middleware.js";
import {
  addProductSchema,
  deleteProductSchema,
  generalProductSchema,
  updateProductSchema,
} from "../../validators/product.validator.js";
import auth, { allowTo } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
const router = Router();

router
  .route("/")
  .post(
    auth(),
    allowTo([systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
    upload().fields([
      { name: "coverImage", maxCount: 1 },
      { name: "images", maxCount: 6 },
    ]),
    validationCoreFunction(addProductSchema),
    addProduct
  )
  .get(getAllProducts);

router
  .route("/:productId")
  .put(
    auth(),
    allowTo([systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
    upload().fields([
      { name: "coverImage", maxCount: 1 },
      { name: "images", maxCount: 4 },
    ]),
    validationCoreFunction(updateProductSchema),
    updateProduct
  )
  .delete(
    auth(),
    allowTo([systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
    validationCoreFunction(deleteProductSchema),
    deleteProduct
  )
  .get(validationCoreFunction(generalProductSchema), getSingleProduct);

router.patch(
  "/visibility/",
  auth(),
  allowTo([systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
  validationCoreFunction(generalProductSchema),
  toggleDisabled
);
export default router;
