import { Menu, Tray } from 'electron';
import path from 'path';

export class TrayController {
    _tray: Tray;

    init(): void {
        this._tray = new Tray(
            path.join(__dirname, '../../assets/mac/IconCircle@16.png')
        );
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
