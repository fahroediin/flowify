const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../data/flowify.db');

const initDb = () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                return reject(err);
            }
            
            // Create tables sequentially
            db.serialize(() => {
                // Users table
                db.run(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // Flowcharts table
                db.run(`CREATE TABLE IF NOT EXISTS flowcharts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL DEFAULT 'Untitled Flowchart',
                    input_type TEXT NOT NULL,
                    input_content TEXT NOT NULL,
                    mermaid_code TEXT,
                    theme TEXT DEFAULT 'ocean',
                    svg_output TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )`, (err) => {
                    if (err) reject(err);
                    else {
                        db.close();
                        resolve();
                    }
                });
            });
        });
    });
};

module.exports = initDb;
