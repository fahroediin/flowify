const authService = require('../services/authService');

exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
        }

        const data = await authService.register(name, email, password);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const data = await authService.login(email, password);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data
        });
    } catch (error) {
        next(error);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await authService.getUserById(req.user.id);
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};
