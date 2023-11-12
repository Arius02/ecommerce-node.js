import { categoryModel } from "../../../database/models/categroy.model.js";
import errorHandler from "../../utils/errorHandler.js";
import { addItem, deleteItem, updateItem } from "../../utils/factory.js";
import { ApiFeatures } from "../../utils/apiFeatures.js";
import { getTotalPages, paginationFunction } from "../../utils/paginationFunction.js";
import { brandModel } from "../../../database/models/brand.model.js";
import { subCategoryModel } from "../../../database/models/subCategory.model.js";
import { productModel } from "../../../database/models/product.model.js";

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
  const { search } = req.params;
  const {
    subCategoryPage,
    subCategorySize,
    productPage,
    productSize,
  } = req.query;
  const { skip: subCategorySkip, limit: subCategoryLimit } = paginationFunction(
    {
      page: subCategoryPage,
      size: subCategorySize,
    }
  );
  const { skip: productSkip, limit: productLimit } = paginationFunction({
    page: productPage,
    size: productSize,
  });

  // check categoryId
  const category = await categoryModel.findOne({
      $or: [{ id: search }, { name: search }],
    }).populate([
    {
      path: "subcategories",
      select: "name _id image",
      options: { skip: subCategorySkip, limit: subCategoryLimit },
    },
    {
      path: "products",
      select:
        "name _id coverImage rating price priceAfterDiscount appliedDiscount stock",
      options: { skip: productSkip, limit: productLimit },
    },
  ]);
  if (!category) {
    return next(new AppError("invalid category id", 400));
  }
    const totalProductPageCount = await productModel
    .countDocuments({
      "category.categoryId":category._id
    })
    const totalSubCategoryPageCount = await subCategoryModel
    .countDocuments({
      "category.categoryId":category._id
    })
  res.status(200).json({
    message: "Done",
    totalProductPageCount: getTotalPages(
      totalProductPageCount,
      productSize
    ),
    totalSubCategoryPageCount: getTotalPages(
      totalSubCategoryPageCount,
      subCategorySize
    ),
    category,
  });
});
export const getAllCategories = errorHandler(async (req, res, next) => {
  const { search ,size} = req.query;
  const apiFeaturesInstance = new ApiFeatures(
    categoryModel.find({
      name: { $regex: search ? search : ".", $options: "i" },
    }),
    req.query
  ).pagination();

  const categories = await apiFeaturesInstance.mongooseQuery;
   const totalCount = await categoryModel.countDocuments({
     ...apiFeaturesInstance.mongooseQuery._conditions,
   });
   res.status(200).json({
     message: "Done",
     page: req.query.page,
     totalPages: getTotalPages(totalCount,size),
     categories,
   });
});

export const getAllClassifications = errorHandler(async (req, res, next) => {
  const {isProduct} = req.query
  const classifications = await categoryModel.find().populate([
    {
      path: "subcategories",
      select:"name ",
    },
  ]).select("name ");
  let brands;
  if(isProduct){
     brands= await brandModel.find().select("name")
  }
  res.status(200).json({ message: "Done", classifications,brands });
});
