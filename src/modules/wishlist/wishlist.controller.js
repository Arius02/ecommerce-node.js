import errorHandler from "../../utils/errorHandler.js"
import { userModel } from "../../../database/models/user.model.js";
import { AppError } from "../../utils/AppErorr.js";


export const addToWishlist = errorHandler(async (req, res, next) => {
  const { _id } = req.user
  const {productId}=req.body
  const resault = await userModel.findByIdAndUpdate(_id,{
    $addToSet:{wishlist:productId}
  },{new:true}).select("wishlist")

  if(!resault){
    return next(new AppError("an error eccoured please try again.", 400))
  }
  return res.status(200).json({message:"done" ,resault})
});
export const removeFromWishlist = errorHandler(async (req, res, next) => {
  const { _id } = req.user
  const {productId}=req.body
  const resault = await userModel.findByIdAndUpdate(_id,{
    $pull:{wishlist:productId}
  },{new:true}).select("wishlist")

  if(!resault){
    return next(new AppError("an error eccoured please try again.", 401))
  }
  return res.status(200).json({message:"done" ,resault})
});
export const getAllUserWishlist = errorHandler(async (req, res, next) => {
  const { _id } = req.user
  const resault = await userModel.findById(_id,).select("wishlist")
  if(!resault){
    return next(new AppError("an error eccoured please try again.", 401))
  }
  return res.status(200).json({message:"done" ,resault,count:resault.wishlist.length})
});