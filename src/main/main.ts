import { app } from 'electron';
import fs from 'fs';

import { TrayController } from './Tray/TrayController';
import { Switcher } from './Switcher/Switcher';
import { logger } from './logger';
import { getConfigPath } from './paths';

export type Link = {
    title: string;
    url: string;
    faviconUrl: string;
};

process.on('uncaughtException', (err: Error) => {
    logger.error('uncaughtException', err);
});

process.on('unhandledRejection', (reason: unknown) => {
    logger.error('unhandledRejection', reason);
});

function readConfig() {
    const configPath = getConfigPath();

    if (!fs.existsSync(configPath)) {
        fs.closeSync(fs.openSync(configPath, 'w'));
    }
    const config =
        (JSON.parse(
            fs.readFileSync(configPath).toString() || '[]'
        ) as Link[]) || [];

    const needMigration = doMigrations(config);
    if (needMigration) {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }

    return config;
}

app.whenReady().then(() => {
    const config = readConfig();

    const trayController = new TrayController();
    trayController.init();

    const switcher = new Switcher(trayController, config);
    switcher.init();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

function doMigrations(config: Link[]): boolean {
    return addFaviconUrls(config);
}

function addFaviconUrls(config: Link[]): boolean {
    let needMigration = false;
    for (const link of config) {
        if (!link.faviconUrl) {
            needMigration = true;
            const url = new URL(link.url);
            const faviconUrl = url.origin + '/favicon.ico';
            link.faviconUrl = faviconUrl;
        }
    }

    return needMigration;
}
