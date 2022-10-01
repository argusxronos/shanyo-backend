function errorHandler(err, req, res, next) {
  console.log("Error Handling Middleware called.");
  // jwt authentication error
  if (err.name === "UnauthorizedError") {
    return res
      .status(401)
      .json({
        success: false,
        message: "The User is no authorized",
        error: err,
      });
  }
  // Validation Error
  if (err.name === "ValidationError") {
    return res
      .status(401)
      .json({ success: false, message: "Validation Error", error: err });
  }
  // default to 500 server error
  return res
    .status(500)
    .json({ success: false, message: "Unauthorized Operation!!!", error: err });
}

module.exports = errorHandler;
