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

(async function setup() {
    await app.whenReady();

    if (app.isPackaged) {
        const configPath = getConfigPath();
        console.log('isPackaged:', app.isPackaged);
        if (!fs.existsSync(configPath)) {
            app.setLoginItemSettings({
                openAtLogin: true,
            });
        }
    }

    const config = new Config();
    await config.init();

    const trayController = new TrayController(config);
    trayController.init();

    const switcher = new Switcher(config);
    switcher.init();
})();

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
