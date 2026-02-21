require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const pollRoutes = require('./routes/pollRoutes');
const authRoutes = require('./routes/authRoutes');
const authController = require('./controllers/authController');
const AppError = require('./utils/AppError');
const errorHandler = require('./middlewares/errorHandler');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

// Inject io into request
app.use((req, res, next) => {
  req.io = io;
  next();
});

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');

// === Middlewares ===
// Security Headers
app.use(helmet());

// Cookie Parser
app.use(cookieParser(process.env.COOKIE_SECRET || 'flashpoll-enterprise-secret-key'));

// User Check globally via JWT
app.use(authController.checkUser);

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
app.use('/', authRoutes);
app.use('/', pollRoutes);

// Unhandled Route Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

// Socket.io Real-time Handlers
io.on('connection', (socket) => {
  socket.on('join_poll', (pollId) => {
    socket.join(pollId);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
