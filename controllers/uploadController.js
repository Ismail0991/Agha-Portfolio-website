const { uploadBuffer, destroyImage } = require("../config/cloudinary");

exports.uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file provided" });
  }

  try {
    const result = await uploadBuffer(req.file.buffer, {
      folder: req.body.folder || undefined,
    });

    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      format: result.format,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Image upload failed",
    });
  }
};

exports.deleteImage = async (req, res) => {
  const { publicId } = req.body;

  if (!publicId) {
    return res.status(400).json({ message: "publicId is required" });
  }

  try {
    const result = await destroyImage(publicId);
    res.json({ result: result.result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
