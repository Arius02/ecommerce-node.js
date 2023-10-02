import { cartModel } from "../../../database/models/cart.model.js";
import { couponModel } from "../../../database/models/coupon.model.js";
import { productModel } from "../../../database/models/product.model.js";
import { AppError } from "../../utils/AppErorr.js";
import { applyAndSaveCoupon } from "../../utils/couponValidation.js";
import errorHandler from "../../utils/errorHandler.js"
import { applyCoupon } from "../coupon/coupon.controller.js";

function handleTotalPrice(cart){
  let totalPrice=0
  cart.products.forEach(elm=>totalPrice+=elm.priceAfterDiscount*elm.quantity)
    cart.totalPrice=totalPrice
}
export const addToCart = errorHandler(async (req, res, next) => {
    const { _id } = req.user;
    const { productId, quantity } = req.body;

    //  Check if the product exists and has enough stock
    const product = await productModel.findOne({
      _id: productId,
      stock: { $gte: quantity },
    }).select("priceAfterDiscount price appliedDiscount name");

    // If the product is not found or doesn't have enough stock, return an error
    if (!product) {
      return next(new AppError('Invalid product or insufficient quantity', 400));
    }

    // Update request body with product details
    req.body.priceAfterDiscount = product.priceAfterDiscount;
    req.body.price = product.price;
    req.body.appliedDiscount = product.appliedDiscount;
    req.body.name = product.name;

    // Check if a cart already exists for the user
    const isCartExist = await cartModel.findOne({ userId: _id });

    if (!isCartExist) {
      // If no cart exists, create a new cart
      const cart = new cartModel({
        userId: _id,
        products: [{ ...req.body }],
      });

      // Calculate total price and save the cart
      handleTotalPrice(cart);
      await cart.save();

      return res.status(201).json({ message: 'Done', cart });
    }

    // Check if the product is already in the cart
    const item = isCartExist.products.find(elm => elm.productId.toString() === productId);

    if (item) {
      // If the product is already in the cart, update the quantity
      item.quantity += quantity || 1;
    } else {
      // If the product is not in the cart, add it as a new item
      isCartExist.products.push({ ...req.body });
    }

    // Recalculate total price for the updated cart
    handleTotalPrice(isCartExist);

    // Apply and save any applicable coupon
  if(isCartExist.coupon){
    const coupon = await couponModel.findById(isCartExist.coupon);
    applyAndSaveCoupon(isCartExist, coupon);
  }

    // Save the updated cart
    await isCartExist.save();

    return res.status(201).json({ message: 'Done', cart: isCartExist });
});

export const removeFromCart = errorHandler(async (req, res, next) => {
    const { _id } = req.user;
    const productIdToRemove = req.params._id;

    // Check if the product with the given ID exists (optional)
    const product = await productModel.findById(productIdToRemove);
    if (!product) {
      return next(new AppError('Invalid product ID', 404));
    }

    // Find the user's cart and remove the specified product
    const cart = await cartModel.findOneAndUpdate(
      { userId: _id },
      {
        $pull: { 'products._id': productIdToRemove },
      },
      { new: true }
    );

    if (!cart) {
      return next(new AppError('An error occurred. Please try again.', 401));
    }

    // Recalculate the total price for the cart
    handleTotalPrice(cart);

    // Retrieve the associated coupon and apply it to the cart
    if(cart.coupon){
      const coupon = await couponModel.findById(isCartExist.coupon);
      applyAndSaveCoupon(isCartExist, coupon);
    }
  

    // Respond with the updated cart
    return res.status(200).json({ message: 'Done', cart });

});

export const getLoggedUserCart = errorHandler(async (req, res, next) => {
    // Find the user's cart and populate the products with their details
    const cart = await cartModel
      .findOne({ userId: req.user._id })
      .populate('products.productId');

    // Respond with the populated cart
    return res.status(200).json({ message: 'Done', cart });  
});


export const clearCart = errorHandler(async (req, res, next) => {
    // Find and delete the user's cart
    const cart = await cartModel.findOneAndDelete({ userId: req.user._id });

    // Decrement the usage count of associated coupons (if any)
    await couponModel.findByIdAndUpdate(cart.coupon, {
      $inc: { usageCount: -1 },
    });

    // Respond with a success message
    return res.status(200).json({ message: 'Done' });
 
});

export const applyCouponToCart = errorHandler(async (req, res, next) => {
    const {_id}=req.user
      // Find the user's cart
  const cart = await cartModel.findOne({ userId: _id });

  // Check if the cart exists
  if (!cart) {
    return next(new AppError('Please fill the cart first.', 404));
  }
   const couponResult= await applyCoupon(req, res, next,cart,"cart")
   if(couponResult !==true){
    const {message, cause}=couponResult
    
    return next(new AppError(message, cause))
   }
  // Respond with a success message and the updated model
  return res.status(201).json({ message: 'Done', cart });
});

