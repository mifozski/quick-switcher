import { Menu, Tray, app, shell } from 'electron';
import { logger } from '../logger';
import { getTrayIconPath } from '../paths';
import { importBookmarksFromChrome } from './importBookmarksFromChrome';

export class TrayController {
    _tray: Tray;

    init(): void {
        logger.info('Initializing tray...');
        const iconPath = getTrayIconPath();

        this._tray = new Tray(iconPath);
        logger.info('Tray initialized');
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Add link', type: 'normal' },
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
                    importBookmarksFromChrome();
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
