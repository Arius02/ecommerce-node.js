import Stripe from "stripe";
import { cartModel } from "../../../database/models/cart.model.js";
import { couponModel } from "../../../database/models/coupon.model.js";
import { orderModel } from "../../../database/models/order.model.js";
import { productModel } from "../../../database/models/product.model.js";
import { AppError } from "../../utils/AppErorr.js";
import errorHandler from "../../utils/errorHandler.js";
import { paymentFunction } from "../../utils/paymentFunction.js";
import { applyCoupon } from "../coupon/coupon.controller.js";
import { createOrder, updateProductStock } from "../../utils/factory.js";
import createInvoice from "../../utils/pdfkit.js";
import { sendEmail } from "../../services/sendingMails.js";
import { nanoid } from "nanoid";
import { ApiFeatures } from "../../utils/apiFeatures.js";
import { getTotalPages } from "../../utils/paginationFunction.js";
import { systemRoles } from "../../utils/systemRoles.js";

const sendOrderPdfToUser = async (name, email, address, order) => {
  const orderCode = `${name}_${nanoid(3)}`;
  const stringAddress = `${address.street}, ${address.city}, ${address.governorate}`;
  const coupon = await couponModel.findById(order.coupon);
  const couponDiscount = coupon
    ? coupon.couponType === "percentage"
      ? `${coupon.discountValue}%`
      : `${coupon.discountValue}EGP`
    : "No Coupon";
  const orderinvoice = {
    orderCode,
    date: order.createdAt,
    shipping: {
      name: name,
      address: stringAddress,
      city: address.city,
      governorate: address.governorate,
      country: "Egypt",
    },
    items: order.products,
    subTotal: order.totalPrice,
    paidAmount: order.priceAfterDiscount
      ? order.priceAfterDiscount
      : order.totalPrice,
    couponDiscount,
  };
  createInvoice(orderinvoice, `${orderCode}.pdf`);
   await sendEmail({
    to: email,
    subject: "Order Confirmation",
    html: `<h1>please find your invoice attachment below</h1>`,
    attachments: [
      {
        path: `./Files/${orderCode}.pdf`,
      },
    ],
  });
};

export const createCashOrder = async (req, res, next) => {
  const { _id, deliveryDetails, name, email } = req.user;
  const { cartId } = req.params;

  const cart = await cartModel.findById(cartId);

  if (!cart || !cart.products.length) {
    return next(new AppError("Invalid cartId or empty cart", 404));
  }
  const selectedAddress = deliveryDetails.filter(
    (elm) => elm.isSelected == true
  )[0];
  const order = await createOrder(
    _id,
    cart.products,
    cart.totalPrice,
    cart.priceAfterDiscount,
    selectedAddress,
    cart.coupon,
    "processing"
  );
  await order.save();
  await updateProductStock(cart.products);
  await cartModel.findByIdAndDelete(cartId);
  await sendOrderPdfToUser(name, email, selectedAddress, order);
  return res.status(201).json({ message: "Done", order });
};

export const checkoutSession = errorHandler(async (req, res, next) => {
  const { cartId } = req.params;
  const { _id, email, deliveryDetails, name } = req.user;

  const cart = await cartModel.findOne({ _id: cartId, userId: _id });

  if (!cart || !cart.products.length) {
    return next(new AppError("Invalid cartId or empty cart", 404));
  }

  const totalPrice = cart.priceAfterDiscount
    ? cart.priceAfterDiscount
    : cart.totalPrice;
  const selectedAddress = deliveryDetails.filter(
    (elm) => elm.isSelected == true
  )[0];
  const order = await createOrder(
    _id,
    cart.products,
    cart.totalPrice,
    cart.priceAfterDiscount,
    selectedAddress,
    cart.coupon,
    "waitPayment"
  );
  await order.save();
  const session = await paymentFunction({
    customer_email: email,
    client_reference_id: _id,
    metadata: {
      orderId: order._id.toString(),
    },
    success_url: "http://localhsot:5173/",
    cancel_url: "http://localhsot:5173/",
    line_items: [
      {
        price_data: {
          currency: "egp",
          unit_amount: totalPrice * 100,
          product_data: {
            name: name,
          },
        },
        quantity: 1,
      },
    ],
  });

  if (session) {
    await updateProductStock(cart.products);
    await cartModel.findByIdAndDelete(cartId);
    return res.status(201).json({ message: "Done", url: session.url });
  }
});

export const createDirectCashOrder = errorHandler(async (req, res, next) => {
  const { _id, deliveryDetails, email, name } = req.user;
  const { productId, quantity, couponCode } = req.body;

  const product = await productModel
    .findOne({
      _id: productId,
      stock: { $gte: quantity },
    })
    .select("name priceAfterDiscount price appliedDiscount  -_id");
  if (!product) {
    return next(new AppError("Invalid product or insufficient quantity", 400));
  }
  const selectedAddress = deliveryDetails.filter(
    (elm) => elm.isSelected == true
  )[0];
  console.log(deliveryDetails);
  const order = await createOrder(
    _id,
    [{ productId, quantity, ...product }],
    product.priceAfterDiscount * quantity,
    product.priceAfterDiscount * quantity,
    selectedAddress,
    null, // No coupon for direct orders
    "processing"
  );
  if (couponCode) {
    const couponResult = applyCoupon(req, res, next, order, "Order");
    if (couponResult !== true) {
      return next(new AppError(couponResult.message, couponResult.cause));
    }
  } else {
    await order.save();
  }
  await updateProductStock(order.products);
  await sendOrderPdfToUser(name, email, selectedAddress, order);
  return res.status(201).json({ message: "Done", order });
});

