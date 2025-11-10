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


// // const express = require('express');
// // const bodyParser = require('body-parser');
// // const cors = require('cors');
// // const config = require('./config/config');
// // const cryptoUtils = require('./utils/crypto');
// // const ondcRoutes = require('./routes/ondc');
// // const db = require('./config/db');

// // async function startServer() {
// //     // 1. Initialize database BEFORE anything else
// //     await db.connect();

// //     // 2. Initialize crypto
// //     await cryptoUtils.initialize();

// //     // 3. Create app
// //     const app = express();

// //     app.use(bodyParser.json());
// //     app.use(cors());

// //     // Logging middleware
// //     app.use((req, res, next) => {
// //         console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
// //         next();
// //     });

// //     // Subscription endpoint
// //     app.post('/on_subscribe', async (req, res) => {
// //         try {
// //             const { challenge } = req.body;
// //             const sharedKey = cryptoUtils.calculateSharedKey(
// //                 config.ondc.encryptionPrivateKey,
// //                 config.ondc.ondcPublicKey
// //             );
// //             const answer = cryptoUtils.decryptAES256ECB(sharedKey, challenge);
// //             res.json({ answer });
// //         } catch (err) {
// //             res.status(500).json({ error: err.message });
// //         }
// //     });

// //     // Site verification
// //     app.get('/ondc-site-verification.html', async (req, res) => {
// //         const signedContent = await cryptoUtils.signMessage(
// //             config.ondc.requestId,
// //             config.ondc.signingPrivateKey
// //         );
// //         res.send(`<html><meta name="ondc-site-verification" content="${signedContent}" /></html>`);
// //     });

// //     // ONDC routes
// //     app.use('/ondc', ondcRoutes);

// //     // Root
// //     app.get('/', (req, res) => res.json({
// //         message: 'ONDC Buyer App API',
// //         environment: config.server.env,
// //         subscriber_id: config.ondc.subscriberId,
// //     }));

// //     // 404
// //     app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// //     const PORT = config.server.port;

// //     app.listen(PORT, () => {
// //         console.log(`✅ Buyer App running at http://localhost:${PORT}`);
// //     });
// // }

// // startServer().catch(err => {
// //     console.error('❌ Failed to start server:', err);
// //     process.exit(1);
// // });


const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config/config');
const cryptoUtils = require('./utils/crypto');
const ondcRoutes = require('./routes/ondc');
const searchRoutes = require('./routes/search');
const db = require('./config/db');
const path = require('path');

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
    <html><meta name="ondc-site-verification" content="${signedContent}" /></html>
  `);
});

// ONDC routes
app.use('/ondc', ondcRoutes);

// Search routes
app.use('/search', searchRoutes);

// Root endpoint
app.get('/', (req, res) => res.json({
    message: 'ONDC Buyer App API',
    environment: config.server.env,
    subscriber_id: config.ondc.subscriberId,
    endpoints: {
        ondc: '/ondc/*',
        search: {
            results: '/search/results',
            resultsByTransaction: '/search/results/:transactionId',
            latest: '/search/latest',
            searchProducts: '/search/products?q=query',
            productsByTransaction: '/search/products/:transactionId'
        }
    }
}));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
});

const PORT = config.server.port;
// Ensure SQLITE_PATH points to the repository DB by default in development
if (!process.env.SQLITE_PATH) {
    const defaultSqlite = path.resolve(__dirname, config.sqlite?.path || './database/ondc.db');
    process.env.SQLITE_PATH = defaultSqlite;
    console.log('Setting default SQLITE_PATH ->', process.env.SQLITE_PATH);
}

app.listen(PORT, async () => {
    await cryptoUtils.initialize();
    await db.connect();
    console.log(`✅ Buyer App running at http://localhost:${PORT}`);
    console.log(`📦 Database: ${process.env.SQLITE_PATH || 'ondc.db'}`);
});

module.exports = app;