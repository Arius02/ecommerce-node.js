import Joi from 'joi'
import { generalFields } from '../middlewares/validation.middleware.js'

export const addCouponSchema = {
  body: Joi.object({
    couponCode: Joi.string().min(4).max(55).required(),
    couponType:Joi.string().valid('percentage', 'fixed_amount', 'free_shipping').required(),
    discountValue: Joi.number().positive().min(1).max(100).required(),
    usageLimit:Joi.number().positive().min(1).max(200).required(),
    userRestrictions: 
      Joi.string().valid(
        'first_time_shoppers',
        'vip_members',
        'existing_customers',
        'same_city',
        'all'
      ),
      fromDate: Joi.date()
      .greater(Date.now() - 24 * 60 * 60 * 1000)
      .required(),
    toDate: Joi.date().greater(Joi.ref('fromDate')).required(),
    minPurchaseAmount:Joi.number().positive().min(200).required(),
  }).required(),
}
export const updateCouponSchema = {
    body: Joi.object({
      couponCode: Joi.string().min(4).max(55).optional(),
      couponType:Joi.string().valid('percentage', 'fixed_amount', 'free_shipping').optional(),
      discountValue: Joi.number().positive().min(1).max(100).optional(),
      usageLimit:Joi.number().positive().min(1).max(200).optional(),
      userRestrictions: Joi.string().valid(
          'first_time_shoppers',
          'vip_members',
          'existing_customers',
          'same_city',
          'all'
      ),
      fromDate: Joi.date()
        .greater(Date.now() - 24 * 60 * 60 * 1000)
        .optional(),
      toDate: Joi.date().greater(Joi.ref('fromDate')).optional(),
      minPurchaseAmount:Joi.number().positive().min(200).optional(),
    }).required(),
  }
  export const deleteCouponSchema = {
    params: Joi.object({
     _id:generalFields._id
    }).required(),
  }
