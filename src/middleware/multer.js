const multer = require("multer");
const path = require("path");

// set storage
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../images")); // Save in /images at root
  },
  filename: function (req, file, cb) {
    var ext = path.extname(file.originalname);
    cb(
      null,
      file.fieldname +
        "-" +
        Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        ext
    );
  },
});

const upload = multer({ storage });

module.exports = upload;
