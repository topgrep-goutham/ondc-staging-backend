// const crypto = require('crypto');
// const _sodium = require('libsodium-wrappers');

// class CryptoUtils {
//     constructor() {
//         this.sodium = null;
//         this.initialized = false;
//     }

//     async initialize() {
//         if (this.initialized) return;

//         await _sodium.ready;
//         this.sodium = _sodium;
//         this.initialized = true;
//         console.log('✓ Crypto utilities initialized');
//     }

//     // Ensure initialization before using sodium
//     ensureInitialized() {
//         if (!this.initialized || !this.sodium) {
//             throw new Error('CryptoUtils not initialized. Call await cryptoUtils.initialize() first.');
//         }
//     }

//     // Decrypt using AES-256-ECB
//     decryptAES256ECB(key, encrypted) {
//         const iv = Buffer.alloc(0);
//         const decipher = crypto.createDecipheriv('aes-256-ecb', key, iv);
//         let decrypted = decipher.update(encrypted, 'base64', 'utf8');
//         decrypted += decipher.final('utf8');
//         return decrypted;
//     }

//     // Encrypt using AES-256-ECB
//     encryptAES256ECB(key, plaintext) {
//         const iv = Buffer.alloc(0);
//         const cipher = crypto.createCipheriv('aes-256-ecb', key, iv);
//         let encrypted = cipher.update(plaintext, 'utf8', 'base64');
//         encrypted += cipher.final('base64');
//         return encrypted;
//     }

//     // Generate Blake2b hash using libsodium (64 bytes = 512 bits)
//     generateBlake2bHash(data) {
//         this.ensureInitialized();

//         try {
//             // Convert string to Uint8Array
//             const dataBuffer = typeof data === 'string'
//                 ? new TextEncoder().encode(data)
//                 : data;

//             // Generate Blake2b hash (64 bytes)
//             const hash = this.sodium.crypto_generichash(64, dataBuffer);

//             // Convert to base64
//             return this.sodium.to_base64(hash, _sodium.base64_variants.ORIGINAL);
//         } catch (error) {
//             console.error('Blake2b hash generation error:', error);
//             throw error;
//         }
//     }

//     // Sign message using Ed25519
//     async signMessage(message, privateKey) {
//         this.ensureInitialized();

//         try {
//             // Convert message to Uint8Array if it's a string
//             const messageBuffer = typeof message === 'string'
//                 ? new TextEncoder().encode(message)
//                 : message;

//             // Decode private key from base64
//             const privateKeyBuffer = this.sodium.from_base64(
//                 privateKey,
//                 _sodium.base64_variants.ORIGINAL
//             );

//             // Sign the message
//             const signedMessage = this.sodium.crypto_sign_detached(
//                 messageBuffer,
//                 privateKeyBuffer
//             );

//             // Return signature as base64
//             return this.sodium.to_base64(
//                 signedMessage,
//                 _sodium.base64_variants.ORIGINAL
//             );
//         } catch (error) {
//             console.error('Message signing error:', error);
//             throw error;
//         }
//     }

//     // // Verify signature using Ed25519
//     // async verifySignature(message, signature, publicKey) {
//     //     this.ensureInitialized();

//     //     try {
//     //         // Convert message to Uint8Array if it's a string
//     //         const messageBuffer = typeof message === 'string'
//     //             ? new TextEncoder().encode(message)
//     //             : message;

//     //         // Decode signature from base64
//     //         const signatureBuffer = this.sodium.from_base64(
//     //             signature,
//     //             _sodium.base64_variants.ORIGINAL
//     //         );

//     //         // Handle different public key formats
//     //         let publicKeyBuffer = null;

//     //         try {
//     //             // Try to decode as base64 first (standard format)
//     //             publicKeyBuffer = this.sodium.from_base64(
//     //                 publicKey,
//     //                 _sodium.base64_variants.ORIGINAL
//     //             );
//     //         } catch (e) {
//     //             // If that fails, try as hex
//     //             try {
//     //                 publicKeyBuffer = this.sodium.from_hex(publicKey);
//     //             } catch (e2) {
//     //                 // If both fail, assume it's already a buffer
//     //                 publicKeyBuffer = publicKey;
//     //             }
//     //         }

//     //         // Check if public key has correct length (32 bytes for Ed25519)
//     //         if (publicKeyBuffer.length !== 32) {
//     //             console.error('Invalid public key length:', publicKeyBuffer.length, 'expected 32');

//     //             // If it's 64 bytes, it might be a seed + public key, take last 32
//     //             if (publicKeyBuffer.length === 64) {
//     //                 console.log('Extracting public key from 64-byte buffer (last 32 bytes)');
//     //                 publicKeyBuffer = publicKeyBuffer.slice(32);
//     //             } else if (publicKeyBuffer.length > 32) {
//     //                 console.log('Extracting public key from longer buffer (last 32 bytes)');
//     //                 publicKeyBuffer = publicKeyBuffer.slice(-32);
//     //             } else {
//     //                 throw new Error(`Invalid Ed25519 public key length: ${publicKeyBuffer.length}`);
//     //             }
//     //         }

