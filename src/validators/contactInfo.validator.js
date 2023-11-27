import Joi from "joi";
import { generalFields } from "../middlewares/validation.middleware.js";

export const addUserContactInfoSchema = {
  body: Joi.object({
    phone: Joi.string()
      .regex(/^(01[0-2]|015)\d{8}$/)
      .required(),
    city: Joi.string().required(),
    governorate: Joi.string().required(),
    street: Joi.string().required(),
  }).required(),
};


export const deleteUserContactInfoSchema = {
  params: Joi.object({
    id: generalFields._id,
  }),
};

export const setDeliveryAddressSchema = {
  body: Joi.object({
    id: generalFields._id,
  }).required(),
};
