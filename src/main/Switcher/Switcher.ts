import { BrowserWindow, globalShortcut, ipcMain, shell, app } from 'electron';

import { logger } from '../logger';
import { Config } from '../Config';

declare const APP_WINDOW_WEBPACK_ENTRY: string;
declare const APP_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export class Switcher {
    private switcherWindow: BrowserWindow | null;

    width = 200;
    height = 300;

    constructor(private config: Config) {
        this.switcherWindow = null;
    }

    init(): void {
        this.config.addUpdateListener(() => {
            this.switcherWindow?.webContents.send('links', this.config.links);
        });

        let registered;
        try {
            registered = globalShortcut.register(
                'CommandOrControl+Shift+J',
                () => {
                    if (
                        !this.switcherWindow ||
                        !this.switcherWindow.isVisible() ||
                        !this.switcherWindow.isFocused()
                    ) {
                        this.showSwitcher();
                    } else {
                        this.hideSwitcher();
                    }
                }
            );
        } catch (e) {
            logger.error('Error while registering global shortcut:', e);
        }

        if (!registered) {
            logger.info('Failed to register global shortcut');
        } else {
            logger.info('Registered global shortcut');
        }
    }

    showSwitcher(): void {
        if (!this.switcherWindow) {
            this.switcherWindow = this.createWindow();
        }

        this.switcherWindow.show();
        this.switcherWindow.webContents.send('onShown');
    }

    createWindow(): BrowserWindow {
        this.switcherWindow = new BrowserWindow({
            width: 430,
            minWidth: 430,
            skipTaskbar: true,
            webPreferences: {
                preload: APP_WINDOW_PRELOAD_WEBPACK_ENTRY,
                nodeIntegration: false,
                contextIsolation: true,
            },
            frame: false,
            transparent: true,
            alwaysOnTop: true,
        });

        this.switcherWindow.setVisibleOnAllWorkspaces(true, {
            visibleOnFullScreen: true,
        });

        const links = this.config.links;

        ipcMain.on('ready', () => {
            this.switcherWindow?.webContents.send('links', links);
        });

        ipcMain.on('link-clicked', (event, link) => {
            shell.openExternal(link);
            this.switcherWindow?.hide();
        });

        ipcMain.on('delete-link', (event, link) => {
            console.log('deleting link:', link);
            this.config.deleteLink(link);
        });

        ipcMain.on('size-changed', (event, size) => {
            this.switcherWindow?.setSize(
                Math.floor(size.width),
                Math.floor(size.height)
            );
        });

        ipcMain.on('escape-clicked', () => {
            this.switcherWindow?.hide();
        });

        this.switcherWindow.loadURL(APP_WINDOW_WEBPACK_ENTRY);

        this.switcherWindow.webContents.send('links', links);

        if (!app.isPackaged) {
            this.switcherWindow.webContents.openDevTools();
        }

        return this.switcherWindow;
    }

    hideSwitcher(): void {
        this.switcherWindow?.hide();
    }
}
