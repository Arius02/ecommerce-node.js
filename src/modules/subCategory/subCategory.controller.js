import errorHandler from "../../utils/errorHandler.js";
import { subCategoryModel } from "../../../database/models/subCategory.model.js";
import { addItem, deleteItem, updateItem } from "../../utils/factory.js";
import { ApiFeatures } from "../../utils/apiFeatures.js";
import { paginationFunction } from "../../utils/paginationFunction.js";
import { AppError } from "../../utils/AppErorr.js";

export const addSubCategory = errorHandler(async (req, res, next) => {
  await addItem(subCategoryModel, "subCategory", req, res, next);
});

export const updateSubCategory = errorHandler(async (req, res, next) => {
  await updateItem(subCategoryModel, "subCategory", req, res, next);
});

export const deleteSubCategory = errorHandler(async (req, res, next) => {
  await deleteItem(subCategoryModel, "subCategory", req, res, next);
});
export const getSingleSubCategory = errorHandler(async (req, res, next) => {
  const { _id } = req.params;
  const { brandPage, brandSize, productPage, productSize } = req.query;

  const { skip: brandSkip, limit: brandLimit } = paginationFunction({
    page: brandPage,
    size: brandSize,
  });
  const { skip: productSkip, limit: productLimit } = paginationFunction({
    page: productPage,
    size: productSize,
  });

  const subCategory = await subCategoryModel.findById(_id).populate([
    {
      path: "brands",
      select: "name _id image",
      options: { skip: brandSkip, limit: brandLimit },
    },
    {
      path: "products",
      select: "name _id coverImage",
      options: { skip: productSkip, limit: productLimit },
    },
  ]);
  if (!subCategory) {
    return next(new AppError("invalid subCategory id", 404));
  }
  return res.status(200).json({ message: "Done", subCategory });
});
export const getAllSubCategories = errorHandler(async (req, res, next) => {
  const { page, size } = req.query;
  const { limit, skip } = paginationFunction({ page, size });
  const subCategories = await subCategoryModel
    .find()
    .skip(skip)
    .limit(limit)
    .populate({
      path: "category.categoryId",
      select: "name",
    });
  res
    .status(200)
    .json({ message: "Done", page: req.query.page, subCategories });
});
