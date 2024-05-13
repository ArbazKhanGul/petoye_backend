const multer = require("multer");

// set storeage

var storege = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "src/images");
  },

  filename: function (req, file, cb) {
    var ext = file.originalname.substr(file.originalname.lastIndexOf("."));
    console.log(file.fieldname);
    cb(null, file.fieldname + "-" + Date.now()+'-'+Math.round(Math.random() * 1E9)+ ext);
  },
});

const store = multer({ storage: storege });

module.exports = store;