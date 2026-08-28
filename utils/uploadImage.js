const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

const uploadImage = (buffer, folder = "flucke") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

module.exports = uploadImage;