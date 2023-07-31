import { IpcRendererEvent } from 'electron';

/* eslint-env browser */
const { contextBridge, ipcRenderer } = require('electron');

declare global {
    interface Window {
        ipc: {
            send: (channel: string, ...args: any[]) => void;
            on: (
                channel: string,
                listener: (event: IpcRendererEvent, ...args: any[]) => void
            ) => void;
        };
    }
}

contextBridge.exposeInMainWorld('ipc', {
    send(channel: string, ...args: any[]): void {
        return ipcRenderer.send(channel, ...args);
    },
    on(
        channel: string,
        listener: (event: IpcRendererEvent, ...args: any[]) => void
    ) {
        return ipcRenderer.on(channel, listener);
    },
});

export {};
