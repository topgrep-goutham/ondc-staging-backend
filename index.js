// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const config = require('./config/config');
// const cryptoUtils = require('./utils/crypto');
// const ondcRoutes = require('./routes/ondc');
// const db = require('./config/db');

// const app = express();

// app.use(bodyParser.json());
// app.use(cors());

// // Logging middleware
// app.use((req, res, next) => {
//     console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//     next();
// });

// // Subscription endpoint
// app.post('/on_subscribe', async (req, res) => {
//     try {
//         const { challenge } = req.body;
//         const sharedKey = cryptoUtils.calculateSharedKey(
//             config.ondc.encryptionPrivateKey,
//             config.ondc.ondcPublicKey
//         );
//         const answer = cryptoUtils.decryptAES256ECB(sharedKey, challenge);
//         res.json({ answer });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// // Site verification
// app.get('/ondc-site-verification.html', async (req, res) => {
//     const signedContent = await cryptoUtils.signMessage(
//         config.ondc.requestId,
//         config.ondc.signingPrivateKey
//     );
//     res.send(`
//     <html><meta name="ondc-site-verification" content="${signedContent}" /></html>
//   `);
// });

// app.use('/ondc', ondcRoutes);

// app.get('/', (req, res) => res.json({
//     message: 'ONDC Buyer App API',
//     environment: config.server.env,
//     subscriber_id: config.ondc.subscriberId,
// }));

// app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// const PORT = config.server.port;
// app.listen(PORT, async () => {
//     await cryptoUtils.initialize();
//     await db.connect();
//     console.log(`✅ Buyer App running at http://localhost:${PORT}`);
// });

// module.exports = app;


const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config/config');
const cryptoUtils = require('./utils/crypto');
const ondcRoutes = require('./routes/ondc');
const db = require('./config/db');

async function startServer() {
    // 1. Initialize database BEFORE anything else
    await db.connect();

    // 2. Initialize crypto
    await cryptoUtils.initialize();

    // 3. Create app
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
        res.send(`<html><meta name="ondc-site-verification" content="${signedContent}" /></html>`);
    });

    // ONDC routes
    app.use('/ondc', ondcRoutes);

    // Root
    app.get('/', (req, res) => res.json({
        message: 'ONDC Buyer App API',
        environment: config.server.env,
        subscriber_id: config.ondc.subscriberId,
    }));

    // 404
    app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

    const PORT = config.server.port;

    app.listen(PORT, () => {
        console.log(`✅ Buyer App running at http://localhost:${PORT}`);
    });
}

startServer().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});
