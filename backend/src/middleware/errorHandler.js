import env from '../config/env.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';
  let details = err.details;

  if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = 'Please fix the highlighted fields.';
    details = Object.fromEntries(Object.entries(err.errors).map(([key, e]) => [key, e.message]));
  } else if (err.name === 'CastError') {
    status = 404;
    message = 'That record could not be found.';
  } else if (err.code === 11000) {
    status = 409;
    message = 'An account with this email already exists.';
    details = { email: 'This email is already registered.' };
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'The request body is not valid JSON.';
  }

  if (status >= 500) console.error(err);

  res.status(status).json({
    message: status >= 500 && env.nodeEnv === 'production' ? 'Internal server error.' : message,
    ...(details && { details }),
    ...(env.nodeEnv !== 'production' && status >= 500 && { stack: err.stack }),
  });
};

export default errorHandler;
