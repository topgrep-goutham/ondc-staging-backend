const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config/config');
const cryptoUtils = require('./utils/crypto');
const ondcRoutes = require('./routes/ondc');

const app = express();

app.use(bodyParser.json());
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Subscription endpoint
app.post('/on_subscribe', async (req, res) => {
    try {
        const { challenge } = req.body;
        const sharedKey = cryptoUtils.calculateSharedKey(
            config.ondc.encryptionPrivateKey,
            config.ondc.ondcPublicKey
        );
        const answer = cryptoUtils.decryptAES256ECB(sharedKey, challenge);
        res.json({ answer });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Site verification
app.get('/ondc-site-verification.html', async (req, res) => {
    const signedContent = await cryptoUtils.signMessage(
        config.ondc.requestId,
        config.ondc.signingPrivateKey
    );
    res.send(`
    <html>
        <head>
            <meta name="ondc-site-verification" content="${signedContent}" />
        </head>
        <body>
            ONDC Site Verification Page
        </body>
    </html>
  `);
});

app.use('/ondc', ondcRoutes);

app.get('/', (req, res) => res.json({
    message: 'ONDC Buyer App API with SQLite',
    environment: config.server.env,
    subscriber_id: config.ondc.subscriberId,
    database: 'SQLite (ondc.db)',
    endpoints: {
        ondc: '/ondc/*',
        search: {
            result: '/search/result?transaction_id=xxx',
            results: '/search/results?limit=50&offset=0'
        }
    }
}));

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
});

const PORT = config.server.port;

app.listen(PORT, async () => {
    await cryptoUtils.initialize();
    console.log(`✅ Buyer App running at http://localhost:${PORT}`);
});

module.exports = app;