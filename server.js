const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // limit each IP to 5 requests per windowMs
});

app.use('/api/generate-key', limiter);

// MongoDB connection
mongoose.connect('your-mongodb-uri');

// API Key Schema
const ApiKeySchema = new mongoose.Schema({
    key: String,
    created: { type: Date, default: Date.now },
    lastUsed: Date
});

const ApiKey = mongoose.model('ApiKey', ApiKeySchema);

// Routes
app.post('/api/generate-key', async (req, res) => {
    try {
        const apiKey = crypto.randomBytes(32).toString('hex');
        const newKey = new ApiKey({ key: apiKey });
        await newKey.save();
        
        res.json({ apiKey });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate API key' });
    }
});

app.post('/api/validate-key', async (req, res) => {
    try {
        const { apiKey } = req.body;
        const key = await ApiKey.findOne({ key: apiKey });
        
        if (!key) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        key.lastUsed = new Date();
        await key.save();
        
        res.json({ valid: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to validate API key' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
