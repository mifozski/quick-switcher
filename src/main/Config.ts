import fs from 'fs';

import { getConfigPath } from './paths';
import { ConfigSync } from './ConfigSync/ConfigSync';

export type Link = {
    title: string;
    url: string;
    faviconUrl: string;
    updated: number;
};

export class Config {
    config: Link[];

    listeners: (() => void)[] = [];

    constructor() {
        this.config = [];
    }
    async init(): Promise<void> {
        const configPath = getConfigPath();

        const configSync = new ConfigSync();
        await configSync.init({
            getLinksFromTimestamp: (startTimestamp) => {
                return this.links.filter(
                    (link) => link.updated >= startTimestamp
                );
            },
            getLinks: () => {
                return this.links;
            },
        });

        if (!fs.existsSync(configPath)) {
            fs.closeSync(fs.openSync(configPath, 'w'));
        }
        const config =
            (JSON.parse(
                fs.readFileSync(configPath).toString() || '[]'
            ) as Link[]) || [];

        const needMigration = doMigrations(config);
        if (needMigration) {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        }

        this.config = config;
    }

    addUpdateListener(listener: () => void): void {
        this.listeners.push(listener);
    }

    get links(): Link[] {
        return this.config;
    }

    addLinks(links: Link[]): void {
        const nextConfig = this.getLinksWithoutDuplicates(this.links, links);

        this.config = nextConfig;

        fs.writeFileSync(getConfigPath(), JSON.stringify(this.config, null, 2));

        this.listeners.forEach((listener) => listener());
    }

    deleteLink(linkUrl: string): void {
        const linkToDelete = this.links.find((link) => link.url === linkUrl);
        if (!linkToDelete) {
            return;
        }
        // linkToDelete.updateFlag = UpdateFlag.REMOVED;
        // linkToDelete.updated = Date.now();

        fs.writeFileSync(getConfigPath(), JSON.stringify(this.config, null, 2));

        this.listeners.forEach((listener) => listener());
    }

    private getLinksWithoutDuplicates(links: Link[], newLinks: Link[]): Link[] {
        const existingLinkMap: { [url: string]: number } = {};

        links.forEach((link, i) => {
            existingLinkMap[link.url] = i;
        });

        const nextLinks = links;

        // const changes: LinkChange[] = [];

        const currentTime = Date.now();

        newLinks.forEach((newLink) => {
            if (existingLinkMap[newLink.url] != null) {
                const currentLink = links[existingLinkMap[newLink.url]];
                if (currentLink.title !== newLink.title) {
                    // changes.push({
                    //     url: currentLink.url,
                    //     updateFlag: UpdateFlag.UPDATED,
                    //     newTitle: newLink.title,
                    //     timestamp: currentTime,
                    // });

                    // currentLink.updateFlag = UpdateFlag.UPDATED;
                    currentLink.updated = currentTime;
                    currentLink.title = newLink.title;
                }
            } else {
                // changes.push({
                //     url: newLink.url,
                //     updateFlag: UpdateFlag.ADDED,
                //     title: newLink.title,
                //     timestamp: currentTime,
                // });
                // newLink.updateFlag = UpdateFlag.ADDED;
                nextLinks.push(newLink);
            }
        });

        // console.log('changes:', changes);

        return nextLinks;
    }
}

function doMigrations(config: Link[]): boolean {
    return addFaviconUrls(config);
}

function addFaviconUrls(config: Link[]): boolean {
    let needMigration = false;
    for (const link of config) {
        if (!link.faviconUrl) {
            needMigration = true;
            const url = new URL(link.url);
            const faviconUrl = url.origin + '/favicon.ico';
            link.faviconUrl = faviconUrl;
        }
    }

    return needMigration;
}
