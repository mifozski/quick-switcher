import { Menu, Tray, app, shell } from 'electron';
import { logger } from '../logger';
import { getTrayIconPath } from '../paths';
import { getBookmarksFromChrome as getBookmarksFromChrome } from './getBookmarksFromChrome';
import { Config } from '../Config';
import { testChanges } from '../ConfigSync/ConfigSync';

export class TrayController {
    _tray: Tray;

    constructor(private config: Config) {
        logger.info('Initializing tray...');
        const iconPath = getTrayIconPath();
        this._tray = new Tray(iconPath);
    }

    init(): void {
        logger.info('Tray initialized');
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Open Config Folder',
                type: 'normal',
                click: () => {
                    shell.openPath(app.getPath('userData'));
                },
            },
            {
                label: 'Import Bookmarks from Google Chrome',
                click: () => {
                    const links = getBookmarksFromChrome();
                    this.config.addLinks(links);
                },
            },
            {
                label: 'Launch at Startup',
                type: 'checkbox',
                checked: app.getLoginItemSettings().openAtLogin,
                click: (args) => {
                    console.log(args.checked);
                    app.setLoginItemSettings({
                        openAtLogin: args.checked,
                    });
                },
            },
            {
                label: 'Test change',
                click: () => {
                    testChanges();
                },
            },
            { label: 'Exit', type: 'normal', role: 'quit' },
        ]);
        this._tray.setToolTip('Quick Switcher (Cmd + Shift + J)');
        this._tray.setContextMenu(contextMenu);
    }

    get tray(): Tray {
        return this._tray;
    }
}
