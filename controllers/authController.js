const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'flashpoll-super-secret-jwt-key-xyz', {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  });
};

const createSendToken = (user, statusCode, res, redirectUrl = '/') => {
  const token = signToken(user.id);

  res.cookie('jwt', token, {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  });

  res.redirect(redirectUrl);
};

exports.getLogin = (req, res) => res.render('login');
exports.getRegister = (req, res) => res.render('register');

exports.register = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError('Please provide both username and password', 400));
  }

  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    return next(new AppError('Username is already taken', 400));
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError('Please provide username and password', 400));
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError('Incorrect username or password', 401));
  }

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.redirect('/');
};

// Global Middleware to make User available to EJS templates if logged in
exports.checkUser = catchAsync(async (req, res, next) => {
  let token;
  if (req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
    token = req.cookies.jwt;
  }

  if (!token) {
    res.locals.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'flashpoll-super-secret-jwt-key-xyz'
    );
    const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (currentUser) {
      req.user = currentUser;
      res.locals.user = currentUser;
    } else {
      res.locals.user = null;
    }
    return next();
  } catch (err) {
    res.locals.user = null;
    return next();
  }
});

// Middleware to protect routes that require auth
exports.protect = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  next();
});
