const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../data/flowify.db');

const getDb = () => {
    return new sqlite3.Database(dbPath);
};

// Promisified query helper
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        const db = getDb();
        db.all(sql, params, (err, rows) => {
            db.close();
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        const db = getDb();
        db.get(sql, params, (err, row) => {
            db.close();
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        const db = getDb();
        db.run(sql, params, function(err) {
            db.close();
            if (err) reject(err);
            else resolve(this); // this contains lastID and changes
        });
    });
};

module.exports = { getDb, query, get, run };
