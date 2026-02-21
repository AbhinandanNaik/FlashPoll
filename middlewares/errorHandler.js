module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  console.error('ERROR 💥', err);

  // Instead of sending JSON, we render an error page since this is an EJS app for now.
  res.status(err.statusCode).render('error', {
    msg: err.isOperational ? err.message : 'Something went very wrong!',
    status: err.statusCode,
  });
};
