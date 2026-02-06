function errorMiddleware(err, req, res, next) {
  if (err?.name === "ZodError") {
    return res.status(422).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
  }

  const status = err.statusCode || 400;
  const message = err.message || "Something went wrong";
  return res.status(status).json({ error: message });
}

module.exports = { errorMiddleware };