import path from 'path';
import { app } from 'electron';

function getResourcePath(): string {
    return app.isPackaged
        ? process.resourcesPath
        : path.join(process.cwd(), 'assets');
}

function getPlatformPath(platformPath: string, fileName: string): string {
    if (app.isPackaged) {
        return path.join(getResourcePath(), fileName);
    } else {
        return path.join(getResourcePath(), platformPath, fileName);
    }
}

export function getTrayIconPath(): string {
    switch (process.platform) {
        case 'darwin':
            return getPlatformPath('mac', 'TrayIcon.png');
        case 'win32': {
            return getPlatformPath('win', 'TrayIcon.ico');
        }
    }

    return process.platform;
}

export function getConfigPath(): string {
    return app.getPath('userData') + '/config.json';
}

export function getPendingChangesPath(): string {
    return app.getPath('userData') + '/pendingChanges.json';
}

export function getGoogleChromeBookmarksPath(): string {
    switch (process.platform) {
        case 'darwin': {
            return (
                app.getPath('home') +
                '/Library/Application Support/Google/Chrome/Default/Bookmarks'
            );
        }
        case 'win32': {
            return path.join(
                app.getPath('appData'),
                '..',
                'Local',
                'Google',
                'Chrome',
                'User Data',
                'Default',
                'Bookmarks'
            );
        }
        default: {
            return '';
        }
    }
}
