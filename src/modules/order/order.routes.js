import { Router } from "express";
import { validationCoreFunction } from "../../middlewares/validation.middleware.js";
import {
  createCashOrder,
  checkoutSession,
  getAllOrders,
  getAllUserOrders,
  cancelOrder,
  updateOrderStatus,
  createDirectCashOrder,
  createDirectOnlineOrder,
  getUserOrder,
} from "./order.controller.js";
import {
  cancelOrderSchema,
  createDirectOrderSchema,
  createOrderSchema,
  updateOrderStatusSchema,
} from "../../validators/order.validator.js";
import auth, { allowTo } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
const router = Router();

router.post(
  "/:cartId",
  auth(),
  allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
  validationCoreFunction(createOrderSchema),
  createCashOrder
);

router.post(
  "/checkoutSession/:cartId",
  auth(),
  allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
  validationCoreFunction(createOrderSchema),
  checkoutSession
);

router.post(
  "/create/directCashOrder",
  auth(),
  allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
  validationCoreFunction(createDirectOrderSchema),
  createDirectCashOrder
);

router.post(
  "/create/directOnlineOrder",
  auth(),
  allowTo([systemRoles.USER, systemRoles.FAKE_ADMIN]),
  validationCoreFunction(createDirectOrderSchema),
  createDirectOnlineOrder
);

router.patch(
  "/cancelOrder/:orderId",
  auth(),
  allowTo([
    systemRoles.SUPER_ADMIN,
    systemRoles.ADMIN,
    systemRoles.DELIVERY_MAN,
    systemRoles.USER,
  ]),
  validationCoreFunction(cancelOrderSchema),
  cancelOrder
);

router.patch(
  "/updateOrder/:orderId",
  auth(),
  allowTo([
    systemRoles.SUPER_ADMIN,
    systemRoles.ADMIN,
    systemRoles.DELIVERY_MAN,
  ]),
  validationCoreFunction(updateOrderStatusSchema),
  updateOrderStatus
);

router.get(
  "/",
  auth(),
  getAllUserOrders
);
router.get(
  "/:_id",
  auth(),
  getUserOrder
);
router.get(
  "/admin/getAllOrders",
  auth(),
  allowTo([systemRoles.SUPER_ADMIN, systemRoles.ADMIN, systemRoles.FAKE_ADMIN]),
  getAllOrders
);
export default router;
