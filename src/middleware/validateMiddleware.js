
const AppError=require("../errors/appError");

const validate = (schema) => async (req, res, next) => {
    try {
        const parseBody = await schema.parseAsync(req.body);
        req.body = parseBody;
        next();
    }
    catch (error) {
        let errorDetail=error.errors[0].message;
        const err= new AppError(errorDetail, 400);
        next(err);
    }

}

module.exports= validate ;