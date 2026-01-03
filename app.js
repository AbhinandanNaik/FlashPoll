console.log("1. Starting app...");
const express = require('express');
console.log("2. Express loaded.");
const sqlite3 = require('sqlite3').verbose(); 
console.log("3. SQLite loaded.");
const bodyParser = require('body-parser');
const { randomUUID: uuidv4 } = require('crypto');
const db = require('./database');
console.log("4. Modules loaded. Starting server setup...");

const app = express();
const PORT = 3000;

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// --- ROUTES ---

// 1. Home Page (Create Poll Form)
app.get('/', (req, res) => {
    res.render('index');
});

// 2. Create Poll Logic
app.post('/create', (req, res) => {
    const { question, options } = req.body; // Expects options as a string separated by newlines or commas
    const pollId = uuidv4();

    // Insert Poll
    db.run(`INSERT INTO polls (id, question) VALUES (?, ?)`, [pollId, question], function(err) {
        if (err) return console.error(err.message);

        // Process Options (Split by newline if textarea, or handle array)
        const optionList = options.split('\r\n').filter(opt => opt.trim() !== '');
        
        const stmt = db.prepare(`INSERT INTO options (poll_id, text) VALUES (?, ?)`);
        optionList.forEach(opt => {
            stmt.run(pollId, opt);
        });
        stmt.finalize();

        res.redirect(`/poll/${pollId}`);
    });
});

// 3. View Poll & Results
app.get('/poll/:id', (req, res) => {
    const pollId = req.params.id;

    // Get Poll Details
    db.get(`SELECT * FROM polls WHERE id = ?`, [pollId], (err, poll) => {
        if (err || !poll) return res.send("Poll not found");

        // Get Options for this Poll
        db.all(`SELECT * FROM options WHERE poll_id = ?`, [pollId], (err, options) => {
            // Calculate total votes for percentage bars
            const totalVotes = options.reduce((acc, opt) => acc + opt.votes, 0);
            res.render('poll', { poll, options, totalVotes });
        });
    });
});

// 4. Vote Logic
app.post('/vote/:id', (req, res) => {
    const optionId = req.body.optionId;
    const pollId = req.params.id;

    db.run(`UPDATE options SET votes = votes + 1 WHERE id = ?`, [optionId], (err) => {
        if (err) console.error(err);
        res.redirect(`/poll/${pollId}`);
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${3000}`);
});