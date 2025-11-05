// // Import required modules
// const express = require('express'); // Express framework for handling HTTP requests
// const bodyParser = require('body-parser'); // Middleware for parsing request bodies
// const crypto = require('crypto'); // Node.js crypto module for encryption and decryption
// const _sodium = require('libsodium-wrappers');
// const cors = require('cors');

// const port = 3000; // Port on which the server will listen
// const ENCRYPTION_PRIVATE_KEY =
//     'MC4CAQAwBQYDK2VuBCIEIED0OV2s3QdevvacHlRfJF3sM5RsethFHL4UiQ7/Vk1t';
// const ONDC_PUBLIC_KEY =
//     'MCowBQYDK2VuAyEAduMuZgmtpjdCuxv+Nc49K0cB6tL/Dj3HZetvVN7ZekM=';
// const REQUEST_ID = 'c0941deb-8b89-4a12-adde-ffa5da6ada0a';
// const SIGNING_PRIVATE_KEY =
//     'OYZUrSfWPoJLv7uC5tJM/NuQbtNtQkvfb2tR7uDo0VBEs+EdrXUzxyMPe3wYdUz2qW6Z702la3w38Eys8pez/w==';

// const htmlFile = `
// <!--Contents of ondc-site-verification.html. -->
// <!--Please replace SIGNED_UNIQUE_REQ_ID with an actual value-->
// <html>
//   <head>
//     <meta
//       name="ondc-site-verification"
//       content="OYZUrSfWPoJLv7uC5tJM/NuQbtNtQkvfb2tR7uDo0VBEs+EdrXUzxyMPe3wYdUz2qW6Z702la3w38Eys8pez/w=="
//     />
//   </head>
//   <body>
//     ONDC Site Verification Page
//   </body>
// </html>
// `;
// // Pre-defined public and private keys
// const privateKey = crypto.createPrivateKey({
//     key: Buffer.from(ENCRYPTION_PRIVATE_KEY, 'base64'), // Decode private key from base64
//     format: 'der', // Specify the key format as DER
//     type: 'pkcs8', // Specify the key type as PKCS#8
// });
// const publicKey = crypto.createPublicKey({
//     key: Buffer.from(ONDC_PUBLIC_KEY, 'base64'), // Decode public key from base64
//     format: 'der', // Specify the key format as DER
//     type: 'spki', // Specify the key type as SubjectPublicKeyInfo (SPKI)
// });

// // Calculate the shared secret key using Diffie-Hellman
// const sharedKey = crypto.diffieHellman({
//     privateKey: privateKey,
//     publicKey: publicKey,
// });

// // Create an Express application
// const app = express();
// app.use(bodyParser.json()); // Middleware to parse JSON request bodies
// app.use(cors()); // Enable CORS for all routes

// // Route for handling subscription requests
// app.post('/on_subscribe', function (req, res) {
//     const { challenge } = req.body; // Extract the 'challenge' property from the request body
//     const answer = decryptAES256ECB(sharedKey, challenge); // Decrypt the challenge using AES-256-ECB
//     const resp = { answer: answer };
//     res.status(200).json(resp); // Send a JSON response with the answer
// });

// // Route for serving a verification file
// app.get('/ondc-site-verification.html', async (req, res) => {
//     const signedContent = await signMessage(REQUEST_ID, SIGNING_PRIVATE_KEY);

//     const htmlFile = `
//   <html>
//     <head>
//       <meta name="ondc-site-verification" content="${signedContent}" />
//     </head>
//     <body>ONDC Site Verification Page</body>
//   </html>`;

//     res.setHeader("Content-Type", "text/html");
//     res.send(htmlFile);
// });

// // Default route
// app.get('/', (req, res) => res.send('Hello World!'));

// // Health check route
// app.get('/health', (req, res) => res.send('Health OK!!'));

// app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// // Decrypt using AES-256-ECB
// function decryptAES256ECB(key, encrypted) {
//     const iv = Buffer.alloc(0); // ECB doesn't use IV
//     const decipher = crypto.createDecipheriv('aes-256-ecb', key, iv);
//     let decrypted = decipher.update(encrypted, 'base64', 'utf8');
//     decrypted += decipher.final('utf8');
//     return decrypted;
// }

// async function signMessage(signingString, privateKey) {
//     await _sodium.ready;
//     const sodium = _sodium;
//     const signedMessage = sodium.crypto_sign_detached(
//         signingString,
//         sodium.from_base64(privateKey, _sodium.base64_variants.ORIGINAL)
//     );
//     const signature = sodium.to_base64(
//         signedMessage,
//         _sodium.base64_variants.ORIGINAL
//     );
//     return signature;
// }

