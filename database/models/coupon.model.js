import mongoose, { Schema, model } from "mongoose";

const couponSchema = new Schema({
  couponCode:{
    type:String,
    required:true,
    unique:true,
    lowercase:true
   },
  couponType: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_shipping'], 
    required: true,
  },
  discountValue: {
    type: Number,
    min:1,
    max:100,
    required: true,
  },
  fromDate:{
    type:String,
    required:true,
  },
  toDate:{
    type:String,
    required:true,
  },
  usageLimit: {
    type: Number,
    default: 1,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  userRestrictions: {
    type: String,
    enum:["first_time_shoppers",'vip_members',"existing_customers","live_in_cairo","all"],
    default: "all", 
  },
  minPurchaseAmount: {
    type: Number,
    default: 0,
  },
  createdBy:{
    type:mongoose.Types.ObjectId,
    ref:"User",
    required:true
},
   updatedBy:{
    type:mongoose.Types.ObjectId,
    ref:"User",
},
  status: {
    type: String,
    enum: ['active', 'expired', 'disabled'],
    default: 'active',
  },
  description: String,
  usageHistory: [
    {
      userId: String,
      orderId: String,
      usageDate: Date,
    },
  ],
});

export const couponModel=model("coupon",couponSchema)



