import Joi from 'joi'
import { generalFields } from "../middlewares/validation.middleware.js";

export const wishlistSchema = {
  body: Joi.object({
    productId:generalFields._id,
  }).required()
}
