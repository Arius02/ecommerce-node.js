import moment from "moment-timezone"
import { AppError } from "./AppErorr.js"

export const isCouponValid= (model,modelName,coupon,orders,_id,next)=>{

    if(coupon.status=="expired"||coupon.status=="disabled" || 
    moment(new Date(coupon.toDate)).isBefore(moment().tz("Africa/Cairo"))){
        return {message:"This coupon has expired and has been disabled",cause:400}
      }
      if(coupon.status=="active"&& 
      moment().isBefore(moment(new Date(coupon.fromDate)).tz("Africa/Cairo"))){
          return {message:"This coupon hass't staerted yet.",cause:400}
        }
    if(model.totalPrice<coupon.minPurchaseAmount){
        return {message:`Coupons are available for shopping ${modelName} above ${coupon.minPurchaseAmount} pounds.`,cause:400}
      }
      if(coupon.usageLimit<=coupon.usageCount){
        return {message:"All available uses of this coupon have been consumed.",cause:400}
      }
      if(coupon.userRestrictions=='first_time_shoppers' && orders?.length){
          return {message:"This coupon is only allowed for first time shopper customers",cause:401}        
    }
      if(coupon.userRestrictions=="existing_customers"&&orders?.length>=2){
          return {message:"This coupon is only valid for customers who have shopped two times or more",cause:401}
      }
      if(coupon.userRestrictions=="vip_members"&&orders?.length>=5){
          return {message:"This coupon is only valid for customers who have shopped five times or more",cause:401}
      }
      if(model.coupon){
          return {message:"You have used another coupon already.",cause:400}
      }
      const isUsed=coupon.usageHistory.find(elm=>elm.userId.toString()== _id.toString())
      if(isUsed){
        return {message:"You have used this coupon before.",cause:400}
      }
    return true
}

export const applyAndSaveCoupon =(model,coupon)=>{
    if(coupon.couponType=="percentage"){
      model.priceAfterDiscount=model.totalPrice * (1 - (coupon.discountValue || 0) / 100)
    }
    if(coupon.couponType=="fixed_amount"){
      model.priceAfterDiscount=model.totalPrice -coupon.discountValue
    }
  }