const authManager = require('../utils/authorization');

// Middleware to verify incoming ONDC requests
async function verifyONDCRequest(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: {
                    ack: { status: 'NACK' }
                },
                error: {
                    type: 'AUTHORIZATION',
                    code: '401',
                    message: 'Missing authorization header'
                }
            });
        }

        // Verify the request
        const verification = await authManager.verifyAuthHeader(authHeader, req.body);
        console.log("verification", verification)

        if (!verification.valid) {
            return res.status(401).json({
                message: {
                    ack: { status: 'NACK' }
                },
                error: {
                    type: 'VERIFICATION_FAILED',
                    code: '401',
                    message: verification.error || 'Signature verification failed'
                }
            });
        }

        // Add verified data to request
        req.ondcVerified = verification;
        next();

    } catch (error) {
        console.error('Verification middleware error:', error);
        res.status(500).json({
            message: {
                ack: { status: 'NACK' }
            },
            error: {
                type: 'INTERNAL_ERROR',
                code: '500',
                message: 'Internal server error during verification'
            }
        });
    }
}

// Middleware to check for stale requests
function checkStaleRequest(req, res, next) {
    const { context } = req.body;

    if (!context || !context.timestamp) {
        return next();
    }

    const requestTime = new Date(context.timestamp);
    const now = new Date();
    const diffMinutes = (now - requestTime) / 1000 / 60;

    // Consider request stale if older than 5 minutes
    if (diffMinutes > 5) {
        return res.status(400).json({
            message: {
                ack: { status: 'NACK' }
            },
            error: {
                type: 'STALE_REQUEST',
                code: '30022',
                message: 'Request timestamp is too old'
            }
        });
    }

    next();
}

module.exports = {
    verifyONDCRequest,
    checkStaleRequest
};