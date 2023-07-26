import { app } from 'electron';
import fs from 'fs';

import { TrayController } from './Tray/TrayController';
import { Switcher } from './Switcher/Switcher';

export type ConfigSchema = {
    title: string;
    url: string;
};

function readConfig() {
    const configPath = app.getPath('userData') + '/config.json';
    if (!fs.existsSync(configPath)) {
        fs.closeSync(fs.openSync(configPath, 'w'));
    }
    const config = JSON.parse(
        fs.readFileSync(configPath).toString()
    ) as ConfigSchema[];
    return config;
}

app.whenReady().then(() => {
    const config = readConfig();

    const trayController = new TrayController();
    trayController.init();

    const switcher = new Switcher(trayController, config);
    switcher.init();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
