const express=require("express");
const validate = require("../middleware/validateMiddleware");
const signupSchema = require("../validation/userValidation");
const authController=require("../controllers/authController")

const router=express.Router();


router.route("/register").post(validate(signupSchema),authController.register);

router.route("/login").post(authController.login);

module.exports=router;