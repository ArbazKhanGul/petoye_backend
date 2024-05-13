
const AppError = require('../errors/appError');

const errorMiddleware = (err, req, res, next) => {
    // Check if the error is an instance of AppError
    if (err instanceof AppError) {
        // Handle specific AppError
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {
        // Handle generic or unknown error
        console.error('Unhandled error:', err);

        // Return a generic error response
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

module.exports = errorMiddleware;
