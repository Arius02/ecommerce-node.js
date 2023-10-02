import errorHandler from "../../utils/errorHandler.js";

import { brandModel } from "../../../database/models/brand.model.js";
import { addItem, deleteItem, updateItem } from "../../utils/factory.js";
import { ApiFeatures } from "../../utils/apiFeatures.js";
import { paginationFunction } from "../../utils/paginationFunction.js";

export const addBrand = errorHandler(async (req, res, next) => {
  await addItem(brandModel, "brand", req, res, next);
});

export const updateBrand = errorHandler(async (req, res, next) => {
  await updateItem(brandModel, "brand", req, res, next);
});

export const deleteBrand = errorHandler(async (req, res, next) => {
  await deleteItem(brandModel, "brand", req, res, next);
});
export const getSinglebBrand = async (req, res, next) => {
  const { _id } = req.params;
  const { productPage, productSize } = req.query;

  const { skip: productSkip, limit: productLimit } = paginationFunction({
    page: productPage,
    size: productSize,
  });
  const brand = await brandModel.findById(_id).populate({
    path: "products",
    select: "name _id image",
    options: { skip: productSkip, limit: productLimit },
  });
  if (!brand) {
    return next(new AppError("invalid brand id", 404));
  }
  return res.status(200).json({ message: "Done", brand });
};
export const getAllBrands = async (req, res, next) => {
  const { page, size } = req.query;
  const { limit, skip } = paginationFunction({ page, size });
  const brands = await brandModel
    .find()
    .skip(skip)
    .limit(limit)
    .populate([
      { path: "category.categoryId", select: "name" },
      { path: "subCategory.subCategoryId", select: "name" },
    ]);
  res.status(200).json({ message: "Done", page: req.query.page, brands });
};
