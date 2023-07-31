import Fuse from 'fuse.js';
import { Link } from 'src/main/Config';

window.ipc.send('ready');

sendSizeChanged();

const fuseOptions = {
    // isCaseSensitive: false,
    // includeScore: false,
    shouldSort: true,
    includeMatches: true,
    // findAllMatches: false,
    // minMatchCharLength: 1,
    // location: 0,
    threshold: 0.8,
    // distance: 100,
    // useExtendedSearch: false,
    // ignoreLocation: false,
    // ignoreFieldNorm: false,
    // fieldNormWeight: 1,
    keys: ['title', 'url'],
};

let fuse: Fuse<Link> | null = null;

window.ipc.on('links', (event, message) => {
    const links = message as Link[];
    fuse = new Fuse(links, fuseOptions);
});

const dropdownParent = document.getElementById('dropdown') as HTMLDivElement;
const input = document.getElementById('input') as HTMLInputElement;

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
            window.ipc.send('link-clicked', url);
        }
    } else if (event.key === 'Escape') {
        if (input.value !== '') {
            input.value = '';
        } else {
            window.ipc.send('escape-clicked');
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

    focusState = 0;

    updateSelection();
    highlight(results);

    sendSizeChanged();
}

function highlight(results: Fuse.FuseResult<Link>[]) {
    for (let i = 0; i < dropdownParent.children.length; i++) {
        const linkEl = dropdownParent.children[i].querySelector(
            '#title'
        ) as HTMLDivElement;

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

const dropdownTemplate = document.getElementsByTagName(
    'template'
)[0] as HTMLTemplateElement;

function populateDropdown(query: string, dropdown: HTMLDivElement) {
    dropdown.innerHTML = '';

    const results = (fuse?.search(query) || []).slice(0, 10);

    results.forEach((link) => {
        const { title, url } = link.item;

        const clone = dropdownTemplate.content.cloneNode(true) as HTMLElement;

        const itemEl = clone.children[0] as HTMLDListElement;

        const titleEl = itemEl.querySelector('#title') as HTMLElement;
        const urlEl = itemEl.querySelector('#url') as HTMLElement;
        const faviconEl = itemEl.querySelector('#favicon') as HTMLElement;

        titleEl.textContent = title;
        urlEl.textContent = url;
        itemEl.setAttribute('data-url', url);

        faviconEl.style.background = 'url(' + link.item.faviconUrl + ')';

        itemEl.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                window.ipc.send('link-clicked', url);
            }
        });

        dropdown.appendChild(clone);
    });
}

input.addEventListener('input', handleInput);

function sendSizeChanged() {
    const switcherSize = document.body.getBoundingClientRect();

    window.ipc.send('size-changed', {
        width: switcherSize.width,
        height: switcherSize.height,
    });
}
