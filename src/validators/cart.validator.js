import Joi from 'joi'
import { generalFields } from "../middlewares/validation.middleware.js";

export const addToCartSchema = {
  body: Joi.object({
    productId:generalFields._id,
    quantity: Joi.number().integer().positive().min(1)
  }).required()
}
export const removeFromCartSchema = {
    params: Joi.object({
      _id:generalFields._id,
    }).optional()
  }

export const applyCouponSchema = {
    body: Joi.object({
        couponCode: Joi.string().min(4).max(55).optional(),
    }).required()
}