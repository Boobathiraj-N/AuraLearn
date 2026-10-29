const errorHandler = (err, req, res, next) => {
  console.error(err.message);

  if (res.headersSent) {
    return next(err);
  }


  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || {})[0];

    const messages = {
      email: "Email already exists",
      mobile: "Mobile number already exists",
      slug: "Course slug already exists",
    };

    return res.status(409).json({
      success: false,
      message:
        messages[duplicateField] ||
        `Duplicate value for field: ${duplicateField || "unknown"}`,
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