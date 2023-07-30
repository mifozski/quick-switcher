import fs from 'fs';

import { getGoogleChromeBookmarksPath } from '../paths';
import { Link } from '../Config';

export function getBookmarksFromChrome(): Link[] {
    const bookmarksPath = getGoogleChromeBookmarksPath();

    const bookmarksFile = fs.readFileSync(bookmarksPath).toString();

    const bookmarks = JSON.parse(bookmarksFile);

    const links: Link[] = [];

    Object.keys(bookmarks.roots).forEach((rootKey) => {
        collectLinks(bookmarks.roots[rootKey], links);
    });

    return links;
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
        const faviconUrl = new URL(bookmark.url).origin + '/favicon.ico';
        links.push({
            title: bookmark.name,
            url: bookmark.url,
            faviconUrl,
        });
    } else {
        bookmark.children.forEach((childBookmark) =>
            collectLinks(childBookmark, links)
        );
    }
}
