import morgan from "morgan";
import { connectionDB } from "../../database/DBConnection.js";
import { AppError } from "./AppErorr.js";
import { globalMiddleware } from "../middlewares/global.middelware.js";
import {
  brandRouter,
  cartRouter,
  categoryRouter,
  contactInfoRouter,
  couponRouter,
  orderRouter,
  productRouter,
  reviewRouter,
  subCategoryRouter,
  userRouter,
  wishlistRouter,
} from "../modules/index.js";
import { changeCouponStatusCron, deleteFilesCron } from "./cronJob.js";
import { createOnlineOrder } from "../modules/order/order.controller.js";
export const bootstrap = (app, express) => {
  const port = process.env.PORT || 3000;

  app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    createOnlineOrder
  );
  app.use(express.json());

  connectionDB();
  changeCouponStatusCron();
  deleteFilesCron();
  app.use(morgan("dev"));
  app.get("/", (req, res, next) => res.json("hello"));

  app.use("/category", categoryRouter);
  app.use("/subCategory", subCategoryRouter);
  app.use("/brand", brandRouter);
  app.use("/product", productRouter);
  app.use("/auth", userRouter);
  app.use("/wishlist", wishlistRouter);
  app.use("/coupon", couponRouter);
  app.use("/cart", cartRouter);
  app.use("/order", orderRouter);
  app.use("/contactInfo", contactInfoRouter);
  app.use("/review", reviewRouter);

  app.all("*", (req, res, next) =>
    next(new AppError("404 Not Found URL", 404))
  );
  app.use(globalMiddleware);
  const server = app.listen(port, () =>
    console.log(`Example app listening on port ${port}!`)
  );
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    // Handle the error here or log it
  });
};
