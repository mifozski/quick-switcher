import path from 'path';
import { app } from 'electron';

export function getResourcePath(): string {
    return app.isPackaged
        ? path.join(process.cwd(), 'resources', 'assets')
        : path.join(process.cwd(), 'assets');
}
