"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
// Standardized response structure
const sendResponse = (res, statusCode, success, message, payload = null) => {
    res.status(statusCode).json({
        success,
        message,
        payload,
    });
};
exports.sendResponse = sendResponse;
