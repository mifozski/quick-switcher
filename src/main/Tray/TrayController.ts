import { Menu, Tray, app, shell } from 'electron';
import { logger } from '../logger';
import { getTrayIconPath } from '../paths';

export class TrayController {
    _tray: Tray;

    init(): void {
        logger.info('Initializing tray...');
        const iconPath = getTrayIconPath();

        logger.info('IconPath: ' + iconPath);

        this._tray = new Tray(iconPath);
        logger.info('Tray initialized');
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Add link', type: 'normal' },
            {
                label: 'Open config folder',
                type: 'normal',
                click: () => {
                    shell.openPath(app.getPath('userData'));
                },
            },
            { label: 'Exit', type: 'normal', role: 'quit' },
        ]);
        this._tray.setToolTip('Quick Switcher');
        this._tray.setContextMenu(contextMenu);
    }

    get tray(): Tray {
        return this._tray;
    }
}
