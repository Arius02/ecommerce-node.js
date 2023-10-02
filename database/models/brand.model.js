import mongoose, { Schema, model } from "mongoose";

const brandSchema = new Schema(
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
    category: {
      categoryId: {
        type: mongoose.Types.ObjectId,
        ref: "Category",
        required: true,
      },
      categoryCustomId: String,
    },
    subCategory: {
      subCategoryId: {
        type: mongoose.Types.ObjectId,
        ref: "SubCategory",
        required: true,
      },
      subCategoryCustomId: String,
    },
  },
  {
    timestamps: true,
  }
);
brandSchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "brand.brandId",
});

export const brandModel = model("Brand", brandSchema);
