import cloudinaryModule from "cloudinary";
import env from "./env.js";

const cloudinary = cloudinaryModule.v2;

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

class CustomCloudinaryStorage {
  constructor(options) {
    this.cloudinary = cloudinary;
    this.folder = options.folder;
    this.allowedFormats = options.allowedFormats;
    this.transformation = options.transformation;
  }

  _handleFile(req, file, cb) {
    const uploadOptions = {
      folder: this.folder,
      allowed_formats: this.allowedFormats,
      transformation: this.transformation,
      resource_type: "image",
    };

    const stream = this.cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return cb(error);
        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
        });
      }
    );

    file.stream.pipe(stream);
  }

  _removeFile(req, file, cb) {
    this.cloudinary.uploader.destroy(file.filename, cb);
  }
}

export const profileStorage = new CustomCloudinaryStorage({
  folder: "easytofindedu/profiles",
  allowedFormats: ["jpg", "jpeg", "png", "webp"],
  transformation: [{ width: 400, height: 400, crop: "fill" }],
});

export const hostelStorage = new CustomCloudinaryStorage({
  folder: "easytofindedu/hostels",
  allowedFormats: ["jpg", "jpeg", "png", "webp"],
  transformation: [{ width: 1200, height: 800, crop: "limit" }],
});

/**
 * Upload helper that accepts either a local file path or a multer memory buffer
 * Returns an object: { url: string, publicId: string }
 */
export const uploadOnCloudinary = async (fileOrPath, options = {}) => {
  if (!fileOrPath) throw new Error('No file provided for Cloudinary upload');

  // If multer memory storage (buffer present)
  if (fileOrPath.buffer) {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: options.folder || 'easytofindedu/blogs',
        resource_type: options.resource_type || 'image',
        timeout: 60000, // 60s
      };

      // Safety timeout — Cloudinary SDK timeout is a best-effort.
      const timer = setTimeout(() => {
        reject(new Error('Cloudinary upload timed out after 60s'));
      }, 65000);

      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        clearTimeout(timer);
        if (error) {
          console.error('[cloudinary] upload_stream error:', error?.message || error);
          return reject(error);
        }
        if (!result || !result.secure_url) {
          console.error('[cloudinary] upload_stream returned no result/secure_url');
          return reject(new Error('Cloudinary returned no URL'));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      });

      // Write the buffer BEFORE ending the stream. Some Cloudinary SDK
      // versions don't flush the final-chunk-on-end pattern correctly,
      // which silently drops the payload and resolves with no URL.
      const buf = fileOrPath.buffer;
      if (Buffer.isBuffer(buf) || buf instanceof Uint8Array) {
        stream.write(buf);
        stream.end();
      } else {
        // Fallback: some multer configs expose a Stream, not a Buffer
        buf.pipe(stream);
      }
    });
  }

  // If string path (local path or remote URL). If it's already a remote URL, return as-is
  if (typeof fileOrPath === 'string') {
    if (fileOrPath.startsWith('http')) {
      return { url: fileOrPath, publicId: '' };
    }
    const result = await cloudinary.uploader.upload(fileOrPath, {
      folder: options.folder || 'easytofindedu/blogs',
      resource_type: options.resource_type || 'image',
      timeout: 60000,
    });
    if (!result || !result.secure_url) {
      throw new Error('Cloudinary returned no URL');
    }
    return { url: result.secure_url, publicId: result.public_id };
  }

  throw new Error('Unsupported file input for Cloudinary upload');
};

export default cloudinary;