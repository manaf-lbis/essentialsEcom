const rateLimit = require('express-rate-limit');

// General limiter for general API routes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: "Too many requests from this IP, please try again after 15 minutes."
});

// Stricter limiter for sensitive auth routes (login, signup, OTP)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many login/signup attempts from this IP, please try again after 15 minutes."
});

// OTP limiter (very strict)
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, // Limit each IP to 3 OTP requests
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many OTP requests. Please wait before trying again."
});

module.exports = {
    generalLimiter,
    authLimiter,
    otpLimiter
};
