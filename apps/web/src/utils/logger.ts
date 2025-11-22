/**
 * Logger utility for consistent logging across the application
 * Automatically disables debug/info logs in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
    enableDebug?: boolean;
    enableInfo?: boolean;
    prefix?: string;
}

class Logger {
    private config: LoggerConfig;

    constructor(config: LoggerConfig = {}) {
        this.config = {
            enableDebug: import.meta.env.DEV,
            enableInfo: import.meta.env.DEV,
            prefix: '[App]',
            ...config,
        };
    }

    /**
     * Debug level logging - only in development mode
     */
    debug(...args: any[]): void {
        if (this.config.enableDebug) {
            console.debug(this.config.prefix, ...args);
        }
    }

    /**
     * Info level logging - only in development mode by default
     */
    info(...args: any[]): void {
        if (this.config.enableInfo) {
            console.info(this.config.prefix, ...args);
        }
    }

    /**
     * Warning level logging - always enabled
     */
    warn(...args: any[]): void {
        console.warn(this.config.prefix, ...args);
    }

    /**
     * Error level logging - always enabled
     */
    error(...args: any[]): void {
        console.error(this.config.prefix, ...args);
    }

    /**
     * Group logging for better organization
     */
    group(label: string, level: LogLevel = 'info'): void {
        if (level === 'debug' && !this.config.enableDebug) return;
        if (level === 'info' && !this.config.enableInfo) return;
        console.group(this.config.prefix, label);
    }

    groupEnd(): void {
        console.groupEnd();
    }

    /**
     * Table logging for structured data
     */
    table(data: any): void {
        if (this.config.enableDebug || this.config.enableInfo) {
            console.table(data);
        }
    }

    /**
     * Time measurement
     */
    time(label: string): void {
        if (this.config.enableDebug) {
            console.time(`${this.config.prefix} ${label}`);
        }
    }

    timeEnd(label: string): void {
        if (this.config.enableDebug) {
            console.timeEnd(`${this.config.prefix} ${label}`);
        }
    }
}

// Default logger instance
const logger = new Logger();

// Create specialized loggers for different modules
export const createLogger = (prefix: string, config?: LoggerConfig) => {
    return new Logger({ ...config, prefix: `[${prefix}]` });
};

export default logger;
