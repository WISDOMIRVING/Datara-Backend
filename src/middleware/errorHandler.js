import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";


/**
 * Global error-handling middleware.
 * Must be registered AFTER all routes in app.js.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    const statusCode = err instanceof ApiError ? err.statusCode : 500;
    const message = err.message || "Internal Server Error";

    console.error(`❌ ERROR [${req.method} ${req.originalUrl}]:`, message);
    if (err.stack) console.error(err.stack);

    logger.error(`${req.method} ${req.originalUrl} — ${message}`, {
        statusCode,
        stack: err.stack,
        body: req.body,
        user: req.user?.id
    });



    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
};

export default errorHandler;
