const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
require('dotenv').config();

const client = jwksClient({
    jwksUri: 'https://www.googleapis.com/oauth2/v3/certs'
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            console.error("Error fetching signing key:", err);
            return callback(err);
        }
        console.log("Signing Key Retrieved:", key);
        const signingKey = key.publicKey || key.rsaPublicKey;
        console.log("Using Signing Key:", signingKey);
        callback(null, signingKey);
    });
}


const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log("Extracted Token:", token); // Log the token
    
    const parts = token.split('.');
    if (parts.length !== 3) {
        console.error("Invalid Token Structure. Expected 3 parts (header.payload.signature), but got:", parts.length);
        return res.status(400).json({ error: "Invalid Token Format" });
    }

    jwt.verify(token, getKey, { algorithms: ['RS256'], issuer: 'https://accounts.google.com' }, (err, decoded) => {
        if (err) {
            console.error("Token verification failed:", err);
            return res.status(403).json({ error: "Invalid Token" });
        }
        console.log("Token is valid:", decoded);
        req.user = decoded;
        next();
    });
};

module.exports = verifyToken;
