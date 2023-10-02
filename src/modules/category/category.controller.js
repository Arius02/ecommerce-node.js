import { categoryModel } from "../../../database/models/categroy.model.js";
import errorHandler from "../../utils/errorHandler.js";
import { addItem, deleteItem, updateItem } from "../../utils/factory.js";
import { ApiFeatures } from "../../utils/apiFeatures.js";
import { paginationFunction } from "../../utils/paginationFunction.js";

export const addCategory = async (req, res, next) => {
  await addItem(categoryModel, "category", req, res, next);
};
export const updateCategory = errorHandler(async (req, res, next) => {
  await updateItem(categoryModel, "category", req, res, next);
});
export const deleteCategory = async (req, res, next) => {
  await deleteItem(categoryModel, "category", req, res, next);
};

export const getSingleCategory = errorHandler(async (req, res, next) => {
  const { _id } = req.params;
  const {
    subCategoryPage,
    subCategorySize,
    brandPage,
    brandSize,
    productPage,
    productSize,
  } = req.query;
  const { skip: subCategorySkip, limit: subCategoryLimit } = paginationFunction(
    {
      page: subCategoryPage,
      size: subCategorySize,
    }
  );
  const { skip: brandSkip, limit: brandLimit } = paginationFunction({
    page: brandPage,
    size: brandSize,
  });
  const { skip: productSkip, limit: productLimit } = paginationFunction({
    page: productPage,
    size: productSize,
  });

  // check categoryId
  const category = await categoryModel.findById(_id).populate([
    {
      path: "subcategories",
      select: "name _id image",
      options: { skip: subCategorySkip, limit: subCategoryLimit },
    },
    {
      path: "brands",
      select: "name _id image",
      options: { skip: brandSkip, limit: brandLimit },
    },
    {
      path: "products",
      select: "name _id image",
      options: { skip: productSkip, limit: productLimit },
    },
  ]);
  if (!category) {
    return next(new AppError("invalid category id", 400));
  }
  return res.status(200).json({ message: "Done", category });
});
export const getAllCategories = errorHandler(async (req, res, next) => {
  const apiFeaturesInstance = new ApiFeatures(categoryModel.find({}), req.query)
    .pagination()
    .filters()
    .sort()
    .select();
  const categories = await apiFeaturesInstance.mongooseQuery;
  res.status(200).json({ message: "Done", page: req.query.page, categories });
});

export const getAllClassifications = errorHandler(async (req, res, next) => {
  const classifications = await categoryModel.find().populate([
    {
      path: "subcategories",
    },
    {
      path: "brands",
    },
  ]);

  res.status(200).json({ message: "Done", classifications });
});
