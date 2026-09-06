import ApiError from "../utils/ApiError.js";
import { validationResult } from "express-validator";

// ==========================================
// REMOVE EMPTY STRINGS RECURSIVELY
// ==========================================

const removeEmptyStrings = (obj) => {
  // Arrays
  if (Array.isArray(obj)) {
    return obj.map(removeEmptyStrings);
  }

  // Objects
  if (obj !== null && typeof obj === "object") {
    Object.keys(obj).forEach((key) => {
      if (obj[key] === "") {
        delete obj[key];
      } else if (typeof obj[key] === "object") {
        removeEmptyStrings(obj[key]);
      }
    });
  }

  return obj;
};

const validate = (schema, location = "body") => {
  // ==========================================
  // EXPRESS VALIDATOR SUPPORT
  // ==========================================

  if (Array.isArray(schema)) {
    return [
      ...schema,

      (req, res, next) => {
        const result = validationResult(req);

        if (!result.isEmpty()) {
          const errors = result.array().map((err) => ({
            field: err.param,
            message: err.msg,
          }));

          return next(
            new ApiError(400, "Validation failed", errors)
          );
        }

        next();
      },
    ];
  }

  // ==========================================
  // JOI VALIDATION
  // ==========================================

  return (req, res, next) => {
    if (!schema || typeof schema.validate !== "function") {
      console.error(
        "🔴 [CRITICAL]: Invalid validation schema passed to route!"
      );

      return next(
        new ApiError(
          500,
          "Server Error: Router validation misconfiguration."
        )
      );
    }

    // Select request source
    let data =
      location === "query"
        ? req.query
        : location === "params"
        ? req.params
        : req.body;

    // 🔥 Remove empty strings before validation
    data = removeEmptyStrings(data);

    // Joi Validation
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
      allowUnknown: true,
    });

    // Validation Error
    if (error) {
      console.log("❌ JOI VALIDATION ERROR:");

      const errors = error.details.map((detail) => {
        console.log({
          field: detail.path.join("."),
          message: detail.message,
        });

        return {
          field: detail.path.join("."),
          message: detail.message,
        };
      });

      return next(
        new ApiError(400, "Validation failed", errors)
      );
    }

    // Replace cleaned validated data
    if (location === "query") req.query = value;
    else if (location === "params") req.params = value;
    else req.body = value;

    next();
  };
};

export default validate;