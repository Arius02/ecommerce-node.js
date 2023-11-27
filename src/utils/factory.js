import slugify from "slugify";
import { categoryModel } from "../../database/models/categroy.model.js";
import cloudinary from "../services/cloudinary.js";
import { AppError } from "./AppErorr.js";
import { nanoid } from "nanoid";
import { subCategoryModel } from "../../database/models/subCategory.model.js";
import { brandModel } from "../../database/models/brand.model.js";
import {
  handleDeleteImage,
  handleSingleImageUpdateAndDelete,
  handleUploadSingleImage,
} from "./handleImages.js";
import { productModel } from "../../database/models/product.model.js";
import { orderModel } from "../../database/models/order.model.js";
import { couponModel } from "../../database/models/coupon.model.js";
import mongoose from "mongoose";
import { cartModel } from "../../database/models/cart.model.js";
import { applyAndSaveCoupon } from "./couponValidation.js";
export const cloudindaryPath = (
  itemName,
  customId,
  categoryCustomId,
  subCategoryCustomId,
  
) => {
  if (itemName == "product") {
    return `ecommerce/Categories/${categoryCustomId}/subCategories/${subCategoryCustomId}/Products/${customId}`;
  } else if (itemName == "brand") {
    return `ecommerce/Brands/${customId}`;
  } else if (itemName == "subCategory") {
    return `ecommerce/Categories/${categoryCustomId}/SubCategories/${customId}`;
  } else {
    return `ecommerce/Categories/${customId}`;
  }
};
// function for adding categories, subcategories, and brands
export const addItem = async (Model, itemName, req, res, next) => {
  const { name, categoryId } = req.body;
  const { _id } = req.user;
  let customIds = null;
  let category;
  if ( itemName == "subCategory") {
    customIds = {};
    category = await categoryModel.findById(categoryId);
    if (!category) {
      return next(new AppError("invalid category id ", 404));
    }
    customIds.categoryId = category.customId;
  }


  if (!req.file) {
    return next(new AppError(`please upload a ${itemName} image`, 400));
  }

  if (await Model.findOne({ name: name.toLowerCase() })) {
    return next(new AppError(`${itemName} name is already used.`, 400));
  }

  const slug = slugify(name, "-");
  const customId = nanoid();
  const path = cloudindaryPath(
    itemName,
    customId,
    customIds?.categoryId,
  );
  const { secure_url, public_id } = await handleUploadSingleImage(
    req.file.path,
    path
  );

  const itemData = {
    createdBy: _id,
    slug,
    name,
    image: { secure_url, public_id },
    customId,
    category: category
      ? { categoryId, categoryCustomId: category.customId }
      : undefined,
    
  };

  const newItem = await Model.create(itemData);
  if (!newItem) {
    await cloudinary.uploader.destroy(public_id);
    return next(new AppError("something went wrong, please try again!", 500));
  }

  res.status(200).json({ message: "Added Done", item: newItem });
};

// function for updating categories, subcategories, and brands
export const updateItem = async (Model, itemName, req, res, next) => {
  const { _id } = req.params;
  const { categoryId,  } = req.body;
  const item = await Model.findById(_id);

  if (!item) {
    return next(new AppError(`invalid ${itemName} id`, 404));
  }
  if (item.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError(`you have no access to this ${itemName}`, 401));
  }
  if (req.body.name) {
    if (req.body.name === item.name) {
      return next(
        new AppError(
          `please enter different ${itemName} name from the old  ${itemName} name`,
          400
        )
      );
    }
    if (await Model.findOne({ name: req.body.name })) {
      return next(
        new AppError(
          `please write a different ${itemName} name because it already used`,
          400
        )
      );
    }
    item.slug = slugify(req.body.name, "-");
    item.name = req.body.name;
  }
  if (req.file) {
    const path = cloudindaryPath(
      itemName,
      item.customId,
      item.category?.categoryCustomId,
    );
    const { secure_url, public_id } = await handleSingleImageUpdateAndDelete(
      req.file.path,
      item.image.public_id,
      path
    );

    item.image = { secure_url, public_id };
  }
  if (item.category) {
    item.category.categoryId = categoryId || item.category.categoryId;
  }
  item.updatedBy = req.user._id;

  await item.save();

  return res
    .status(201)
    .json({ message: `${itemName} updated successfully.`, item });
};
//TODO transaction -- done
// function for deleting categories, subcategories
export const deleteItem = async (Model, itemName, req, res, next) => {
  const { _id } = req.params;
  let path;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const item = await Model.findById(_id).session(session);
    if (!item) {
      return next(new AppError("Item not found", 404)); 
    }
    if (item.createdBy.toString() !== req.user._id.toString()) {
      return next(new AppError(`you have no access to this ${itemName}`, 401));
    }

    await Model.deleteOne({ _id }).session(session);
   
    if (itemName === "category") {

      await subCategoryModel
        .deleteMany({ "category.categoryId": _id })
        .session(session);
    await productModel.deleteMany({ "category.categoryId": _id }).session(session);
      path = cloudindaryPath(itemName, item.customId);
    } else if (itemName === "subCategory") {
      await productModel.deleteMany({ "subCategory.subCategoryId": _id }).session(session);
      path = cloudindaryPath(
        itemName,
        item.customId,
        item.category.categoryCustomId
      );
    } 

    // Commit the transaction
    await session.commitTransaction();
  } catch (error) {
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    console.log(error);
    return next(new AppError("Transaction failed. Item not deleted.", 500));
  } finally {
    // End the session
    session.endSession();
  }

  await handleDeleteImage(path);

  return res.status(200).json({ message: `${itemName} deleted successfully.` });
};

