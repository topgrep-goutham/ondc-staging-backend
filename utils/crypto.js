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
    }

    ensureInitialized() {
        if (!this.initialized || !this.sodium) {
            throw new Error('CryptoUtils not initialized. Call await cryptoUtils.initialize() first.');
        }
    }

    decryptAES256ECB(key, encryptedBase64) {
        const keyBuf = Buffer.isBuffer(key) ? key : Buffer.from(key);
        const iv = null; 
        const decipher = crypto.createDecipheriv('aes-256-ecb', keyBuf, iv);
        decipher.setAutoPadding(true);
        let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    encryptAES256ECB(key, plaintext) {
        const keyBuf = Buffer.isBuffer(key) ? key : Buffer.from(key);
        const iv = null;
        const cipher = crypto.createCipheriv('aes-256-ecb', keyBuf, iv);
        cipher.setAutoPadding(true);
        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    }

    async signMessage(message, privateKeyBase64) {
        this.ensureInitialized();
        try {
            const messageBytes = (typeof message === 'string')
                ? new TextEncoder().encode(message)
                : message;

            const privateKeyBytes = this.sodium.from_base64(
                privateKeyBase64.trim(),
                _sodium.base64_variants.ORIGINAL
            );

            if (privateKeyBytes.length !== 64) {
                throw new Error(`Invalid Ed25519 private key length: ${privateKeyBytes.length} (expected 64)`);
            }

            const signature = this.sodium.crypto_sign_detached(messageBytes, privateKeyBytes);

            return this.sodium.to_base64(signature, _sodium.base64_variants.ORIGINAL);
        } catch (error) {
            console.error('Message signing error:', error);
            throw error;
        }
    }

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

    generateTransactionId() {
        return `txn-${Date.now()}-${crypto.randomUUID()}`;
    }

    generateMessageId() {
        return `msg-${Date.now()}-${crypto.randomUUID()}`;
    }
}

module.exports = new CryptoUtils();
