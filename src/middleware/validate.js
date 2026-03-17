import ApiError from "../utils/ApiError.js";

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        // Safe error mapping for Zod errors
        const message = err.errors
            ? err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
            : err.message || "Validation failed";

        next(new ApiError(400, message));
    }
};

export default validate;
