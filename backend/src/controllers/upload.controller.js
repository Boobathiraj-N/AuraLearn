
const cloudinary = require("../config/cloudinary");

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "auralearn/course-thumbnails",
          resource_type: "image",
        },
        (error, uploadedImage) => {
          if (error) {
            return reject(error);
          }

          resolve(uploadedImage);
        }
      );

      stream.end(req.file.buffer);
    });

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImage };
