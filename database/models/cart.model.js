import mongoose, { Schema, model } from "mongoose";

const cartSchema = new Schema({       
    userId:{
        type:mongoose.Types.ObjectId,
        ref:"User",
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
    coupon:{
      type:mongoose.Types.ObjectId,
      ref:"coupon"
    }
},{
    timestamps:true
})

export const cartModel=model("Cart",cartSchema)