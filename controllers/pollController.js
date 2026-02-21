const prisma = require('../config/db');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const QRCode = require('qrcode');

exports.getHome = (req, res) => {
  res.render('index');
};

exports.createPoll = catchAsync(async (req, res) => {
  const { question, options, allowMultiple, expiresIn } = req.body;
  let optionList = [];
  if (typeof options === 'string') {
    optionList = options.split(/\r?\n/).filter((opt) => opt.trim() !== '');
  } else if (Array.isArray(options)) {
    optionList = options.filter((opt) => opt.trim() !== '');
  }

  if (optionList.length === 0) {
    throw new AppError('At least one valid option is required.', 400);
  }

  let expiresAt = null;
  if (expiresIn) {
    expiresAt = new Date(Date.now() + parseInt(expiresIn) * 60 * 60 * 1000);
  }

  const poll = await prisma.poll.create({
    data: {
      question,
      allowMultiple: allowMultiple === 'true',
      expiresAt,
      creatorId: req.user ? req.user.id : null,
      options: {
        create: optionList.map((text) => ({ text })),
      },
    },
  });

  res.redirect(`/poll/${poll.id}`);
});

exports.getPoll = catchAsync(async (req, res, next) => {
  const pollId = req.params.id;

  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { options: true },
  });

  if (!poll) {
    return next(new AppError('Poll not found with that ID', 404));
  }

  // Check Expiration
  const now = new Date();
  const isExpired = poll.expiresAt && now > poll.expiresAt;

  // Integrity Check
  const clientIp = req.ip || req.connection.remoteAddress;
  const cookieName = `voted_${pollId}`;
  let hasVoted = false;

  if (req.signedCookies[cookieName]) {
    hasVoted = true;
  } else {
    const existingVote = await prisma.voteIP.findUnique({
      where: { pollId_ip: { pollId, ip: clientIp } },
    });
    if (existingVote) hasVoted = true;
  }

  const url = `${req.protocol}://${req.get('host')}/poll/${poll.id}`;
  const qrCodeDataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1 });
  const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes, 0);

  res.render('poll', {
    poll,
    options: poll.options,
    totalVotes,
    qrCodeDataUrl,
    url,
    hasVoted,
    isExpired,
  });
});

exports.votePoll = catchAsync(async (req, res, next) => {
  let optionIds = req.body.optionId;
  const pollId = req.params.id;

  if (!optionIds) {
    return next(new AppError('You must select at least one option.', 400));
  }

  if (!Array.isArray(optionIds)) {
    optionIds = [optionIds];
  }

  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) {
    return next(new AppError('Poll not found', 404));
  }

  if (poll.expiresAt && new Date() > poll.expiresAt) {
    return next(new AppError('This poll has expired.', 403));
  }

  if (!poll.allowMultiple && optionIds.length > 1) {
    return next(new AppError('This poll does not allow multiple selections.', 403));
  }

  // Integrity Check
  const clientIp = req.ip || req.connection.remoteAddress;
  const cookieName = `voted_${pollId}`;

  if (req.signedCookies[cookieName]) {
    return next(new AppError('You have already voted on this poll.', 403));
  }

  const existingVote = await prisma.voteIP.findUnique({
    where: { pollId_ip: { pollId, ip: clientIp } },
  });
  if (existingVote) {
    return next(new AppError('You have already voted on this poll from this IP address.', 403));
  }

  await prisma.voteIP.create({
    data: { pollId, ip: clientIp },
  });

  await prisma.option.updateMany({
    where: { id: { in: optionIds.map((id) => parseInt(id)) } },
    data: { votes: { increment: 1 } },
  });

  const updatedPoll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { options: true },
  });
  const totalVotes = updatedPoll.options.reduce((acc, opt) => acc + opt.votes, 0);

  req.io.to(pollId).emit('vote_update', { options: updatedPoll.options, totalVotes });

  res.cookie(cookieName, 'true', {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    signed: true,
  });

  res.redirect(`/poll/${pollId}`);
});

exports.getDashboard = catchAsync(async (req, res) => {
  const polls = await prisma.poll.findMany({
    where: { creatorId: req.user.id },
    include: { options: true },
  });

  const formattedPolls = polls.map((poll) => {
    const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes, 0);
    return { ...poll, totalVotes };
  });

  res.render('dashboard', { polls: formattedPolls });
});

exports.deletePoll = catchAsync(async (req, res, next) => {
  const pollId = req.params.id;

  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) return next(new AppError('Poll not found', 404));
  if (poll.creatorId !== req.user.id) return next(new AppError('Unauthorized', 403));

  await prisma.poll.delete({ where: { id: pollId } });
  res.redirect('/dashboard');
});
