import Joi from "joi";
import { generalFields } from "../middlewares/validation.middleware.js";

export const addProductSchema = {
  body: Joi.object({
    name: Joi.string().min(5).max(55).required(),
    desc: Joi.string().min(5).max(255).optional(),
    price: Joi.number().positive().min(1).required(),
    appliedDiscount: Joi.number().positive().min(1).max(100).optional(),
    stock: Joi.number().integer().positive().min(1).required(),
    categoryId: generalFields._id,
    subCategoryId: generalFields._id,
    brandId: generalFields._id,
  }),
};

export const updateProductSchema = {
  body: Joi.object({
    name: Joi.string().min(5).max(55).optional(),
    desc: Joi.string().min(5).max(255).optional(),
    price: Joi.number().positive().min(1).optional(),
    appliedDiscount: Joi.number().positive().min(1).max(100).optional(),
    stock: Joi.number().integer().positive().min(1).optional(),
    categoryId: generalFields._id,
    subCategoryId: generalFields._id,
    brandId: generalFields._id,
    imagesToDelete: Joi.string().optional(),
  }),
  params: Joi.object({
    productId: generalFields._id.required(),
  }),
};
export const deleteProductSchema = {
  params: Joi.object({
    productId: generalFields._id,
  }),
};
export const getSingleProductSchema = {
  params: Joi.object({
    productId: generalFields._id,
  }),
};
