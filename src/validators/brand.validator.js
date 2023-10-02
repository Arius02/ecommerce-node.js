import joi from "joi";
import { generalFields } from "../middlewares/validation.middleware.js";

export const addBrandSchema = {
  body: joi
    .object({
      name: joi.string().min(2).max(40),
      categoryId: generalFields._id,
      subCategoryId: generalFields._id,
    })
    .required()
    .options({ presence: "required" }),
};

export const updateBrandSchema = {
  body: joi
    .object({
      name: joi.string().min(2).max(20).optional(),
      categoryId: generalFields._id.optional(),
      subCategoryId: generalFields._id.optional(),
    })
    .required(),
  params: joi
    .object({
      _id: generalFields._id,
    })
    .required(),
};

export const deleteBrandSchema = {
  params: joi
    .object({
      _id: generalFields._id,
    })
    .required(),
};

export const getSingleBrandSchema = {
  params: joi.object({
    _id: generalFields._id,
  }),
};
