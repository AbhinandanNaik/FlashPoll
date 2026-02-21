const { randomUUID: uuidv4 } = require('crypto');
const db = require('../config/db');

exports.getHome = (req, res) => {
    res.render('index');
};

exports.createPoll = (req, res) => {
    const { question, options } = req.body;
    const pollId = uuidv4();

    db.run(`INSERT INTO polls (id, question) VALUES (?, ?)`, [pollId, question], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Database error");
        }

        const optionList = options.split(/\r?\n/).filter(opt => opt.trim() !== '');

        const stmt = db.prepare(`INSERT INTO options (poll_id, text) VALUES (?, ?)`);
        optionList.forEach(opt => {
            stmt.run(pollId, opt);
        });
        stmt.finalize();

        res.redirect(`/poll/${pollId}`);
    });
};

exports.getPoll = (req, res) => {
    const pollId = req.params.id;

    db.get(`SELECT * FROM polls WHERE id = ?`, [pollId], (err, poll) => {
        if (err || !poll) return res.status(404).send("Poll not found");

        db.all(`SELECT * FROM options WHERE poll_id = ?`, [pollId], (err, options) => {
            if (err) return res.status(500).send("Database error");
            const totalVotes = options.reduce((acc, opt) => acc + opt.votes, 0);
            res.render('poll', { poll, options, totalVotes });
        });
    });
};

exports.votePoll = (req, res) => {
    const optionId = req.body.optionId;
    const pollId = req.params.id;

    db.run(`UPDATE options SET votes = votes + 1 WHERE id = ?`, [optionId], function (err) {
        if (err) console.error(err.message);
        res.redirect(`/poll/${pollId}`);
    });
};
