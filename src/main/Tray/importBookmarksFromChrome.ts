import { BrowserWindow } from 'electron';
import fs from 'fs';

import { Link } from '../main';
import { getConfigPath, getGoogleChromeBookmarksPath } from '../paths';

export function importBookmarksFromChrome(): void {
    const bookmarksPath = getGoogleChromeBookmarksPath();

    const bookmarksFile = fs.readFileSync(bookmarksPath).toString();

    const bookmarks = JSON.parse(bookmarksFile);

    const links: Link[] = [];

    Object.keys(bookmarks.roots).forEach((rootKey) => {
        collectLinks(bookmarks.roots[rootKey], links);
    });

    const configPath = getConfigPath();
    const config =
        (JSON.parse(
            fs.readFileSync(configPath).toString() || '[]'
        ) as Link[]) || [];

    const linkMap: { [url: string]: boolean } = {};
    const nextConfig = config.concat(links).reduce<Link[]>((acc, link) => {
        if (linkMap[link.url]) {
            return acc;
        }
        linkMap[link.url] = true;
        acc.push(link);
        return acc;
    }, []);

    fs.writeFileSync(configPath, JSON.stringify(nextConfig, null, 2));

    BrowserWindow.getAllWindows()[0].webContents.send('links', nextConfig);
}

type ChromeBookmark =
    | {
          type: 'folder';
          children: ChromeBookmark[];
      }
    | {
          type: 'url';
          name: string;
          url: string;
      };

function collectLinks(bookmark: ChromeBookmark, links: Link[]): void {
    if (bookmark.type === 'url') {
        links.push({
            title: bookmark.name,
            url: bookmark.url,
        });
    } else {
        bookmark.children.forEach((childBookmark) =>
            collectLinks(childBookmark, links)
        );
    }
}