// handle price for product
export const handlePrice = (appliedDiscount, price, product) => {
  if (appliedDiscount && price) {
    const priceAfterDiscount = price * (1 - (appliedDiscount || 0) / 100);
    product.priceAfterDiscount = priceAfterDiscount;
    product.price = price;
    product.appliedDiscount = appliedDiscount;
  } else if (price) {
    const priceAfterDiscount =
      price * (1 - (product.appliedDiscount || 0) / 100);
    product.priceAfterDiscount = priceAfterDiscount;
    product.price = price;
  } else if (appliedDiscount) {
    const priceAfterDiscount =
      product.price * (1 - (appliedDiscount || 0) / 100);
    product.priceAfterDiscount = priceAfterDiscount;
    product.appliedDiscount = appliedDiscount;
  }
};



// Helper function to create an order
export const createOrder = async (
  userId,
  products,
  totalPrice,
  priceAfterDiscount,
   deliveryDetails,
  couponId,
  status
) => {
  const order = new orderModel({
    userId,
    products,
    totalPrice,
    priceAfterDiscount,
     deliveryDetails,
    PaymentMethod: status == "waitPayment" ? "card" : "cash",
    status,
  });

  if (couponId) {
    await couponModel.findByIdAndUpdate(couponId, {
      $push: {
        usageHistory: {
          userId,
          orderId: order._id,
          usageDate: new Date(),
        },
      },
    });
  }

  return order;
};

// Helper function to handle product updates
export const updateProductStock = async (products, decStock = true) => {
  const stockChange = decStock ? -1 : 1;
  const soldChange = decStock ? 1 : -1;
  const options = products.map((elm) => ({
    updateOne: {
      filter: { _id: elm.productId },
      update: {
        $inc: {
          stock: stockChange * elm.quantity,
          sold: soldChange * elm.quantity,
        },
      },
    },
  }));

  await productModel.bulkWrite(options);
};


// cart helpers
function handleTotalPrice(cart) {
  let totalPrice = 0;
  cart.products.forEach(
    (elm) => (totalPrice += elm.priceAfterDiscount * elm.quantity)
  );
  cart.totalPrice = totalPrice;
}

// helper for add to cart 
export const addToCart = async (req, res, next,options) => {
  const { productId, quantity } = req.body;

  //  Check if the product exists and has enough stock
  const product = await productModel
    .findOne({
      _id: productId,
      stock: { $gte: quantity },
    })
    .select("priceAfterDiscount price appliedDiscount name");

  // If the product is not found or doesn't have enough stock, return an error
  if (!product) {
    return next(new AppError("Invalid product or insufficient quantity", 400));
  }

  // Update request body with product details
  req.body.priceAfterDiscount = product.priceAfterDiscount;
  req.body.price = product.price;
  req.body.appliedDiscount = product.appliedDiscount;
  req.body.name = product.name;

  // Check if a cart already exists for the user
  const isCartExist = await cartModel.findOne(options);

  if (!isCartExist) {
    // If no cart exists, create a new cart
    const cart = new cartModel({
      ...options,
      products: [{ ...req.body }],
    });

    // Calculate total price and save the cart
    handleTotalPrice(cart);
    await cart.save();

    return res.status(201).json({ message: "Done", cart });
  }

  // Check if the product is already in the cart
  const item = isCartExist.products.find(
    (elm) => elm.productId.toString() === productId
  );

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
  if (isCartExist.coupon) {
    const coupon = await couponModel.findById(isCartExist.coupon);
    applyAndSaveCoupon(isCartExist, coupon);
  }

  // Save the updated cart
  await isCartExist.save();

  return res.status(201).json({ message: "Done", cart: isCartExist });
};

// helper for remove form cart 
export const removeFromCart = async(req, res, next,options ) => {
  const { productId } = req.body;
  // Check if the product with the given ID exists (optional)
  const product = await productModel.findById(productId);
  if (!product) {
    return next(new AppError("Invalid product ID", 404));
  }

  // Find the user's cart and remove the specified product
  const cart = await cartModel.findOneAndUpdate(
    options,
    {
      $pull: { products: { productId } },
    },
    { new: true }
  );

  if (!cart) {
    return next(new AppError("An error occurred. Please try again.", 401));
  }
  // Recalculate the total price for the cart
  handleTotalPrice(cart);
  
  // Retrieve the associated coupon and apply it to the cart
  if (cart.coupon) {
    const coupon = await couponModel.findById(cart.coupon);
    applyAndSaveCoupon(cart, coupon);
  }
  if(cart.products.length==0){
    await cartModel.findByIdAndDelete(cart._id)
  }else{
    await cart.save();
  }
  // Respond with the updated cart
  return res.status(200).json({ message: "Done" });
}

// helper for clear cart 
export const clearCart = (async (req, res, next,options) => {
 
  const cart = await cartModel.findOneAndDelete(options);

  // Decrement the usage count of associated coupons (if any)
  if (cart.coupon) {
    await couponModel.findByIdAndUpdate(cart.coupon, {
      $inc: { usageCount: -1 },
    });
  }

  // Respond with a success message
  return res.status(200).json({ message: "Done" });
});

// helper to get cart 
export const getCart = (async (req, res, next,options) => {
  // Find the user's cart and populate the products with their details
  const cart = await cartModel.findOne(options).populate([
    {
      path: "products.productId",
      select: "coverImage name ",
    },
    {
      path: "coupon",
      select: "couponCode discountValue couponType",
    },
  ]);

  // Respond with the populated cart
  return res.status(200).json({ message: "Done", cart });
});