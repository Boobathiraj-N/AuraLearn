const errorHandler = (err, req, res, next) => {
  console.error(err.message);

  if (res.headersSent) {
    return next(err);
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Email or mobile number already exists",
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Invalid registration details",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message:
      err.statusCode && err.statusCode < 500
        ? err.message
        : "Internal server error",
  });
};

module.exports = errorHandler;