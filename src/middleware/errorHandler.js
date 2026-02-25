import ApiError from "../utils/ApiError.js";

/**
 * Global error-handling middleware.
 * Must be registered AFTER all routes in app.js.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    const statusCode = err instanceof ApiError ? err.statusCode : 500;
    const message = err.message || "Internal Server Error";

    console.error(`[ERROR] ${req.method} ${req.originalUrl} — ${message}`);
    if (process.env.NODE_ENV !== "production") {
        console.error(err.stack);
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
};

export default errorHandler;