//     //         // Verify signature
//     //         const isValid = this.sodium.crypto_sign_verify_detached(
//     //             signatureBuffer,
//     //             messageBuffer,
//     //             publicKeyBuffer
//     //         );

//     //         return isValid;
//     //     } catch (error) {
//     //         console.error('Signature verification failed:', error.message);
//     //         console.error('Public key format issue. Key length:', publicKey?.length);
//     //         return false;
//     //     }
//     // }

//     // Verify signature using Ed25519
//     async verifySignature(message, signature, publicKey) {
//         this.ensureInitialized();

//         try {
//             // Convert message to Uint8Array if it's a string
//             const messageBuffer = typeof message === 'string'
//                 ? new TextEncoder().encode(message)
//                 : message;

//             // Decode signature from base64
//             const signatureBuffer = this.sodium.from_base64(
//                 signature,
//                 _sodium.base64_variants.ORIGINAL
//             );

//             // 🔹 Decode the public key (always base64 in ONDC registry)
//             let publicKeyBuffer = null;

//             try {
//                 publicKeyBuffer = this.sodium.from_base64(
//                     publicKey.trim(),
//                     _sodium.base64_variants.ORIGINAL
//                 );
//             } catch (e) {
//                 console.error('Failed to decode public key as base64:', e.message);
//                 throw new Error('Invalid ONDC public key format');
//             }

//             // 🔹 Validate public key length (Ed25519 => 32 bytes)
//             if (publicKeyBuffer.length !== 32) {
//                 console.error('❌ Invalid Ed25519 public key length:', publicKeyBuffer.length);
//                 throw new Error(`Invalid Ed25519 public key length: ${publicKeyBuffer.length} (expected 32)`);
//             }

//             // 🔹 Verify signature
//             const isValid = this.sodium.crypto_sign_verify_detached(
//                 signatureBuffer,
//                 messageBuffer,
//                 publicKeyBuffer
//             );

//             return isValid;
//         } catch (error) {
//             console.error('Signature verification failed:', error.message);
//             return false;
//         }
//     }

//     // Calculate shared key using Diffie-Hellman
//     calculateSharedKey(privateKeyBase64, publicKeyBase64) {
//         try {
//             const privateKey = crypto.createPrivateKey({
//                 key: Buffer.from(privateKeyBase64, 'base64'),
//                 format: 'der',
//                 type: 'pkcs8',
//             });

//             const publicKey = crypto.createPublicKey({
//                 key: Buffer.from(publicKeyBase64, 'base64'),
//                 format: 'der',
//                 type: 'spki',
//             });

//             return crypto.diffieHellman({
//                 privateKey: privateKey,
//                 publicKey: publicKey,
//             });
//         } catch (error) {
//             console.error('Shared key calculation error:', error);
//             throw error;
//         }
//     }

//     // Generate random transaction ID
//     generateTransactionId() {
//         return `txn-${Date.now()}-${crypto.randomUUID()}`;
//     }

//     // Generate random message ID
//     generateMessageId() {
//         return `msg-${Date.now()}-${crypto.randomUUID()}`;
//     }

//     // Generate key pairs (for initial setup)
//     async generateKeyPairs() {
//         this.ensureInitialized();

//         // Generate signing key pair (Ed25519)
//         const signingKeyPair = this.sodium.crypto_sign_keypair();

//         // Generate encryption key pair (X25519)
//         const encryptionKeyPair = this.sodium.crypto_box_keypair();

//         return {
//             signing: {
//                 privateKey: this.sodium.to_base64(
//                     signingKeyPair.privateKey,
//                     _sodium.base64_variants.ORIGINAL
//                 ),
//                 publicKey: this.sodium.to_base64(
//                     signingKeyPair.publicKey,
//                     _sodium.base64_variants.ORIGINAL
//                 )
//             },
//             encryption: {
//                 privateKey: this.sodium.to_base64(
//                     encryptionKeyPair.privateKey,
//                     _sodium.base64_variants.ORIGINAL
//                 ),
//                 publicKey: this.sodium.to_base64(
//                     encryptionKeyPair.publicKey,
//                     _sodium.base64_variants.ORIGINAL
//                 )
//             }
//         };
//     }
// }

// // Export as singleton
// module.exports = new CryptoUtils();

const crypto = require('crypto');
const _sodium = require('libsodium-wrappers');

class CryptoUtils {
    constructor() {
        this.sodium = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        await _sodium.ready;
        this.sodium = _sodium;
        this.initialized = true;
        console.log('✓ Crypto utilities initialized');
    }

