import errorHandler from "../../utils/errorHandler.js"
import { userModel } from "../../../database/models/user.model.js";
import { AppError } from "../../utils/AppErorr.js";
import { productModel } from "../../../database/models/product.model.js";
import { ApiFeatures } from "../../utils/apiFeatures.js";
import { getTotalPages } from "../../utils/paginationFunction.js";


export const toggleWishlist = errorHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { productId } = req.body;

  const user = await userModel.findById(_id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const isProductInWishlist = user.wishlist.includes(productId);

  const updateQuery = isProductInWishlist
    ? { $pull: { wishlist: productId } }
    : { $addToSet: { wishlist: productId } };

  const result = await userModel.findByIdAndUpdate(_id, updateQuery)

  if (!result) {
    return next(new AppError("An error occurred. Please try again.", 400));
  }

  const message = isProductInWishlist ? "Removed from wishlist" : "Added to wishlist";

  return res.status(200).json({ message, result });
});

export const getAllUserWishlist = errorHandler(async (req, res, next) => {
  const { _id } = req.user
  const user = await userModel.findById(_id);

  const apiFeaturesInstance = new ApiFeatures(
productModel.find({ _id: { $in: user.wishlist } }),
    req.query
  ).pagination();
  const wishlist = await apiFeaturesInstance.mongooseQuery;
  const totalCount = await productModel.countDocuments({
    _id: { $in: user.wishlist },
  });

    return res.status(200).json({
      message: "Done",
      totalPages: getTotalPages(totalCount, req.query.size),
      wishlist,
  });
  
});