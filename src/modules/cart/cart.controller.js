import { cartModel } from "../../../database/models/cart.model.js";
import { couponModel } from "../../../database/models/coupon.model.js";
import { productModel } from "../../../database/models/product.model.js";
import { AppError } from "../../utils/AppErorr.js";
import { applyAndSaveCoupon } from "../../utils/couponValidation.js";
import errorHandler from "../../utils/errorHandler.js";
import {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
} from "../../utils/factory.js";
import { applyCoupon } from "../coupon/coupon.controller.js";

export const addToCartForUser = errorHandler(async (req, res, next) => {
  return addToCart(req, res, next, { userId: req.user._id });
});

export const addToCartForGuest = async (req, res, next) => {
  return addToCart(req, res, next, { _id: req.body.cartId });
};
export const mergeCart = errorHandler(async (req, res, next) => {
  const { cartId } = req.body;
  const { _id: userId } = req.user;
  // Check if the user already has a cart
  const userCart = await cartModel.findOne({ userId });

  // Check if the guest cart exists
  const guestCart = await cartModel.findById(cartId);

  if (!guestCart) {
    return next(new AppError("Cart not found", 404));
  }

  if (userCart) {
    // If the user already has a cart, merge the products and update the total price
    const mergedProducts = mergeProducts(userCart.products, guestCart.products);
    await cartModel.findOneAndUpdate(
      { userId },
      {
        products: mergedProducts,
        totalPrice: userCart.totalPrice + guestCart.totalPrice,
      }
    );
    await cartModel.findByIdAndDelete(cartId);
  } else {
    // If the user doesn't have a cart, create a new cart with the guest cart products
    await cartModel.findByIdAndUpdate(cartId, { userId }, { new: true });
  }

  return res.status(201).json({ message: "Done" });
});

// Helper function to merge products based on productId
const mergeProducts = (userProducts, guestProducts) => {
  const mergedProducts = [...userProducts];

  guestProducts.forEach((guestProduct) => {
    const existingProductIndex = mergedProducts.findIndex(
      (userProduct) =>
        userProduct.productId.toString() == guestProduct.productId.toString()
    );

    if (existingProductIndex == -1) {
      // If the product is not in the user's cart, add it
      mergedProducts.push({ ...guestProduct });
    } else {
      // If the product already exists in the user's cart, update its quantity
      mergedProducts[existingProductIndex].quantity += guestProduct.quantity;
    }
    console.log(mergedProducts, existingProductIndex);
  });
  return mergedProducts;
};

export const removeFromCartForUser = errorHandler(async (req, res, next) => {
  return removeFromCart(req, res, next, { userId: req.user._id });
});
export const removeFromCartForGuest = async (req, res, next) => {
  return removeFromCart(req, res, next, { _id: req.body.cartId });
};
export const getLoggedUserCart = errorHandler(async (req, res, next) => {
  return getCart(req, res, next, { userId: req.user._id });
});
export const getGuestCart = errorHandler(async (req, res, next) => {
  return getCart(req, res, next, { _id: req.params.cartId });
});

export const clearUserCart = errorHandler(async (req, res, next) => {
  return clearCart(req, res, next, { userId: req.user._id });
});
export const clearGuestCart = errorHandler(async (req, res, next) => {
  return clearCart(req, res, next, { _id: req.body.cartId });
});

export const applyCouponToCart = async (req, res, next) => {
  const { _id } = req.user;
  // Find the user's cart
  const cart = await cartModel.findOne({ userId: _id });

  // Check if the cart exists
  if (!cart) {
    return next(new AppError("Please fill the cart first.", 404));
  }
  const couponResult = await applyCoupon(req, res, next, cart, "cart");
  if (couponResult !== true) {
    console.log(couponResult);
    const { message, cause } = couponResult;

    return next(new AppError(message, cause));
  }
  // Respond with a success message and the updated model
  return res.status(201).json({ message: "Done", cart });
};
