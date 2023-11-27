import mongoose, { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    desc: String,
    price: {
      type: Number,
      required: true,
      default: 1,
    },
    appliedDiscount: {
      type: Number,
      default: 1,
    },
    priceAfterDiscount: {
      type: Number,
      required: true,
      default: 1,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    coverImage: {
      secure_url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
    images: [
      {
        secure_url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
      },
    ],
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
    brand: {
      type: mongoose.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    rating: Number,
  },
  {
    timestamps: true,
  }
);

export const productModel = model("Product", productSchema);
