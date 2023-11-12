import errorHandler from "../../utils/errorHandler.js";
import { AppError } from "../../utils/AppErorr.js";
import { brandModel } from "../../../database/models/brand.model.js";
import { categoryModel } from "../../../database/models/categroy.model.js";
import { subCategoryModel } from "../../../database/models/subCategory.model.js";
import { productModel } from "../../../database/models/product.model.js";
import slugify from "slugify";
import { nanoid } from "nanoid";
import cloudinary from "../../services/cloudinary.js";
import {
  handleDeleteImage,
  handleImagesUpdateAndDelete,
  handleSingleImageUpdateAndDelete,
  handleUploadBulkOfImages,
  handleUploadSingleImage,
} from "../../utils/handleImages.js";
import { cloudindaryPath, handlePrice } from "../../utils/factory.js";
import { ApiFeatures } from "../../utils/apiFeatures.js";
import { getTotalPages } from "../../utils/paginationFunction.js";

export const addProduct = errorHandler(async (req, res, next) => {
  const {
    name,
    price,
    appliedDiscount,
    stock,
    desc,
    categoryId,
    subCategoryId,
    brandId,
  } = req.body;
  const { _id } = req.user;
  const category = await categoryModel.findById(categoryId);
  const subCategory = await subCategoryModel.findById(subCategoryId);
  const brand = await brandModel.findById(brandId);
  if (!category || !subCategory || !brand) {
    return next(new AppError("inavalid ids", 404));
  }
  if (!req.files) {
    return next(new AppError("please upload alll product images."));
  }
  const priceAfterDiscount = price * (1 - (appliedDiscount || 1) / 100);
  const slug = slugify(name, "-");
  const customId = nanoid();
  const publicIds = [];
  const path = cloudindaryPath(
    "product",
    customId,
    category.customId,
    subCategory.customId,
    
  );
  const { secure_url, public_id } = await handleUploadSingleImage(
    req.files.coverImage[0].path,
    path
  );
  publicIds.push(public_id);
  const { images, IDs } = await handleUploadBulkOfImages(
    req.files.images,
    path
  );
  publicIds.push(...IDs);
  const productObj = {
    name,
    desc,
    slug,
    priceAfterDiscount,
    price,
    appliedDiscount,
    coverImage: { secure_url, public_id },
    stock,
    category: { categoryId, categoryCustomId: category.customId },
    subCategory: { subCategoryId, subCategoryCustomId: subCategory.customId },
    brand: brandId,
    customId,
    images,
    createdBy: _id,
  };
  const product = await productModel.create(productObj);
  if (!product) {
    await cloudinary.api.delete_resources(publicIds);
    return next(new AppError("an Error occured please try again", 400));
  }
  res.status(200).json({ message: "Added Done", product });
});

export const updateProduct = async (req, res, next) => {
  const {
    name,
    desc,
    price,
    appliedDiscount,
    stock,
    imagesToDelete,
    categoryId,
    subCategoryId,
    brandId,
  } = req.body;
  const { _id } = req.user;
  const { productId } = req.params;
  // check productId
  const product = await productModel.findById(productId);
  if (!product) {
    return next(new AppError("invalid product id", 400));
  }
  if (product.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError(`you have no access to this product`, 401));
  }
  if (categoryId) {
    const categoryExists = await categoryModel.findById(categoryId);
    if (!categoryExists) {
      return next(new AppError("invalid categories", 400));
    }
    product.category.categoryId;
  }
  if (subCategoryId) {
    const subCategoryExists = await subCategoryModel.findById(subCategoryId);
    if (!subCategoryExists) {
      return next(new AppError("invalid categories", 400));
    }
    product.subCategory.subCategoryId = subCategoryId;
  }
  if (brandId) {
    const brandExists = await brandModel.findById(brandId || product.brand);
    if (!brandExists) {
      return next(new AppError("invalid brand", 400));
    }
    product.brand = brandId;
  }
  const {
    category: { categoryCustomId },
    subCategory: { subCategoryCustomId },
    customId,
  } = product;
  const path = cloudindaryPath(
    "product",
    customId,
    categoryCustomId,
    subCategoryCustomId,
  );
  if (req.files?.coverImage?.length) {
    const { secure_url, public_id } = await handleSingleImageUpdateAndDelete(
      req.files.coverImage[0].path,
      product.coverImage.public_id,
      path
    );
    product.coverImage = { secure_url, public_id };
  }
  if (req.files?.images?.length && imagesToDelete) {
    const imagesToDeleteArr = imagesToDelete.split(",");
    const handleResult = await handleImagesUpdateAndDelete(
      productId,
      req.files.images,
      imagesToDeleteArr,
      product,
      path,
      next
    );
    if (handleResult !== true) {
      return handleResult;
    }
  }
  handlePrice(appliedDiscount, price, product);
  if (name) {
    product.name = name;
    product.slug = slugify(name, "-");
  }
  if (desc) product.desc = desc;
  if (stock) product.stock = stock;
  product.updatedBy = _id;
  await product.save();
  return res
    .status(201)
    .json({ message: "product updated successfully.", product });
};
export const deleteProduct = errorHandler(async (req, res, next) => {
  const { productId } = req.params;
  const product = await productModel.findByIdAndDelete(productId);
  if (!product) {
    return next(new AppError("invalid product id", 400));
  }
  if (product.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError(`you have no access to this product`, 401));
  }
  const {
    category: { categoryCustomId },
    subCategory: { subCategoryCustomId },
  } = product;
  const path = `ecommerce/Categories/${categoryCustomId}/subCategories/${subCategoryCustomId}/Products/${product.customId}`;

  await handleDeleteImage(path);
  res.status(200).json({ message: "product deleted successfully.", product });
});

export const getSingleProduct = async (req, res, next) => {
  const { productId } = req.params;
  const product = await productModel.findById(productId).populate([
    { path: "category.categoryId", select: "name " },
    { path: "subCategory.subCategoryId", select: "name " },
    { path: "brand", select: "name " },
  ]);

  if (!product) {
    return next(new AppError("invalid product id", 400));
  }
  return res.status(200).json({ message: "Done", product });
};
export const getAllProducts = (async (req, res, next) => {
  const { search,size } = req.query;
  const apiFeaturesInstance = new ApiFeatures(
    productModel.find({
      $or: [
        { name: { $regex: search ? search : ".", $options: "i" } },
        { desc: { $regex: search ? search : ".", $options: "i" } },
        { slug: { $regex: search ? search : ".", $options: "i" } },
      ],
    }).populate([
      { path: "category.categoryId", select: "name " },
      { path: "subCategory.subCategoryId", select: "name " },
      { path: "brand", select: "name " },
    ]),
    req.query
  )
    .pagination()
    .filters()
    .sort()
    .select();
  const products = await apiFeaturesInstance.mongooseQuery;
  const totalCount = await productModel
    .countDocuments({
      ...apiFeaturesInstance.mongooseQuery._conditions
    })
  res
    .status(200)
    .json({
      message: "Done",
      page: req.query.page,
      totalPages: getTotalPages(totalCount,size),
      products,
    });
});

export const toggleDisabled = async (req, res, next) => {
  const { productId } = req.params;
  const product = await productModel.findById(productId);
  product.isDisabled = !product.isDisabled;
  await product.save();
  return res.status(201).json({ message: "Done" });
};
