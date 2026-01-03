const sqlite3 = require('sqlite3').verbose();

// Creates a file named 'polls.db' in your project root
const db = new sqlite3.Database('./polls.db', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to the SQLite database.');
});

// Initialize Tables
db.serialize(() => {
    // Table for the Poll Question
    db.run(`CREATE TABLE IF NOT EXISTS polls (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL
    )`);

    // Table for Options (Foreign Key linked to Polls)
    db.run(`CREATE TABLE IF NOT EXISTS options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poll_id TEXT NOT NULL,
        text TEXT NOT NULL,
        votes INTEGER DEFAULT 0,
        FOREIGN KEY(poll_id) REFERENCES polls(id)
    )`);
});

module.exports = db;