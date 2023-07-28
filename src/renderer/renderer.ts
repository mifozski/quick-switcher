import { ipcRenderer } from 'electron';
import Fuse from 'fuse.js';

ipcRenderer.send('ready');

sendSizeChanged();

const fuseOptions = {
    // isCaseSensitive: false,
    // includeScore: false,
    shouldSort: true,
    includeMatches: true,
    // findAllMatches: false,
    // minMatchCharLength: 1,
    // location: 0,
    // threshold: 0.6,
    // distance: 100,
    // useExtendedSearch: false,
    // ignoreLocation: false,
    // ignoreFieldNorm: false,
    // fieldNormWeight: 1,
    keys: ['title', 'url'],
};

type Link = {
    url: string;
    title: string;
    favicon: string;
};

let fuse: Fuse<Link> | null = null;

ipcRenderer.on('links', (event, message) => {
    const links = message as Link[];
    fuse = new Fuse(links, fuseOptions);
});

const dropdownParent = document.getElementById('dropdown') as HTMLDivElement;

let focusState = 0;

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusState++;
        updateSelection();
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        focusState--;
        updateSelection();
    } else if (event.key === 'Enter') {
        event.preventDefault();
        if (focusState > -1 && focusState < dropdownParent.children.length) {
            const url =
                dropdownParent.children[focusState].getAttribute('data-url');
            ipcRenderer.send('link-clicked', url);
        }
    }
});

function updateSelection() {
    const children = dropdownParent.children;

    if (focusState >= children.length) {
        focusState = 0;
    }
    if (focusState < 0) {
        focusState = children.length - 1;
    }

    for (let i = 0; i < children.length; i++) {
        if (i === focusState) {
            children[i].classList.add('selected');
        } else {
            children[i].classList.remove('selected');
        }
    }
}

function handleInput(event: Event) {
    const targetEl = event.target as HTMLInputElement;
    const query = targetEl.value.trim();

    const results = fuse?.search(query) || [];

    populateDropdown(query, dropdownParent);

    updateSelection();
    highlight(results);

    sendSizeChanged();
}

function highlight(results: Fuse.FuseResult<Link>[]) {
    for (let i = 0; i < dropdownParent.children.length; i++) {
        const linkEl = dropdownParent.children[i];

        const innerHTML = linkEl.innerHTML;

        const matches = results[i].matches || [];
        let nextInnerHtml = '';
        let currentIdx = 0;
        matches.forEach((match) => {
            if (match.key === 'url') {
                return;
            }

            match.indices.forEach((range) => {
                if (range[0] > currentIdx) {
                    nextInnerHtml += innerHTML.substring(currentIdx, range[0]);
                }
                nextInnerHtml +=
                    '<span class="highlight">' +
                    innerHTML.substring(range[0], range[1] + 1) +
                    '</span>';
                currentIdx = range[1] + 1;
            });
        });

        if (currentIdx < innerHTML.length) {
            nextInnerHtml += innerHTML.substring(currentIdx, innerHTML.length);
        }

        linkEl.innerHTML = nextInnerHtml;
    }
}

function populateDropdown(query: string, dropdown: HTMLDivElement) {
    dropdown.innerHTML = '';

    const results = fuse?.search(query) || [];

    results.forEach((link) => {
        const { title, url } = link.item;
        const a = document.createElement('div');
        a.textContent = title;
        a.className = 'dropdown-item';
        a.setAttribute('data-url', url);

        a.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                ipcRenderer.send('link-clicked', url);
            }
        });

        dropdown.appendChild(a);
    });
}

document
    .getElementsByTagName('input')[0]
    .addEventListener('input', handleInput);

function sendSizeChanged() {
    const switcherSize = document.body.getBoundingClientRect();

    ipcRenderer.send('size-changed', {
        width: switcherSize.width,
        height: switcherSize.height,
    });
}
