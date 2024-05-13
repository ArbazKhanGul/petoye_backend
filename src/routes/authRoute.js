const express=require("express");
const validate = require("../middleware/validateMiddleware");
const signupSchema = require("../validation/userValidation");
const authController=require("../controllers/authController")
const upload = require('../middleware/multer');

const router=express.Router();


router.route("/register").post(upload.single('profileImage'),validate(signupSchema),authController.register);

router.route("/login").post(authController.login);

module.exports=router;