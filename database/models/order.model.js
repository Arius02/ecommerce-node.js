import mongoose, { Schema, model } from "mongoose";

const orderSchema = new Schema({       
    userId:{
        type:mongoose.Types.ObjectId,
        ref:"User",
        required:true
    },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        name:String,
        price:Number,
        appliedDiscount:Number,
        priceAfterDiscount:Number
      },
  ],
    totalPrice:Number,
    priceAfterDiscount:Number,
    PaymentMethod:{
        type:String,
        enum:["cash","card"],
        default:"cash"
    },
    status: {
        type: String,
        enum: ['waitPayment','processing', 'shipped', 'delivered', 'canceled','fail to pay'],
        default: 'processing',
      },
      phoneNumbers:[String],
      address: {
        city:String,
          town:String,
          street:String, 
        },
      coupon:{type:mongoose.Types.ObjectId,ref:"coupon"},
      canceledReason:String,
      paidAt:Date
},{
    timestamps:true
})

export const orderModel=model("order",orderSchema)