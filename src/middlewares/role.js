import ApiError from "../utils/ApiError.js";

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.admin?.role;
    if (!userRole || !roles.includes(userRole)) {
      throw new ApiError(403, "You do not have permission to perform this action.");
    }
    next();
  };
};

export default authorizeRoles;