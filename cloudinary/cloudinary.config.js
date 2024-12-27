const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  secure: true,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
});

const uploadOnCloudinary = async (localFilePath, resourceType = "auto") => {
  try {
    if (!localFilePath) throw new Error("File path is missing!");
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: resourceType,
      folder:
        resourceType === "video"
          ? "social_media/posts/videos"
          : "social_media/posts/images",
    });
    // await fs.unlinkSync(localFilePath);
    // return response;
  } catch (error) {
    console.error("Error during upload:", error);
    // try {
    //   if (fs.existsSync(localFilePath)) {
    //     fs.unlinkSync(localFilePath);
    //     console.log("File unlinked successfully");
    //   }
    // } catch (unlinkError) {
    //   console.error("Error unlinking file:", unlinkError);
    // }
    throw error;
  } finally {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  }
  return response;
};

module.exports = { uploadOnCloudinary };