export const createDirectOnlineOrder = errorHandler(async (req, res, next) => {
  const { _id, deliveryDetails, email, name } = req.user;
  const { productId, quantity, couponCode } = req.body;

  const product = await productModel
    .findOne({
      _id: productId,
      stock: { $gte: quantity },
    })
    .select("name priceAfterDiscount price appliedDiscount  -_id");

  if (!product) {
    return next(new AppError("Invalid product or insufficient quantity", 400));
  }
  const selectedAddress = deliveryDetails.filter(
    (elm) => elm.isSelected == true
  )[0];
  const order = await createOrder(
    _id,
    [{ productId, quantity, ...product }],
    product.priceAfterDiscount * quantity,
    product.priceAfterDiscount * quantity,
    deliveryDetails,
    null, // No coupon for direct orders
    "waitPayment"
  );

  if (couponCode) {
    const couponResult = await applyCoupon(req, res, next, order, "Order");
    if (couponResult !== true) {
      return next(new AppError(couponResult.message, couponResult.cause));
    }
  } else {
    await order.save();
  }

  const session = await paymentFunction({
    customer_email: email,
    client_reference_id: _id,
    metadata: {
      orderId: order._id.toString(),
    },
    success_url: "http://localhsot:5173/",
    cancel_url: "http://localhsot:5173/",
    line_items: [
      {
        price_data: {
          currency: "egp",
          unit_amount: product.priceAfterDiscount * 100,
          product_data: {
            name: name,
          },
        },
        quantity,
      },
    ],
  });

  if (session) {
    await updateProductStock(order.products);

    return res.status(201).json({ message: "Done", url: session.url, order });
  }

  return next(new AppError("an error eccured please try again. ", 400));
});

export const cancelOrder = errorHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const { _id } = req.user;
  const order = await orderModel.findById(orderId);
  if (!order) {
    return next(new AppError("invalid orderId", 404));
  }
  if (order.userId.toString() !== _id.toString()) {
    return next(new AppError("You have no access to cancel this order.", 401));
  }
  if (order.status !== "processing" && order.status !== "waitPayment") {
    return next(new AppError("this order can't be cancelled", 400));
  }
  order.status = "cancelled";
  order.canceledReason = reason;

  await order.save();
  await updateProductStock(order.products, false);
  return res.status(201).json({ message: "Done", order });
});

export const updateOrderStatus = errorHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { orderStatus, } = req.body;
  const order = await orderModel.findById(orderId);
  if (!order) {
    return next(new AppError("invalid orderId", 404));
  }
  order.status = orderStatus;

  if (order.PaymentMethod == "cash" && orderStatus == "delivered") {
    order.paidAt = new Date();
  }
  await order.save();
  return res.status(201).json({ message: "Done" });
});

export const getAllUserOrders = errorHandler(async (req, res, next) => {
  const userId =
    req.user.role === "SuperAdmin" || req.user.role 
    === "Admin"
      ? req.query.id
        :req.user._id;
  const apiFeaturesInstance = new ApiFeatures(
    orderModel.find({userId}),
    req.query
  ).pagination();
  const orders = await apiFeaturesInstance.mongooseQuery;
  const totalCount = await orderModel.countDocuments({
    userId: req.user._id,
  });
  return res.status(200).json({
    message: "Done",
    totalPages: getTotalPages(totalCount, req.query.size),
    orders,
  });
});
export const getUserOrder = errorHandler(async (req, res, next) => {
  const { _id } = req.params;
   const condition =
     req.user.role !== systemRoles.User 
       ? { _id: req.params._id }
       : {_id, userId: req.user._id };
  const order = await orderModel
    .findOne(condition)
    .populate("products.productId");
  return res.status(200).json({
    message: "Done",
    order,
  });
});

export const getAllOrders = async (req, res, next) => {
  const { search } = req.query;
  const searchRegex = new RegExp(search || ".", "i");

  const apiFeaturesInstance = new ApiFeatures(
    orderModel.find({
      $or: [{ status: searchRegex }, { PaymentMethod: searchRegex }],
    }),
    req.query
  )
    .pagination()
    .filters()
    .sort();
  const orders = await apiFeaturesInstance.mongooseQuery;
  return res.status(200).json({
    message: "Done",
    orders,
  });
};

// stripe webhook
export const createOnlineOrder = async (request, response) => {
  const sig = request.headers["stripe-signature"];
  const endpointSecret = process.env.ENDPOINT_SECRET;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let event;
  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }
  // Handle the event
  if (event.type === "checkout.session.completed") {
    const checkoutSessionCompleted = event.data.object;
    const order = await orderModel.findOneAndUpdate(
      { _id: checkoutSessionCompleted.metadata.orderId, status: "waitPayment" },
      {
        status: "processing",
        paidAt: new Date(),
      }
    );
    const { name, email } = await userModel.findById(order.userId);
    await sendOrderPdfToUser(name, email, order.deliveryDetails, order);
    return response.json({ received: true });
  }
  await orderModel.findOneAndUpdate(
    { _id: checkoutSessionCompleted.metadata.orderId, status: "waitPayment" },
    {
      status: "fail to pay",
    }
  );
  return response.json({ received: false });
};
