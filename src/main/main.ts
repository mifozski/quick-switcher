import { app } from 'electron';
import fs from 'fs';

import { TrayController } from './Tray/TrayController';
import { Switcher } from './Switcher/Switcher';
import { logger } from './logger';
import { getConfigPath } from './paths';
import { Config } from './Config';

process.on('uncaughtException', (err: Error) => {
    logger.error('uncaughtException', err);
});

process.on('unhandledRejection', (reason: unknown) => {
    logger.error('unhandledRejection', reason);
});

app.whenReady().then(() => {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
        app.setLoginItemSettings({
            openAtLogin: true,
        });
    }

    const config = new Config();
    config.init();

    const trayController = new TrayController(config);
    trayController.init();

    const switcher = new Switcher(trayController, config);
    switcher.init();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
