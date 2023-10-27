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
export const addInfo = async (
  _id,
  info,
  itemToPush,
  infoName,
  pushTo,
  Model,
  next,
  res
) => {
  let user;
  if (info) {
    if (info.length == 3) {
      return next(new AppError(`you can't add more than 3 ${infoName}`, 400));
    }
    user = await Model.findByIdAndUpdate(
      _id,
      {
        $push: { [pushTo]: itemToPush },
      },
      { new: true }
    );
  }
  return res.status(201).json({ message: "Done", user });
};
// Helper function to create an order
export const createOrder = async (
  userId,
  products,
  totalPrice,
  priceAfterDiscount,
  address,
  phoneNumbers,
  couponId,
  status
) => {
  const order = new orderModel({
    userId,
    products,
    totalPrice,
    priceAfterDiscount,
    address,
    phoneNumbers,
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
