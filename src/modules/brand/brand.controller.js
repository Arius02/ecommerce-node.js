import errorHandler from "../../utils/errorHandler.js";
import { brandModel } from "../../../database/models/brand.model.js";
import { addItem, cloudindaryPath,  updateItem } from "../../utils/factory.js";
import { ApiFeatures } from "../../utils/apiFeatures.js";
import { getTotalPages, paginationFunction } from "../../utils/paginationFunction.js";
import {productModel} from "../../../database/models/product.model.js"
import { AppError } from "../../utils/AppErorr.js";
import { handleDeleteImage } from "../../utils/handleImages.js";
export const addBrand = errorHandler(async (req, res, next) => {
  await addItem(brandModel, "brand", req, res, next);
});

export const updateBrand = errorHandler(async (req, res, next) => {
  await updateItem(brandModel, "brand", req, res, next);
});

export const deleteBrand = errorHandler(async (req, res, next) => {
 const { _id } = req.params;
    const brand = await brandModel.findById(_id)
   if (!brand) {
     return next(new AppError("brand not found", 404));
   }
   if (brand.createdBy.toString() !== req.user._id.toString()) {
     return next(new AppError(`you have no access to this brand`, 401));
   }
    await brandModel.findByIdAndDelete({ _id })

      const products = await productModel.find({brand:_id})
        
      products.forEach((product)=>{
        const {
          category: { categoryCustomId },
          subCategory: { subCategoryCustomId },
        } = product;
        const path = `ecommerce/Categories/${categoryCustomId}/subCategories/${subCategoryCustomId}/Products/${product.customId}`;
         handleDeleteImage(path);
      })
        
       
    await handleDeleteImage(cloudindaryPath("brand",brand.customId))
    return res.status(200).json({ message: "Done" });
});
export const getSinglebBrand = async (req, res, next) => {
  const { search } = req.params;
  const { productPage, productSize } = req.query;

  const { skip: productSkip, limit: productLimit } = paginationFunction({
    page: productPage,
    size: productSize,
  });
  const brand = await brandModel
    .findOne({
      $or: [{ id: search }, { name: search }],
    })
    .populate({
      path: "products",
      select: "name _id coverImage",
      options: { skip: productSkip, limit: productLimit },
    });
  if (!brand) {
    return next(new AppError("invalid brand id", 404));
  }
    const totalProductPageCount = await productModel.countDocuments({
      "brand": brand._id,
    });
   
    res.status(200).json({
      message: "Done",
      totalProductPageCount: getTotalPages(
        totalProductPageCount,
        productSize
      ),
      brand,
    });
  return res.status(200).json({ message: "Done", brand });
};
export const getAllBrands = async (req, res, next) => {
  const { search ,size} = req.query;
  const apiFeaturesInstance = new ApiFeatures(
    brandModel
      .find({
        name: { $regex: search ? search : ".", $options: "i" },
      })
     ,
    req.query
  ).pagination();

  const brands = await apiFeaturesInstance.mongooseQuery;
  const totalCount = await brandModel.countDocuments({
    ...apiFeaturesInstance.mongooseQuery._conditions,
  });
  res.status(200).json({
    message: "Done",
    page: req.query.page,
    totalPages: getTotalPages(totalCount,size),
    brands,
  });
};

// for sub category products filterd by brands
export const getAllBrandsForOneSubCategory = async (req, res, next) => {
  const { subCategoryId } = req.params;
    const brands = await brandModel.find().populate({
      path: "products",
      match: { "subCategory.subCategoryId": subCategoryId },
      select:"_id subCategory",
      populate: {
        path: "subCategory.subCategoryId",
        select:"_id"
      },
    });
    
    // Filter out brands with no matching products in the specified subcategory
    const filteredBrands = brands.filter((brand) => brand.products.length > 0);
    console.log(subCategoryId,brands,filteredBrands);
  res
    .status(200)
    .json({ message: "Done", filteredBrands });
};
