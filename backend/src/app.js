const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const errorHandler = require("./middleware/error.middleware");
const adminRoutes = require("./routes/admin.routes");
const progressRoutes = require("./routes/progress.routes");
const submissionRoutes = require("./routes/submission.routes");
const uploadRoutes = require("./routes/upload.routes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(morgan("dev"));

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/upload", uploadRoutes);



app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AuraLearn API is running",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


app.use(errorHandler);

module.exports = app;