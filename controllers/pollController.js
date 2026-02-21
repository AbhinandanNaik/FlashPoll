const prisma = require('../config/db');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const QRCode = require('qrcode');

exports.getHome = (req, res) => {
  res.render('index');
};

exports.createPoll = catchAsync(async (req, res) => {
  const { question, options } = req.body;
  let optionList = [];
  if (typeof options === 'string') {
    optionList = options.split(/\r?\n/).filter((opt) => opt.trim() !== '');
  } else if (Array.isArray(options)) {
    optionList = options.filter((opt) => opt.trim() !== '');
  }

  if (optionList.length === 0) {
    throw new AppError('At least one valid option is required.', 400);
  }

  const poll = await prisma.poll.create({
    data: {
      question,
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

  const url = `${req.protocol}://${req.get('host')}/poll/${poll.id}`;
  const qrCodeDataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1 });
  const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes, 0);

  res.render('poll', { poll, options: poll.options, totalVotes, qrCodeDataUrl, url });
});

exports.votePoll = catchAsync(async (req, res) => {
  const optionId = req.body.optionId;
  const pollId = req.params.id;

  await prisma.option.update({
    where: { id: parseInt(optionId) },
    data: { votes: { increment: 1 } },
  });

  // Fetch updated poll state for realtime broadcast
  const updatedPoll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { options: true },
  });
  const totalVotes = updatedPoll.options.reduce((acc, opt) => acc + opt.votes, 0);

  req.io.to(pollId).emit('vote_update', { options: updatedPoll.options, totalVotes });

  res.redirect(`/poll/${pollId}`);
});
