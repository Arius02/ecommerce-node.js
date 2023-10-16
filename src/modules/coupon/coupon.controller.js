import errorHandler from "../../utils/errorHandler.js";
import { userModel } from "../../../database/models/user.model.js";
import { couponModel } from "../../../database/models/coupon.model.js";
import {
  applyAndSaveCoupon,
  isCouponValid,
} from "../../utils/couponValidation.js";
import { orderModel } from "../../../database/models/order.model.js";
import { AppError } from "../../utils/AppErorr.js";
import { systemRoles } from "../../utils/systemRoles.js";
import { ApiFeatures } from "../../utils/apiFeatures.js";

export const addCoupon = errorHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { couponCode } = req.body;
  if (await couponModel.findOne({ couponCode: couponCode.toLowerCase() })) {
    return next(new AppError("the coupon code is already used.", 401));
  }
  const coupon = await couponModel.create({ ...req.body, createdBy: _id });
  if (!coupon) {
    return next(new AppError("fail to add coupon", 400));
  }
  res.status(201).json({ message: "Done", coupon });
});
export const updateCoupon = errorHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { couponCode } = req.body;
  const coupon = await couponModel.findById(req.params._id);
  if (!coupon) {
    return next(new AppError("coupon._id not exist", 401));
  }
  if (coupon.createdBy.toString() !== _id.toString()) {
    return next(new AppError(`you have no access to this coupon`, 401));
  }
  if (couponCode) {
    if (coupon.couponCode == couponCode.toLowerCase()) {
      return next(
        new AppError("coupon code match old coupon code plz change it", 401)
      );
    }
    if (await couponModel.findOne({ couponCode: couponCode.toLowerCase() })) {
      return next(new AppError("coupon code is already exist", 401));
    }
  }
  const updatedCoupon = await couponModel.findByIdAndUpdate(
    req.params._id,
    {
      updatedBy: _id,
      ...req.body,
    },
    { new: true }
  );
  return res.status(200).json({ message: "done", updatedCoupon });
});
export const deleteCoupon = errorHandler(async (req, res, next) => {
  const { _id } = req.user;
  const coupon = await couponModel.findByIdAndDelete(req.params._id);
  if (!coupon) {
    return next(new AppError("couponId is not valid.", 400));
  }
  if (coupon.createdBy.toString() !== _id.toString()) {
    return next(new AppError(`you have no access to this coupon`, 401));
  }
  return res.status(200).json({ message: "done", coupon });
});
export const getAllCoupons = errorHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { search } = req.query;
  const options = { createdBy: _id };
  if (req.user.role == systemRoles.SUPER_ADMIN) {
    options = {};
  }
  const apiFeaturesInstance = new ApiFeatures(
    couponModel.find({
      ...options,
      $or: [
        { name: { $regex: search ? search : ".", $options: "i" } },
        { desc: { $regex: search ? search : ".", $options: "i" } },
      ],
    }),
    req.query
  )
    .pagination()
    .filters()
    .sort();
  const coupons = await apiFeaturesInstance.mongooseQuery;
  if (!coupons) {
    return next(new AppError("there are no coupons created yet.", 400));
  }
  return ao
    .status(200)
    .json({ message: "done", page: req.query.page, coupons });
});

export const applyCoupon = errorHandler(
  async (req, res, next, model, modelName) => {
    const { couponCode } = req.body;
    const { _id } = req.user;
    // Find the coupon by its code
    const coupon = await couponModel.findOne({
      couponCode: couponCode.toLowerCase(),
    });

    // Check if the coupon exists
    if (!coupon) {
      return next(new AppError("Invalid coupon code.", 404));
    }
    const orders = await orderModel.find({ userId: _id });

    // Check if the coupon is valid
    const couponResult = isCouponValid(model, modelName, coupon, orders, _id);
    // Apply the coupon if it's valid
    if (couponResult === true) {
      applyAndSaveCoupon(model, coupon);

      // Increment the usage count of the coupon
      await couponModel.findByIdAndUpdate(coupon._id, {
        $inc: { usageCount: 1 },
      });

      // Update the model with the applied coupon
      model.coupon = coupon._id;
      model.save();
      if (modelName == "Order") {
        await couponModel.findByIdAndUpdate(coupon._id, {
          $push: {
            usageHistory: {
              userId: _id,
              orderId: model._id,
              usageDate: new Date(),
            },
          },
        });
      }
      return true;
    } else {
      const { message, cause } = couponResult;
      return { message, cause };
    }
  }
);

export const toggleDisabled = async (req, res, next) => {
  const { _id } = req.params;
  const coupon = await couponModel.findById(_id);
  if (coupon.status == "active") {
    coupon.status = "disabled";
  } else if (coupon.status == "disabled") {
    coupon.status = "active";
  } else {
    return next(new AppError("this coupon is expired", 400));
  }
  await coupon.save();
  return res.status(201).json({ message: "Done" });
};
