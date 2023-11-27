import errorHandler from "../../utils/errorHandler.js";
import { userModel } from "../../../database/models/user.model.js";
import { AppError } from "../../utils/AppErorr.js";
import { orderModel } from "../../../database/models/order.model.js";
import { reviewModel } from "../../../database/models/review.model.js";
import { ApiFeatures } from "../../utils/apiFeatures.js";
import { systemRoles } from "../../utils/systemRoles.js";
import { productModel } from "../../../database/models/product.model.js";
import { getTotalPages } from "../../utils/paginationFunction.js";
export const addReview = async (req, res, next) => {
  const { _id } = req.user;
  const { reviewDisc, rating, productId } = req.body;
  const product = await productModel.findById(productId);
  if (!product) {
    return next(new AppError("productId is required", 4004));
  }
  // Check if the user has purchased the product before allowing a review
  // const allowRev = await orderModel.findOne({
  //   userId: _id,
  //   "products.productId": productId,
  //   // status: "delivered"
  // });

  // if (!allowRev) {
  //   return next(
  //     new AppError("You must buy this product before reviewing it.", 401)
  //   );
  // }

  // Check if the user has already reviewed this product
  // const isRevBefore = await reviewModel.findOne({
  //   productId,
  //   "userId": _id,
  // });

  // if (isRevBefore) {
  //   return next(
  //     new AppError("You have already reviewed this product before.", 400)
  //   );
  // }

  //  a new review
  let review = await reviewModel.create({
    productId,
    userId: _id,
    reviewDisc,
    rating,
  });

  const allReviews = await reviewModel
    .find({ productId: productId })
    .select("rating");
  const sum = allReviews.reduce((acc, review) => acc + review.rating, 0);
  product.rating = sum / allReviews.length;
  await product.save();
  return res.status(201).json({ message: "Done", review });
};

export const updateReview = errorHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { reviewId, reviewDisc, rating } = req.body;

  // Find the review based on reviewId and user's ID
  const review = await reviewModel.findOneAndUpdate(
    {
      _id: reviewId,
      userId: _id,
    },
    {
      reviewDisc,
      rating,
    },
    { new: true } // Return the updated document
  );

  if (!review) {
    return next(
      new AppError(
        "Review not found or you don't have permission to update it.",
        404
      )
    );
  }
  if (rating) {
    const allReviews = reviewModel
      .find({ productId: productId })
      .select("rating");
    const sum = allReviews.reduce((acc, review) => acc + review.rating, 0);
    product.rating = sum / allReviews.length;
    await product.save();
  }
  return res.status(200).json({ message: "Done", review });
});

export const deleteReview = async (req, res, next) => {
  const { _id, role } = req.user;
  const { reviewId } = req.params;
  let options;
  //to give admin the premmision to delete any review
  if (role == systemRoles.ADMIN || role == systemRoles.SUPER_ADMIN) {
    options = {
      _id: reviewId,
    };
  } else {
    options = {
      _id: reviewId,
      userId: _id,
    };
  }
  const allReviews = reviewModel
    .find({ productId: productId })
    .select("rating");
  const sum = allReviews.reduce((acc, review) => acc + review.rating, 0);
  product.rating = sum / allReviews.length;
  await product.save();
  // Find and delete the review based on reviewId and user's ID
  const review = await reviewModel.findOneAndDelete(options);
  if (!review) {
    return next(
      new AppError(
        "Review not found or you don't have permission to delete it.",
        404
      )
    );
  }

  return res.status(200).json({ message: "Done", review });
};

export const getProductReviews = errorHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { search,size } = req.query;
  const apiFeaturesInstance = new ApiFeatures(
    reviewModel
      .find({
        productId,
      })
      .populate({
        path: "userId",
        select: "name",
      }),
    req.query
  )
    .pagination()
    .sort();
  const reviews = await apiFeaturesInstance.mongooseQuery;
  const totalCount = await reviewModel.countDocuments({
    productId,
    reviewDisc: { $regex: search ? search : ".", $options: "i" },
  });
  return res
    .status(200)
    .json({
      message: "Done",
      totalPages: getTotalPages(totalCount, size),
      reviews,
    });
});

// for ui to not show add review section if user not allowed
export const isAllowToRev= errorHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { _id } = req.user;
  let isOrdered = await orderModel.findOne({
    userId: _id,
    "products.productId": productId,
    status: "delivered",
  });
  
  if (!isOrdered) {
    return next(new AppError("You have not ordered this product yet.", 400));
  }
  let IsReviewed;
if (isOrdered) {
  IsReviewed = await reviewModel.findOne({
    productId,
    userId: _id,
  });
  if (IsReviewed) {
    return next(
      new AppError("You have already reviewed this product before.", 400)
    );
  }
}
  return res.status(200).json({
    message: "Done",
    isAllowToRev: !IsReviewed,
  })
})