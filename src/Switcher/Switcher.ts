import {
    BrowserWindow,
    globalShortcut,
    ipcMain,
    shell,
    screen,
} from 'electron';
import path from 'path';

import { TrayController } from 'src/Tray/TrayController';
import { ConfigSchema } from 'src/main';

import { logger } from '../logger';
import { getResourcePath } from '../paths';

export class Switcher {
    private switcherWindow: BrowserWindow | null;

    width = 200;
    height = 300;

    constructor(
        private trayController: TrayController,
        private config: ConfigSchema[]
    ) {
        this.switcherWindow = null;
    }

    init(): void {
        let registered;
        try {
            registered = globalShortcut.register(
                'CommandOrControl+Shift+J',
                () => {
                    logger.info('Triggering switcher');
                    if (
                        !this.switcherWindow ||
                        !this.switcherWindow.isVisible()
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

        logger.info('Showing switcher');

        this.alignWindow();

        this.switcherWindow.show();
    }

    createWindow(): BrowserWindow {
        this.switcherWindow = new BrowserWindow({
            width: 200,
            minWidth: 200,
            webPreferences: {
                preload: path.join(__dirname, '../preload.js'),
                nodeIntegration: true,
                contextIsolation: false,
            },
            frame: false,
            transparent: true,
        });

        logger.info('config:', this.config);

        const links = this.config.map((config) => {
            return {
                url: config.url,
                title: config.title,
            };
        });

        ipcMain.on('ready', () => {
            logger.info('Switcher ready');
            this.switcherWindow?.webContents.send('links', links);
        });

        ipcMain.on('link-clicked', (event, link) => {
            shell.openExternal(link);
            this.switcherWindow?.hide();
        });

        ipcMain.on('size-changed', (event, size) => {
            logger.info('Size changed:', size);
            this.switcherWindow?.setSize(
                Math.floor(size.width),
                Math.floor(size.height)
            );
            this.alignWindow();
        });

        this.switcherWindow.loadFile(
            path.join(getResourcePath(), 'index.html')
        );

        this.switcherWindow.webContents.send('links', links);

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

        logger.info('set positition:', this.switcherWindow.getBounds());
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
