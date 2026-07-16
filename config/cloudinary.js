const { v2: cloudinary } = require("cloudinary");

const FOLDER = process.env.CLOUDINARY_FOLDER || "digitalhub";

const initializeCloudinary = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn("Cloudinary is not configured -- image uploads will fail.");
    console.warn("  Set CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET in .env");
    return false;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  console.log(`Cloudinary initialized (cloud: ${CLOUDINARY_CLOUD_NAME})`);
  return true;
};

// Like the Firebase check: config() only stores keys locally and never contacts
// Cloudinary, so bad credentials would otherwise stay silent until the first upload.
const verifyCloudinaryCredential = async () => {
  try {
    await cloudinary.api.ping();
    console.log("Cloudinary credential verified");
    return true;
  } catch (error) {
    console.error("\nCLOUDINARY CREDENTIAL REJECTED");
    console.error(`  reason: ${error.message || error.error?.message}`);
    console.error("  Check CLOUDINARY_* values in .env\n");
    return false;
  }
};

// Buffer -> Cloudinary. Uses upload_stream so the file never touches disk.
const uploadBuffer = (buffer, { folder = FOLDER, publicId } = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

const destroyImage = (publicId) => cloudinary.uploader.destroy(publicId);

module.exports = {
  cloudinary,
  initializeCloudinary,
  verifyCloudinaryCredential,
  uploadBuffer,
  destroyImage,
  FOLDER,
};
