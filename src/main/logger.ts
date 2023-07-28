import { app } from 'electron';
import winston from 'winston';

const configPath = app.getPath('userData');
const consoleTransport = new winston.transports.File({
    dirname: configPath,
    filename: 'console.log',
});
const myWinstonOptions = {
    transports: [consoleTransport],
};

export const logger = winston.createLogger(myWinstonOptions);
