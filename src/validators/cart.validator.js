import Joi from 'joi'
import { generalFields } from "../middlewares/validation.middleware.js";

export const addToCartSchema = {
  body: Joi.object({
    productId:generalFields._id,
    quantity: Joi.number().integer().positive().min(1)
  }).required()
}
export const addToCartSchemaForGuest = {
  body: Joi.object({
    productId: generalFields._id,
    quantity: Joi.number().integer().positive().min(1),
    cartId: generalFields._id.optional(),
  }).required(),
};
export const removeFromCartSchema = {
  body: Joi.object({
    cartId: generalFields._id.optional(),
    productId: generalFields._id.required(),
  }),
};

export const applyCouponSchema = {
    body: Joi.object({
        couponCode: Joi.string().min(4).max(55).optional(),
    }).required()
}