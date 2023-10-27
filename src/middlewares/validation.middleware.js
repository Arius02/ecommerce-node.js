// req => userdata
// schema => endPoint schema

import joi from 'joi'
import { Types } from 'mongoose'
const reqMethods = ['body', 'query', 'params', 'headers', 'file', 'files']

const validationObjectId = (value, helper) => {
  return Types.ObjectId.isValid(value)
    ? true
    : helper.message('invalid objectId')
  
}
export const generalFields = {
  email: joi
    .string()
    .email({ tlds: { allow: ['com', 'net', 'org'] } }),
  password: joi
    .string()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .messages({
      'string.pattern.base': 'Password regex fail',
    }),
  _id: joi.string().custom(validationObjectId),
}

export const validationCoreFunction = (schema) => {
  return (req, res, next) => {
    // req
    let validationErrorArr = []
    for (const key of reqMethods) {
      if (schema[key]) {
        const validationResult = schema[key].validate(req[key], {
          abortEarly: true,
        }) // error
        if (validationResult.error) {
          validationErrorArr.push(validationResult.error.details)
        }
      }
    }

    if (validationErrorArr.length) {
      return res
        .status(400)
        .json({ message: 'ValidationError', error: validationErrorArr })
      
    //   req.validationErrorArr = validationErrorArr
    //   return next(new Error('', { cause: 400 }))
    }
    next()
  }
}
