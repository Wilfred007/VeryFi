"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston = __importStar(require("winston"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class Logger {
    constructor(context = 'App') {
        this.context = context;
        this.logger = this.createLogger();
    }
    createLogger() {
        const agentId = process.env.AGENT_ID || 'default';
        const logLevel = process.env.LOG_LEVEL || 'info';
        // Create logs directory if it doesn't exist
        const logsDir = path.join(process.cwd(), 'storage', 'logs', agentId);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        const logFormat = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json(), winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            return JSON.stringify({
                timestamp,
                level,
                context: context || this.context,
                message,
                ...meta
            });
        }));
        return winston.createLogger({
            level: logLevel,
            format: logFormat,
            transports: [
                // Console transport for development
                new winston.transports.Console({
                    format: winston.format.combine(winston.format.colorize(), winston.format.simple(), winston.format.printf(({ timestamp, level, message, context }) => {
                        return `${timestamp} [${context || this.context}] ${level}: ${message}`;
                    }))
                }),
                // File transport for persistent logging
                new winston.transports.File({
                    filename: path.join(logsDir, 'wallet-app.log'),
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 5
                }),
                // Error-only file transport
                new winston.transports.File({
                    filename: path.join(logsDir, 'error.log'),
                    level: 'error',
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 3
                })
            ]
        });
    }
    info(message, meta) {
        this.logger.info(message, { context: this.context, ...meta });
    }
    error(message, meta) {
        this.logger.error(message, { context: this.context, ...meta });
    }
    warn(message, meta) {
        this.logger.warn(message, { context: this.context, ...meta });
    }
    debug(message, meta) {
        this.logger.debug(message, { context: this.context, ...meta });
    }
    verbose(message, meta) {
        this.logger.verbose(message, { context: this.context, ...meta });
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map