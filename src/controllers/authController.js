const AppError=require("../errors/appError");

exports.register= async (req,res,next) => {

    try{
        // const error = new AppError('Error in creating user detaill', 400);
        // return next(error);
      
      res.status(201).json({message:"user created successfully"})
    }
    catch(err){
        const error = new AppError('Error in creating user', 400);
        next(error);
    }
}

exports.login= async(req,res,next)=>{
    try{
    res.status(201).json({message:"user login successfully"})
    }
    catch(error){

    }
}