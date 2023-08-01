import {
    BrowserWindow,
    globalShortcut,
    ipcMain,
    shell,
    screen,
    app,
} from 'electron';

import { TrayController } from 'src/main/Tray/TrayController';

import { logger } from '../logger';
import { Config } from '../Config';

declare const APP_WINDOW_WEBPACK_ENTRY: string;
declare const APP_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export class Switcher {
    private switcherWindow: BrowserWindow | null;

    width = 200;
    height = 300;

    constructor(
        private trayController: TrayController,
        private config: Config
    ) {
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

        // this.alignWindow();

        this.switcherWindow.show();
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

        ipcMain.on('size-changed', (event, size) => {
            this.switcherWindow?.setSize(
                Math.floor(size.width),
                Math.floor(size.height)
            );
            // this.alignWindow();
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

    alignWindow(): void {
        if (!this.switcherWindow) {
            return;
        }

        const position = this.calculateWindowPosition();
        const windowSize = this.switcherWindow?.getSize() || [0, 0];
        this.switcherWindow.setBounds({
            width: windowSize[0],
            height: windowSize[1],
            x: position.x,
            y: position.y,
        });
    }

    calculateWindowPosition(): { x: number; y: number } {
        const screenBounds = screen.getPrimaryDisplay().size;
        const trayBounds = this.trayController.tray.getBounds();
        let trayPos = 4;
        trayPos =
            trayBounds.y > screenBounds.height / 2 ? trayPos : trayPos / 2;
        trayPos = trayBounds.x > screenBounds.width / 2 ? trayPos : trayPos - 1;
        const margin_x = 0;
        const margin_y = 0;
        const DEFAULT_MARGIN = { x: margin_x, y: margin_y };
        let x = 0;
        let y = 0;
        switch (trayPos) {
            case 1:
                x = Math.floor(
                    trayBounds.x + DEFAULT_MARGIN.x + trayBounds.width / 2
                );
                y = Math.floor(
                    trayBounds.y + DEFAULT_MARGIN.y + trayBounds.height / 2
                );
                break;
            case 2:
                x = Math.floor(
                    trayBounds.x -
                        this.width -
                        DEFAULT_MARGIN.x +
                        trayBounds.width / 2
                );
                y = Math.floor(
                    trayBounds.y + DEFAULT_MARGIN.y + trayBounds.height / 2
                );
                break;
            case 3:
                x = Math.floor(
                    trayBounds.x + DEFAULT_MARGIN.x + trayBounds.width / 2
                );
                y = Math.floor(
                    trayBounds.y -
                        this.height -
                        DEFAULT_MARGIN.y +
                        trayBounds.height / 2
                );
                break;
            case 4:
                x = Math.floor(
                    trayBounds.x -
                        this.width -
                        DEFAULT_MARGIN.x +
                        trayBounds.width / 2
                );
                y = Math.floor(
                    trayBounds.y -
                        this.height -
                        DEFAULT_MARGIN.y +
                        trayBounds.height / 2
                );
                break;
        }
        return { x: x, y: y };
    }

    hideSwitcher(): void {
        this.switcherWindow?.hide();
    }
}
