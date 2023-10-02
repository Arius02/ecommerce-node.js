import Joi from 'joi'
import { generalFields } from "../middlewares/validation.middleware.js";

export const createOrderSchema = {
    params: Joi.object({
        cartId:generalFields._id,
      }).required()
}

export const createDirectOrderSchema = {
  body: Joi.object({
      productId:generalFields._id.required(),
      quantity:Joi.number().integer().positive().min(1).required(),
      couponCode: Joi.string().min(4).max(55).optional(),
    })
}

export const cancelOrderSchema = {
  params:Joi.object({
    orderId:generalFields._id,
  }).required(),
  body: Joi.object({
      reason: Joi.string().min(4).max(100).required(),
    }).required()
}

export const updateOrderStatusSchema= {
  params:Joi.object({
    productId:generalFields._id,
  }).required(),
  body: Joi.object({
  reason: Joi.string().min(4).max(55).required(),
  orderStatus:Joi.string().valid('shipped', 'delivered', 'canceled')
}).required()
}