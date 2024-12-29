const multer = require("multer");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "./public/temp/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });
// const upload = multer({ storage });

// module.exports = { upload };

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinary/cloudinary.config"); // Import the cloudinary configuration

// Configure Multer to use Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "social_media/posts", // Folder in your Cloudinary account
    resource_type: "auto", // Automatically detect the file type (image/video)
    allowed_formats: ["jpg", "jpeg", "png", "gif", "mp4", "avi"], // Optional: restrict allowed file types
  },
});

// Create Multer instance with Cloudinary storage
const upload = multer({ storage });

module.exports = { upload };
