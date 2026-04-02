const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const initDb = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve main frontend build if needed
// app.use(express.static('../dist'));

// Initialize Database
initDb().then(() => {
    console.log('Database initialized successfully.');
}).catch(err => {
    console.error('Failed to initialize database:', err);
});

// Basic Route for testing
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Flowify API is running' });
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const flowchartRoutes = require('./routes/flowchartRoutes');
const themeRoutes = require('./routes/themeRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/flowcharts', flowchartRoutes);
app.use('/api/themes', themeRoutes);

// Error Handler Middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
