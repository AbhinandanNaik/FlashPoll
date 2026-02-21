require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const pollRoutes = require('./routes/pollRoutes');
const AppError = require('./utils/AppError');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');

// === Middlewares ===
// Security Headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  max: 100, // Limit each IP to 100 requests per `window` (here, per hour)
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/', limiter);

// View Engine & Static Assets
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Data Sanitization against XSS
app.use(xss());

// Routes
app.use('/', pollRoutes);

// Unhandled Route Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
