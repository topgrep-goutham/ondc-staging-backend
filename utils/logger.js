const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getLogFileName() {
        const date = new Date().toISOString().split('T')[0];
        return path.join(this.logDir, `ondc-${date}.log`);
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        let logMessage = `[${timestamp}] [${level}] ${message}`;
        
        if (data) {
            logMessage += `\n${JSON.stringify(data, null, 2)}`;
        }
        
        return logMessage + '\n';
    }

    writeLog(level, message, data = null) {
        const formattedMessage = this.formatMessage(level, message, data);
        
        // Write to file
        fs.appendFileSync(this.getLogFileName(), formattedMessage);
    }

    info(message, data = null) {
        this.writeLog('INFO', message, data);
    }

    error(message, data = null) {
        this.writeLog('ERROR', message, data);
    }

    warn(message, data = null) {
        this.writeLog('WARN', message, data);
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            this.writeLog('DEBUG', message, data);
        }
    }

    // Log ONDC API calls
    logAPICall(action, direction, data) {
        this.info(`ONDC API: ${action} (${direction})`, {
            action,
            direction,
            transaction_id: data.context?.transaction_id,
            message_id: data.context?.message_id,
            timestamp: data.context?.timestamp
        });
    }
}

module.exports = new Logger();