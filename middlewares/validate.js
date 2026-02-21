const AppError = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    // If it's a zod error, we render the error view
    const errorMsg = error.errors.map((e) => e.message).join(' | ');
    next(new AppError(errorMsg, 400));
  }
};

module.exports = validate;
