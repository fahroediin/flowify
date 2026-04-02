const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../services/dbService');

const register = async (name, email, password) => {
    // Check if user exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
        const error = new Error('Email already registered');
        error.statusCode = 409;
        throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const result = await db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
    const userId = result.lastID;

    // Generate JWT
    const token = generateToken(userId);

    return {
        user: { id: userId, name, email },
        token
    };
};

const login = async (email, password) => {
    // Get user
    const user = await db.get('SELECT id, name, email, password FROM users WHERE email = ?', [email]);
    if (!user) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    // Generate JWT
    const token = generateToken(user.id);

    return {
        user: { id: user.id, name: user.name, email: user.email },
        token
    };
};

const getUserById = async (id) => {
    const user = await db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return user;
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

module.exports = {
    register,
    login,
    getUserById
};
