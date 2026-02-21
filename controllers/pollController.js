const prisma = require('../config/db');

exports.getHome = (req, res) => {
  res.render('index');
};

exports.createPoll = async (req, res) => {
  try {
    const { question, options } = req.body;
    const optionList = options.split(/\r?\n/).filter((opt) => opt.trim() !== '');

    const poll = await prisma.poll.create({
      data: {
        question,
        options: {
          create: optionList.map((text) => ({ text })),
        },
      },
    });

    res.redirect(`/poll/${poll.id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Database error');
  }
};

exports.getPoll = async (req, res) => {
  try {
    const pollId = req.params.id;

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) return res.status(404).send('Poll not found');

    const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes, 0);
    res.render('poll', { poll, options: poll.options, totalVotes });
  } catch (error) {
    console.error(error);
    res.status(500).send('Database error');
  }
};

exports.votePoll = async (req, res) => {
  try {
    const optionId = req.body.optionId;
    const pollId = req.params.id;

    await prisma.option.update({
      where: { id: parseInt(optionId) },
      data: { votes: { increment: 1 } },
    });

    res.redirect(`/poll/${pollId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Database error');
  }
};
