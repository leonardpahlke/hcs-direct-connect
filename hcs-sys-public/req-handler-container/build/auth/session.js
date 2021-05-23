"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExpirationStatus = exports.decodeSession = exports.encodeSession = void 0;
const jwt_simple_1 = require("jwt-simple");
// used algorithm to encode and decode the JWT token
const encodeAlgorithm = "HS512";
// set how many minutes a token is valid
const tokenExpireMinutes = 15;
function encodeSession(secretKey, partialSession) {
    const algorithm = encodeAlgorithm;
    const issued = Date.now();
    const expireMinutesInMs = tokenExpireMinutes * 60 * 1000;
    const expires = issued + expireMinutesInMs;
    const session = Object.assign(Object.assign({}, partialSession), { issued: issued, expires: expires });
    return {
        token: jwt_simple_1.encode(session, secretKey, algorithm),
        issued: issued,
        expires: expires,
    };
}
exports.encodeSession = encodeSession;
function decodeSession(secretKey, tokenString) {
    const algorithm = encodeAlgorithm;
    let result;
    try {
        result = jwt_simple_1.decode(tokenString, secretKey, false, algorithm);
    }
    catch (_e) {
        const e = _e;
        // These error strings can be found here:
        // https://github.com/hokaccha/node-jwt-simple/blob/c58bfe5e5bb049015fcd55be5fc1b2d5c652dbcd/lib/jwt.js
        if (e.message === "No token supplied" ||
            e.message === "Not enough or too many segments") {
            return {
                type: "invalid-token",
            };
        }
        if (e.message === "Signature verification failed" ||
            e.message === "Algorithm not supported") {
            return {
                type: "integrity-error",
            };
        }
        // Handle json parse errors, thrown when the payload is nonsense
        if (e.message.indexOf("Unexpected token") === 0) {
            return {
                type: "invalid-token",
            };
        }
        throw e;
    }
    return {
        type: "valid",
        session: result,
    };
}
exports.decodeSession = decodeSession;
function checkExpirationStatus(token) {
    const now = Date.now();
    if (token.expires > now)
        return "active";
    // Find the timestamp for the end of the token's grace period
    const threeHoursInMs = 3 * 60 * 60 * 1000;
    const threeHoursAfterExpiration = token.expires + threeHoursInMs;
    if (threeHoursAfterExpiration > now)
        return "grace";
    return "expired";
}
exports.checkExpirationStatus = checkExpirationStatus;
