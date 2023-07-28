import path from 'path';
import { app } from 'electron';

export function getResourcePath(): string {
    return app.isPackaged
        ? process.resourcesPath
        : path.join(process.cwd(), 'assets');
}

export function getTrayIconPath(): string {
    console.log('platform:', process.platform);

    switch (process.platform) {
        case 'darwin':
            if (app.isPackaged) {
                return path.join(getResourcePath(), 'TrayIcon.png');
            } else {
                return path.join(getResourcePath(), 'mac', 'TrayIcon.png');
            }
    }

    return process.platform;
}
