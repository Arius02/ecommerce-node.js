import joi from "joi";
import { generalFields } from "../middlewares/validation.middleware.js";

export const addSubCategorySchema = {
  body: joi
    .object({
      name: joi.string().min(2).max(40),
      categoryId: generalFields._id,
    })
    .required()
    .options({ presence: "required" }),
};

export const updateSubCategorySchema = {
  body: joi
    .object({
      name: joi.string().min(2).max(20).optional(),
      categoryId: generalFields._id.optional(),
    })
    .required(),
  params: joi
    .object({
      _id: generalFields._id,
    })
    .required(),
};

export const deleteSubCategorySchema = {
  params: joi
    .object({
      _id: generalFields._id,
    })
    .required(),
};
export const getSingleSubCategorySchema = {
  params: joi.object({
    _id: generalFields._id,
  }),
};
