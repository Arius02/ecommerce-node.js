import errorHandler from "../../utils/errorHandler.js";
import { userModel } from "../../../database/models/user.model.js";
import { AppError } from "../../utils/AppErorr.js";
import { orderModel } from "../../../database/models/order.model.js";
import { reviewModel } from "../../../database/models/review.model.js";
import { ApiFeatures } from "../../utils/apiFeatures.js";
import { systemRoles } from "../../utils/systemRoles.js";

const updateRating = (reviews, review) => {
  if (reviews && reviews.length > 0) {
    // Calculate the total rating by summing up all the ratings
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);

    // Update the totalRating in the document
    review.totalRating = totalRating / reviews.length;
  }
};
export const addReview = errorHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { reviewDesc, rating, productId } = req.body;

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
  //   "reviews.userId": _id,
  // });

  // if (isRevBefore) {
  //   return next(
  //     new AppError("You have already reviewed this product before.", 400)
  //   );
  // }

  // Find an existing review document for the product or create a new one
  let review = await reviewModel.findOne({ productId });

  if (!review) {
    review = new reviewModel({
      productId,
      reviews: [],
    });
  }

  // Add the user's review to the reviews array
  review.reviews.push({
    userId: _id,
    reviewDesc,
    rating,
    reviewedAt: new Date(),
  });
  updateRating(review.reviews, review);
  // Save the review document with the new review
  await review.save();

  return res.status(201).json({ message: "Done", review });
});

export const updateReview = errorHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { reviewId, reviewDesc, rating } = req.body;

  // Find the review based on reviewId and user's ID
  const review = await reviewModel.findOneAndUpdate(
    {
      "reviews._id": reviewId,
      "reviews.userId": _id,
    },
    {
      $set: {
        "reviews.$.reviewDesc": reviewDesc,
        "reviews.$.rating": rating,
      },
    },
    { new: true } // Return the updated document
  );

  if (!review) {
    return next(
      new AppError(
        "Rmade eview not found or you don't have permission to update it.",
        404
      )
    );
  }
  updateRating(review.reviews, review);
  return res.status(200).json({ message: "Done", review });
});

export const deleteReview = errorHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { reviewId } = req.params;
  let options;
  //to give admin the premmision to delete any review
  if (user.role == systemRoles.ADMIN || user.role == systemRoles.SUPER_ADMIN) {
    options = {
      "reviews._id": reviewId,
    };
  } else {
    options = {
      "reviews._id": reviewId,
      "reviews.userId": _id,
    };
  }
  // Find and delete the review based on reviewId and user's ID
  const review = await reviewModel.findOneAndUpdate(
    options,
    {
      $pull: {
        reviews: { _id: reviewId },
      },
    },
    { new: true } // Return the updated document
  );
  if (!review) {
    return next(
      new AppError(
        "Review not found or you don't have permission to delete it.",
        404
      )
    );
  }
  updateRating(review.reviews, review);
  await review.save();
  // Check if the review array is empty, and if so, remove the review document
  if (review.reviews.length === 0) {
    await reviewModel.findByIdAndRemove(review._id);
  }

  return res.status(200).json({ message: "Done", review });
});

export const getProductReviews = errorHandler(async (req, res, next) => {
  const { productId } = req.params;
  let rarings = [1, 5];
  if (req.query.ratings) {
    rarings = JSON.parse(req.query.ratings);
  }

  const apiFeaturesInstance = new ApiFeatures(
    reviewModel.find({
      productId,
      reviews: {
        $elemMatch: {
          rating: { $in: [...rarings] },
        },
      },
    }),
    req.query
  )
    .pagination()
    .sort();
  const reviews = await apiFeaturesInstance.mongooseQuery;

  return res
    .status(200)
    .json({ message: "Done", count: reviews.length, reviews });
});
