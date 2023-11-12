import errorHandler from "../../utils/errorHandler.js";
import { subCategoryModel } from "../../../database/models/subCategory.model.js";
import { addItem, deleteItem, updateItem } from "../../utils/factory.js";
import { ApiFeatures } from "../../utils/apiFeatures.js";
import { getTotalPages, paginationFunction } from "../../utils/paginationFunction.js";
import { AppError } from "../../utils/AppErorr.js";
import { productModel } from "../../../database/models/product.model.js";

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
  const { search } = req.params;
  const { productPage, productSize } = req.query;

  const { skip: productSkip, limit: productLimit } = paginationFunction({
    page: productPage,
    size: productSize,
  });

  const subCategory = await subCategoryModel
    .findOne({
      $or: [{ id: search }, { name: search }],
    })
    .populate([
      {
        path: "products",
        select:
          "name _id coverImage rating price priceAfterDiscount appliedDiscount stock ",
        options: { skip: productSkip, limit: productLimit },
      },
    ]);
  if (!subCategory) {
    return next(new AppError("invalid subCategory id", 404));
  }
    
    const totalProductPageCount = await productModel.countDocuments({
      "subCategory.subCategoryId": subCategory._id,
    });
  
    res.status(200).json({
      message: "Done",
      totalProductPageCount: getTotalPages(totalProductPageCount, productSize),
      subCategory,
    });
});
export const getAllSubCategories = errorHandler(async (req, res, next) => {
  const { search,size } = req.query;
  const apiFeaturesInstance = new ApiFeatures(
    subCategoryModel
      .find({
        name: { $regex: search ? search : ".", $options: "i" },
      })
      .populate([
        {
          path: "category.categoryId",
          select: "name _id image",
        },
      ]),
    req.query
  ).pagination();

  const subCategories = await apiFeaturesInstance.mongooseQuery;
  const totalCount = await subCategoryModel.countDocuments({
     ...apiFeaturesInstance.mongooseQuery._conditions,
   });
  res
    .status(200)
    .json({
      message: "Done",
      page: req.query.page,
      totalPageCount: getTotalPages(totalCount, size),
      subCategories,
    });
});
