import cloudinary from "../config/cloudinary.js";

export const deleteImage = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

export const deleteMultipleImages = async (publicIds) => {
  if (!publicIds || publicIds.length === 0) return;
  const deletePromises = publicIds.map((id) => cloudinary.uploader.destroy(id));
  await Promise.all(deletePromises);
};