// const express = require('express');
// const bodyParser = require('body-parser');
// const crypto = require('crypto');
// const _sodium = require('libsodium-wrappers');
// const cors = require('cors');
// const config = require('./config/config');
// const cryptoUtils = require('./utils/crypto');
// const ondcRoutes = require('./routes/ondc');

// const app = express();

// // Middleware
// app.use(bodyParser.json());
// app.use(cors());

// // Request logging middleware
// app.use((req, res, next) => {
//     console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//     next();
// });

// // ===== REGISTRY SUBSCRIPTION ROUTES (From your existing code) =====

// // Calculate shared key for subscription
// const privateKey = crypto.createPrivateKey({
//     key: Buffer.from(config.ondc.encryptionPrivateKey, 'base64'),
//     format: 'der',
//     type: 'pkcs8',
// });

// const publicKey = crypto.createPublicKey({
//     key: Buffer.from(config.ondc.ondcPublicKey, 'base64'),
//     format: 'der',
//     type: 'spki',
// });

// const sharedKey = crypto.diffieHellman({
//     privateKey: privateKey,
//     publicKey: publicKey,
// });

// // Subscription endpoint
// app.post('/on_subscribe', function (req, res) {
//     try {
//         const { challenge } = req.body;
//         const answer = cryptoUtils.decryptAES256ECB(sharedKey, challenge);
//         res.status(200).json({ answer: answer });
//     } catch (error) {
//         console.error('Subscription error:', error);
//         res.status(500).json({ error: 'Subscription failed' });
//     }
// });

// // Site verification endpoint
// app.get('/ondc-site-verification.html', async (req, res) => {
//     try {
//         const signedContent = await cryptoUtils.signMessage(
//             config.ondc.requestId,
//             config.ondc.signingPrivateKey
//         );

//         const htmlFile = `
//         <html>
//             <head>
//                 <meta name="ondc-site-verification" content="${signedContent}" />
//             </head>
//             <body>ONDC Site Verification Page</body>
//         </html>`;

//         res.setHeader("Content-Type", "text/html");
//         res.send(htmlFile);
//     } catch (error) {
//         console.error('Verification page error:', error);
//         res.status(500).send('Error generating verification page');
//     }
// });

// // ===== ONDC API ROUTES =====
// app.use('/ondc', ondcRoutes);

// // ===== BASIC ROUTES =====
// app.get('/', (req, res) => {
//     res.json({
//         message: 'ONDC Integration Server',
//         version: config.ondc.coreVersion,
//         subscriber_id: config.ondc.subscriberId,
//         endpoints: {
//             subscription: '/on_subscribe',
//             verification: '/ondc-site-verification.html',
//             ondc_apis: '/ondc/*'
//         }
//     });
// });

// app.get('/health', (req, res) => {
//     res.json({
//         status: 'healthy',
//         timestamp: new Date().toISOString(),
//         uptime: process.uptime()
//     });
// });

// // Error handling middleware
// app.use((error, req, res, next) => {
//     console.error('Unhandled error:', error);
//     res.status(500).json({
//         error: 'Internal server error',
//         message: error.message
//     });
// });

// // 404 handler
// app.use((req, res) => {
//     res.status(404).json({
//         error: 'Not found',
//         path: req.path
//     });
// });

// // Start server
// const PORT = config.server.port;
// app.listen(PORT, async () => {
//     // Initialize crypto utilities
//     await cryptoUtils.initialize();
//     console.log(`===========================================`);
//     console.log(`ONDC Integration Server`);
//     console.log(`===========================================`);
//     console.log(`Environment: ${config.server.env}`);
//     console.log(`Port: ${PORT}`);
//     console.log(`Subscriber ID: ${config.ondc.subscriberId}`);
//     console.log(`Subscriber URL: ${config.ondc.subscriberUrl}`);
//     console.log(`Domain: ${config.ondc.domain}`);
//     console.log(`===========================================`);
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

// module.exports = app;

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config/config');
const cryptoUtils = require('./utils/crypto');
const ondcRoutes = require('./routes/ondc');
const db = require('./config/db');

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

app.use('/ondc', ondcRoutes);

app.get('/', (req, res) => res.json({
    message: 'ONDC Buyer App API',
    environment: config.server.env,
    subscriber_id: config.ondc.subscriberId,
}));

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

const PORT = config.server.port;
app.listen(PORT, async () => {
    await cryptoUtils.initialize();
    await db.connect();
    console.log(`✅ Buyer App running at http://localhost:${PORT}`);
});

module.exports = app;
