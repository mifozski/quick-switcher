import fs from 'fs';

import { getConfigPath } from './paths';

export type Link = {
    title: string;
    url: string;
    faviconUrl: string;
};

export class Config {
    config: Link[];

    listeners: (() => void)[] = [];

    constructor() {
        this.config = [];
    }
    init(): void {
        const configPath = getConfigPath();

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

    private getLinksWithoutDuplicates(links: Link[], newLinks: Link[]): Link[] {
        const existingLinkMap: { [url: string]: number } = {};

        links.forEach((link, i) => {
            existingLinkMap[link.url] = i;
        });

        const nextLinks = links;

        newLinks.forEach((newLink) => {
            if (existingLinkMap[newLink.url] != null) {
                nextLinks[existingLinkMap[newLink.url]].title = newLink.title;
            } else {
                nextLinks.push(newLink);
            }
        });

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
