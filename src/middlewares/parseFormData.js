import ApiError from "../utils/ApiError.js";

const parseFormData = (req, res, next) => {
  if (req.body && req.body.data) {
    try {
      const parsed = typeof req.body.data === "string"
        ? JSON.parse(req.body.data)
        : req.body.data;
      req.body = { ...parsed, _files: req.files };
    } catch (e) {
      throw new ApiError(400, "Invalid JSON in data field.");
    }
  }
  next();
};

export default parseFormData;