    // Ensure initialization before using sodium
    ensureInitialized() {
        if (!this.initialized || !this.sodium) {
            throw new Error('CryptoUtils not initialized. Call await cryptoUtils.initialize() first.');
        }
    }

    // Decrypt using AES-256-ECB (key should be Buffer/Uint8Array length 32)
    decryptAES256ECB(key, encryptedBase64) {
        // key may be Buffer or Uint8Array; convert to Buffer
        const keyBuf = Buffer.isBuffer(key) ? key : Buffer.from(key);
        const iv = null; // ECB doesn't use IV
        const decipher = crypto.createDecipheriv('aes-256-ecb', keyBuf, iv);
        decipher.setAutoPadding(true);
        let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    // Encrypt using AES-256-ECB
    encryptAES256ECB(key, plaintext) {
        const keyBuf = Buffer.isBuffer(key) ? key : Buffer.from(key);
        const iv = null;
        const cipher = crypto.createCipheriv('aes-256-ecb', keyBuf, iv);
        cipher.setAutoPadding(true);
        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    }

    // Generate Blake2b hash using libsodium (64 bytes = 512 bits) -> returns base64
    generateBlake2bHash(data) {
        this.ensureInitialized();
        try {
            // We must pass Uint8Array to sodium
            const dataBytes = (typeof data === 'string')
                ? new TextEncoder().encode(data)
                : (data instanceof Uint8Array ? data : new TextEncoder().encode(JSON.stringify(data)));

            // Generate Blake2b hash (64 bytes)
            const hash = this.sodium.crypto_generichash(64, dataBytes);

            // Convert to base64
            return this.sodium.to_base64(hash, _sodium.base64_variants.ORIGINAL);
        } catch (error) {
            console.error('Blake2b hash generation error:', error);
            throw error;
        }
    }

    // Sign message using Ed25519
    async signMessage(message, privateKeyBase64) {
        this.ensureInitialized();
        try {
            const messageBytes = (typeof message === 'string')
                ? new TextEncoder().encode(message)
                : message;

            // privateKeyBase64 should be the 64-byte ed25519 secret key encoded in base64
            const privateKeyBytes = this.sodium.from_base64(
                privateKeyBase64.trim(),
                _sodium.base64_variants.ORIGINAL
            );

            // libsodium expects a 64-byte secret key for crypto_sign_detached
            if (privateKeyBytes.length !== 64) {
                // helpful error for debugging key formats
                throw new Error(`Invalid Ed25519 private key length: ${privateKeyBytes.length} (expected 64)`);
            }

            const signature = this.sodium.crypto_sign_detached(messageBytes, privateKeyBytes);

            return this.sodium.to_base64(signature, _sodium.base64_variants.ORIGINAL);
        } catch (error) {
            console.error('Message signing error:', error);
            throw error;
        }
    }

    // Verify signature using Ed25519
    async verifySignature(message, signatureBase64, publicKeyBase64) {
        this.ensureInitialized();
        try {
            const messageBytes = (typeof message === 'string')
                ? new TextEncoder().encode(message)
                : message;

            const signatureBytes = this.sodium.from_base64(
                signatureBase64.trim(),
                _sodium.base64_variants.ORIGINAL
            );

            // Decode public key (ONDC registry usually stores base64)
            const publicKeyBytes = this.sodium.from_base64(
                publicKeyBase64.trim(),
                _sodium.base64_variants.ORIGINAL
            );

            if (publicKeyBytes.length !== 32) {
                throw new Error(`Invalid Ed25519 public key length: ${publicKeyBytes.length} (expected 32)`);
            }

            const valid = this.sodium.crypto_sign_verify_detached(signatureBytes, messageBytes, publicKeyBytes);
            return !!valid;
        } catch (error) {
            console.error('Signature verification failed:', error && error.message ? error.message : error);
            return false;
        }
    }

    /**
     * Create ONDC Authorization header for outgoing requests.
     *
     * Expected usage (matches ondcService earlier):
     * await cryptoUtils.createAuthorizationHeader(payload, signingPrivateKeyBase64, subscriberId, ukId, created, expires)
     *
     * - payload: object or string. We'll stringify if it's an object.
     * - privateKey: base64 encoded 64-byte Ed25519 private key
     * - subscriberId, ukId: strings
     * - created, expires: unix seconds (integers)
     *
     * Returns: full Signature header string.
     */
    async createAuthorizationHeader(payload, privateKeyBase64, subscriberId, ukId, created, expires) {
        this.ensureInitialized();

        try {
            // ensure created/expires provided
            const createdTs = created || Math.floor(Date.now() / 1000);
            const expiresTs = expires || (createdTs + 3600);

            // Build canonical body string for digest
            const bodyString = (typeof payload === 'string') ? payload : JSON.stringify(payload);

            // Compute BLAKE-512 digest in base64
            const digestBase64 = this.generateBlake2bHash(bodyString);

            // Build signing string exactly as ONDC requires
            const signingString = `(created): ${createdTs}\n(expires): ${expiresTs}\ndigest: BLAKE-512=${digestBase64}`;

            // Sign it using Ed25519 private key (base64)
            const signatureBase64 = await this.signMessage(signingString, privateKeyBase64);

            // Construct header
            const header = [
                `Signature keyId="${subscriberId}|${ukId}|ed25519"`,
                `algorithm="ed25519"`,
                `created="${createdTs}"`,
                `expires="${expiresTs}"`,
                `headers="(created) (expires) digest"`,
                `signature="${signatureBase64}"`
            ].join(',');

            return header;
        } catch (error) {
            console.error('createAuthorizationHeader error:', error);
            throw error;
        }
    }

    /**
     * Verify an Authorization header from incoming requests.
     * - authHeader: full header string (e.g. req.headers.authorization)
     * - requestBody: the raw string body used to compute digest (important: use raw body)
     * - publicKeyBase64: sender's Ed25519 public key (base64)
     *
     * Returns boolean.
     */
    async verifyAuthorizationHeader(authHeader, requestBody, publicKeyBase64) {
        this.ensureInitialized();
        try {
            if (!authHeader) throw new Error('Missing authorization header');

            // Remove "Signature " prefix if present
            const headerValue = authHeader.replace(/^Signature\s+/i, '');

            // Parse key="value" pairs robustly
            const regex = /(\w+)=["']?([^"',]+)["']?/g;
            let match;
            const params = {};
            while ((match = regex.exec(headerValue)) !== null) {
                params[match[1]] = match[2];
            }

            if (!params.signature || !params.keyId) {
                throw new Error('Missing signature or keyId in auth header');
            }

            const created = parseInt(params.created, 10);
            const expires = parseInt(params.expires, 10);
            const now = Math.floor(Date.now() / 1000);
            if (now < created || now > expires) {
                throw new Error('Request timestamp outside created/expires window');
            }

            // Recompute digest from the raw request body
            const bodyString = (typeof requestBody === 'string') ? requestBody : JSON.stringify(requestBody);
            const computedDigest = this.generateBlake2bHash(bodyString);

            // Build signing string same as when it was signed
            const signingString = `(created): ${created}\n(expires): ${expires}\ndigest: BLAKE-512=${computedDigest}`;

            // Verify signature
            const ok = await this.verifySignature(signingString, params.signature, publicKeyBase64);
            return ok;
        } catch (error) {
            console.error('verifyAuthorizationHeader error:', error && error.message ? error.message : error);
            return false;
        }
    }

    // Calculate shared key using Diffie-Hellman (Node crypto as before)
    calculateSharedKey(privateKeyBase64, publicKeyBase64) {
        try {
            const privateKey = crypto.createPrivateKey({
                key: Buffer.from(privateKeyBase64, 'base64'),
                format: 'der',
                type: 'pkcs8',
            });

            const publicKey = crypto.createPublicKey({
                key: Buffer.from(publicKeyBase64, 'base64'),
                format: 'der',
                type: 'spki',
            });

            return crypto.diffieHellman({
                privateKey: privateKey,
                publicKey: publicKey,
            });
        } catch (error) {
            console.error('Shared key calculation error:', error);
            throw error;
        }
    }

    // Generate random transaction ID
    generateTransactionId() {
        return `txn-${Date.now()}-${crypto.randomUUID()}`;
    }

    // Generate random message ID
    generateMessageId() {
        return `msg-${Date.now()}-${crypto.randomUUID()}`;
    }

    // Generate key pairs using libsodium (helper)
    async generateKeyPairs() {
        this.ensureInitialized();

        // Ed25519 signing key pair
        const signingKeyPair = this.sodium.crypto_sign_keypair();

        // X25519 encryption key pair for box (Note: crypto_box_keypair returns curve25519 keys)
        const encryptionKeyPair = this.sodium.crypto_box_keypair();

        return {
            signing: {
                privateKey: this.sodium.to_base64(signingKeyPair.privateKey, _sodium.base64_variants.ORIGINAL),
                publicKey: this.sodium.to_base64(signingKeyPair.publicKey, _sodium.base64_variants.ORIGINAL)
            },
            encryption: {
                privateKey: this.sodium.to_base64(encryptionKeyPair.privateKey, _sodium.base64_variants.ORIGINAL),
                publicKey: this.sodium.to_base64(encryptionKeyPair.publicKey, _sodium.base64_variants.ORIGINAL)
            }
        };
    }
}

// Export singleton
module.exports = new CryptoUtils();
