import { Menu, Tray } from 'electron';
import path from 'path';
import { logger } from '../logger';
import { getResourcePath } from '../paths';

export class TrayController {
    _tray: Tray;

    init(): void {
        logger.info('Initializing tray...');
        logger.info('getResourcePath:', getResourcePath());
        const iconPath = path.join(getResourcePath(), 'win/trayIcon.ico');
        console.log('iconPath:', iconPath);
        // const iconPath = path.join(
        //     __dirname,
        //     '../../assets/mac/IconCircle@16.png'
        // );

        logger.info('IconPath: ' + iconPath);

        this._tray = new Tray(iconPath);
        logger.info('Tray initialized');
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Add link', type: 'normal' },
            { label: 'Exit', type: 'normal', role: 'quit' },
        ]);
        this._tray.setToolTip('Quick Switcher');
        this._tray.setContextMenu(contextMenu);
    }

    get tray(): Tray {
        return this._tray;
    }
}
