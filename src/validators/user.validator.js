import Joi from "joi";
import { generalFields } from "../middlewares/validation.middleware.js";



export const signUpSchema = {
  body: Joi.object(
    {
      name: Joi.string()
        .min(3)
        .max(40)
        .required(),
      email: generalFields.email.required(),
      password: generalFields.password
        .required(),
      rePassword: Joi.ref("password"),
      phoneNumbers:Joi.array()
      .items(Joi.string().regex(/^(01[0-2]|015)\d{8}$/))
      .required(),
      address:Joi.array().items(
        Joi.object({
          city: Joi.string().required(),
          town: Joi.string().required(),
          street: Joi.string().required(),
        })
      ).required(),
        gender: Joi.string()
        .pattern(/male|female/)
        .optional(),  
        age:Joi.number()
        .min(16)
        .max(80)
        .required(),
    }) 
};

export const signInSchema = {
  body: Joi.object(
    {
      email: generalFields.email,
      password: generalFields.password
    }
  ).required()
};

export const resetPasswordSchema = {
    body: Joi.object(
      {
        newPassword: generalFields.password.required(),
        rePassword: Joi.ref("newPassword")
      }
    ),
  };
export const changePassSchema = {
  body: Joi.object(
    {
      oldPassword: generalFields.password.required(),
      newPassword: generalFields.password.required(),
      cPassword: Joi.ref("newPassword")
    }
  ),
};

export const updateUserSchema = {
  body: Joi.object(
   { name: Joi.string()
        .min(3)
        .max(40)
        ,
      email: generalFields.email,
        gender: Joi.string()
        .pattern(/male|female/)
        .optional(),  
        age:Joi.number()
        .min(16)
        .max(80)
        ,
    }
  ).optional().min(1)
};

