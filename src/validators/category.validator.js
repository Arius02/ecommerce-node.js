import joi from "joi";
import { generalFields } from "../middlewares/validation.middleware.js";

export const addCategorySchema = {
  body: joi
    .object({
      name: joi.string().min(2).max(40),
    })
    .required()
    .options({ presence: "required" }),
};

export const updateCategorySchema = {
  body: joi
    .object({
      name: joi.string().min(2).max(20).optional(),
    })
    .required(),
  params: joi
    .object({
      _id: generalFields._id,
    })
    .required(),
};

export const deleteCategorySchema = {
  params: joi
    .object({
      _id: generalFields._id,
    })
    .required(),
};
export const getSingleCategorySchema = {
  params: joi.object({
    search: joi.string().required(),
  }),
};
