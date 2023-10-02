import mongoose, { Schema, model } from "mongoose";

const reviewSchema = new Schema({       
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
    reviews: [
        {
            userId:{
                type:mongoose.Types.ObjectId,
                ref:"User",
                required:true
            },
          reviewDisc: String,
          rating:{
            type:Number,
            required:true
          },
          reviewedAt:Date
        },
    ],
    totalRating:Number,
},{
    timestamps:true
})


export const reviewModel=model("review",reviewSchema)