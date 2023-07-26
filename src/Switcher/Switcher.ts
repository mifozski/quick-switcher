import {
    BrowserWindow,
    globalShortcut,
    ipcMain,
    screen,
    shell,
} from 'electron';
import path from 'path';

import { TrayController } from 'src/Tray/TrayController';
import { ConfigSchema } from 'src/main';

export class Switcher {
    private switcherWindow: BrowserWindow | null;

    width = 200;
    height = 300;

    constructor(
        private trayController: TrayController,
        private config: ConfigSchema[]
    ) {
        console.log('SwitcherController');
        this.switcherWindow = null;
    }

    init(): void {
        let registered;
        try {
            registered = globalShortcut.register(
                'CommandOrControl+Shift+J',
                () => {
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
            console.error('Error while registering global shortcut:', e);
        }

        if (!registered) {
            console.log('Failed to register global shortcut');
        } else {
            console.log('Registered global shortcut');
        }
    }

    showSwitcher(): void {
        if (!this.switcherWindow) {
            this.switcherWindow = this.createWindow();
        }

        this.alignWindow();

        this.switcherWindow.show();
    }

    createWindow(): BrowserWindow {
        this.switcherWindow = new BrowserWindow({
            // height: 600,
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

        const links = this.config.map((config) => {
            return {
                url: config.url,
                title: config.title,
            };
        });

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
            this.alignWindow();
        });

        this.switcherWindow.loadFile(
            path.join(__dirname, '../../assets/index.html')
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

        //calculate the new window position
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
