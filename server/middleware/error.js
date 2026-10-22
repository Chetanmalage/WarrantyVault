const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.originalUrl}` });

const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') { status = 400; message = 'Invalid id format'; }
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map(e => e.message).join(', '); }
  if (err.code === 11000) { status = 400; message = 'Duplicate value entered'; }
  if (err.name === 'MulterError') { status = 400; }

  console.error('💥', message);
  res.status(status).json({ message });
};

module.exports = { notFound, errorHandler };