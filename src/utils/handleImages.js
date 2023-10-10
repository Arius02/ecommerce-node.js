import { productModel } from "../../database/models/product.model.js";
import cloudinary from "../services/cloudinary.js";
import { AppError } from "./AppErorr.js";

export async function handleUploadSingleImage(file, path) {
  const { secure_url, public_id } = await cloudinary.uploader.upload(file, {
    folder: path,
  });
  return { secure_url, public_id };
}
export async function handleUploadBulkOfImages(files, path) {
  const IDs = [];
  const images = [];
  for (const file of files) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: path,
      }
    );
    images.push({ secure_url, public_id });
    IDs.push(public_id);
  }
  return { images, IDs };
}
export async function handleSingleImagesUpdateAndDelete(file, id, path) {
  await cloudinary.uploader.destroy(id);
  const { secure_url, public_id } = await cloudinary.uploader.upload(file, {
    folder: path,
  });
  return { secure_url, public_id };
}

export async function handleImagesUpdateAndDelete(
  _id,
  files,
  imagesToDelete,
  product,
  path,
  next
) {
  const check = await productModel.findOne({
    _id,
    "images.public_id": { $in: imagesToDelete },
  });
  if (!check) {
    return next(new AppError("an error eccuored please try again . ", 404));
  }
  if (files.length !== imagesToDelete.length) {
    return next(
      new AppError(
        "you should upload and delete the same number of photos . ",
        400
      )
    );
  }
  // Cloudinary delete resources
  await cloudinary.api.delete_resources(imagesToDelete);

  // Update product images
  const newImages = [];

  for (const file of files) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: path,
      }
    );
    newImages.push({ secure_url, public_id });
  }
  // Remove deleted images from product
  const updatedImages = product.images.filter(
    (image) => !imagesToDelete.includes(image.public_id)
  );

  updatedImages.push(...newImages);

  product.images = updatedImages;
  return true;
}

export async function handleDeleteImage(path) {
  await cloudinary.api.delete_resources_by_prefix(path);
  await cloudinary.api.delete_folder(path);
}
