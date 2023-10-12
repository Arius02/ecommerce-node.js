import Joi from "joi";
import { generalFields } from "../middlewares/validation.middleware.js";

export const addReviewSchema = {
  body: Joi.object({
    productId: generalFields._id.required(),
    rating: Joi.number().integer().positive().min(1).max(5).required(),
    reviewDisc: Joi.string().min(4).max(100),
  }),
};
export const updateReviewSchema = {
  body: Joi.object({
    reviewId: generalFields._id.required(),
    rating: Joi.number().integer().positive().min(1).max(5).optional(),
    reviewDisc: Joi.string().min(4).max(100).optional(),
  }),
};
export const deleteReviewSchema = {
  params: Joi.object({
    reviewId: generalFields._id.required(),
  }),
};

export const getProductReviewsSchema = {
  params: Joi.object({
    productId: generalFields._id.required(),
  }),
};
