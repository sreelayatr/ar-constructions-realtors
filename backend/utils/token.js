const crypto = require('crypto');

function getSecret() {
    return process.env.SESSION_SECRET || process.env.JWT_SECRET || 'ar_constructions_realtors_default_secret_key';
}

/**
 * Generate a cryptographically signed authentication token
 * @param {Object} payload - Data to encode (userId, userEmail, userRole)
 * @param {number} expiresInMs - Token lifetime in ms (default 7 days)
 * @returns {string} - Signed token in JWT format
 */
function generateToken(payload, expiresInMs = 7 * 24 * 60 * 60 * 1000) {
    const secret = getSecret();
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const data = {
        ...payload,
        exp: Date.now() + expiresInMs
    };
    const body = Buffer.from(JSON.stringify(data)).toString('base64url');
    const signature = crypto.createHmac('sha256', secret)
        .update(`${header}.${body}`)
        .digest('base64url');
    return `${header}.${body}.${signature}`;
}

/**
 * Verify and decode an authentication token
 * @param {string} token - Signed token
 * @returns {Object|null} - Decoded payload or null if invalid/expired
 */
function verifyToken(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const secret = getSecret();
    const expectedSig = crypto.createHmac('sha256', secret)
        .update(`${header}.${body}`)
        .digest('base64url');

    try {
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expectedSig);
        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
            return null;
        }

        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (payload.exp && Date.now() > payload.exp) {
            return null; // Expired
        }
        return payload;
    } catch (err) {
        return null;
    }
}

module.exports = { generateToken, verifyToken };
