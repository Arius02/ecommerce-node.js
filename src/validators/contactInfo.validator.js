import Joi from "joi";
import { generalFields } from "../middlewares/validation.middleware.js";

export const addUserContactInfoSchema={
    body:Joi.object({
      phoneNumber:Joi.string().regex(/^(01[0-2]|015)\d{8}$/)
      ,
      address:Joi.object({
          city: Joi.string().required(),
          town: Joi.string().required(),
          street: Joi.string().required(),
        })
    }).optional().min(1)
  } 
  export const updateUserContactInfoSchema={
    body:Joi.object({
      id:  generalFields._id    ,
      address:Joi.object({
          city: Joi.string().required(),
          town: Joi.string().required(),
          street: Joi.string().required(),
        })
    }).required()
  } 

  export const deleteUserContactInfoSchema={
    body:Joi.object({
      phoneNumber:Joi.string().regex(/^(01[0-2]|015)\d{8}$/)
      ,
     id:generalFields._id
    }).required()
  } 

  export const setDeliveryAddressSchema={
    params:Joi.object({
     id:generalFields._id
    }).required()
  } 
  