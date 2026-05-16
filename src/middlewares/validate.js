import ApiError from "../utils/ApiError.js";
import { validationResult } from "express-validator";

const validate = (schema, location = "body") => {
  // Support express-validator style arrays: return the array of validators
  // followed by a final middleware that checks validationResult
  if (Array.isArray(schema)) {
    return [
      ...schema,
      (req, res, next) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          const errors = result.array().map((err) => ({ field: err.param, message: err.msg }));
          return next(new ApiError(400, "Validation failed", errors));
        }
        next();
      },
    ];
  }

  // Expect a Joi-like schema with `.validate()` method
  return (req, res, next) => {
    if (!schema || typeof schema.validate !== "function") {
      console.error("🔴 [CRITICAL]: Invalid validation schema passed to route!");
      return next(new ApiError(500, "Server Error: Router validation misconfiguration."));
    }

    const data = location === "query" ? req.query : location === "params" ? req.params : req.body;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({ field: detail.path.join("."), message: detail.message }));
      return next(new ApiError(400, "Validation failed", errors));
    }

    if (location === "query") req.query = value;
    else if (location === "params") req.params = value;
    else req.body = value;

    next();
  };
};

export default validate;