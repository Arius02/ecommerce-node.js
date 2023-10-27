import mongoose, { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    image: {
      secure_url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    customId: String,
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);
categorySchema.virtual("subcategories", {
  ref: "SubCategory",
  localField: "_id",
  foreignField: "category.categoryId",
});
categorySchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "category.categoryId",
});
export const categoryModel = model("Category", categorySchema);
