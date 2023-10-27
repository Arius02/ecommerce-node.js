import mongoose, { Schema, model } from "mongoose";

const subCategorySchema = new Schema(
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
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

subCategorySchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "subCategory.subCategoryId",
});

export const subCategoryModel = model("SubCategory", subCategorySchema);
