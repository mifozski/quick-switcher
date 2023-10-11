import { Doc as YDoc } from 'yjs';
import { createLibp2p } from 'libp2p';
import { identifyService } from 'libp2p/identify';
import { createFromJSON } from '@libp2p/peer-id-factory';
import { webSockets } from '@libp2p/websockets';
import { tcp } from '@libp2p/tcp';
import { yamux } from '@chainsafe/libp2p-yamux';
import { noise } from '@chainsafe/libp2p-noise';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { mdns } from '@libp2p/mdns';

import { Link } from '../Config';
import { YjsProvider } from './YjsProvider';

let _configProvider: ConfigProvider | null = null;

type ConfigProvider = {
    getLinksFromTimestamp: (startTimestamp: number) => Link[];
    getLinks: () => Link[];
};

let ydoc1: YDoc | null = null;

async function createProvider() {
    const node = await createLibp2p({
        start: false,
        transports: [tcp(), webSockets()],
        streamMuxers: [yamux() /* , mplex() */],
        connectionEncryption: [noise()],
        addresses: {
            listen: [
                // new Multiaddr('/ip4/127.0.0.1/tcp/8000/ws').toString(),
                '/ip4/0.0.0.0/tcp/0',
            ],
        },
        // peerId: dialer,
        services: {
            pubsub: gossipsub(),
            identify: identifyService(),
        },
        peerDiscovery: [mdns()],
    });

    node.addEventListener('peer:discovery', (peerId) => {
        console.log('found peer: ', peerId.detail.multiaddrs.toString());
        node.peerStore.patch(peerId.detail.id, peerId.detail);
    });

    node.addEventListener('peer:connect', (peerId) => {
        // node.peerStore.patch(peerId.detail, peerId.detail);
        // node.dial(peerId.detail);
        console.log('connected peer: ', peerId.detail.toString());
    });

    await node.start();

    return node;
}

export class ConfigSync {
    async init(configProvider: ConfigProvider): Promise<void> {
        _configProvider = configProvider;

        const dialer = await createFromJSON({
            id: 'QmW8rAgaaA6sRydK1k6vonShQME47aDxaFidbtMevWs73t',
            privKey:
                'CAASpwkwggSjAgEAAoIBAQCTU3gVDv3SRXLOsFln9GEf1nJ/uCEDhOG10eC0H9l9IPpVxjuPT1ep+ykFUdvefq3D3q+W3hbmiHm81o8dYv26RxZIEioToUWp7Ec5M2B/niYoE93za9/ZDwJdl7eh2hNKwAdxTmdbXUPjkIU4vLyHKRFbJIn9X8w9djldz8hoUvC1BK4L1XrT6F2l0ruJXErH2ZwI1youfSzo87TdXIoFKdrQLuW6hOtDCGKTiS+ab/DkMODc6zl8N47Oczv7vjzoWOJMUJs1Pg0ZsD1zmISY38P0y/QyEhatZn0B8BmSWxlLQuukatzOepQI6k+HtfyAAjn4UEqnMaXTP1uwLldVAgMBAAECggEAHq2f8MqpYjLiAFZKl9IUs3uFZkEiZsgx9BmbMAb91Aec+WWJG4OLHrNVTG1KWp+IcaQablEa9bBvoToQnS7y5OpOon1d066egg7Ymfmv24NEMM5KRpktCNcOSA0CySpPIB6yrg6EiUr3ixiaFUGABKkxmwgVz/Q15IqM0ZMmCUsC174PMAz1COFZxD0ZX0zgHblOJQW3dc0X3XSzhht8vU02SMoVObQHQfeXEHv3K/RiVj/Ax0bTc5JVkT8dm8xksTtsFCNOzRBqFS6MYqX6U/u0Onz3Jm5Jt7fLWb5n97gZR4SleyGrqxYNb46d9X7mP0ie7E6bzFW0DsWBIeAqVQKBgQDW0We2L1n44yOvJaMs3evpj0nps13jWidt2I3RlZXjWzWHiYQfvhWUWqps/xZBnAYgnN/38xbKzHZeRNhrqOo+VB0WK1IYl0lZVE4l6TNKCsLsUfQzsb1pePkd1eRZA+TSqsi+I/IOQlQU7HA0bMrah/5FYyUBP0jYvCOvYTlZuwKBgQCvkcVRydVlzjUgv7lY5lYvT8IHV5iYO4Qkk2q6Wjv9VUKAJZauurMdiy05PboWfs5kbETdwFybXMBcknIvZO4ihxmwL8mcoNwDVZHI4bXapIKMTCyHgUKvJ9SeTcKGC7ZuQJ8mslRmYox/HloTOXEJgQgPRxXcwa3amzvdZI+6LwKBgQCLsnQqgxKUi0m6bdR2qf7vzTH4258z6X34rjpT0F5AEyF1edVFOz0XU/q+lQhpNEi7zqjLuvbYfSyA026WXKuwSsz7jMJ/oWqev/duKgAjp2npesY/E9gkjfobD+zGgoS9BzkyhXe1FCdP0A6L2S/1+zg88WOwMvJxl6/xLl24XwKBgCm60xSajX8yIQyUpWBM9yUtpueJ2Xotgz4ST+bVNbcEAddll8gWFiaqgug9FLLuFu5lkYTHiPtgc1RNdphvO+62/9MRuLDixwh/2TPO+iNqwKDKJjda8Nei9vVddCPaOtU/xNQ0xLzFJbG9LBmvqH9izOCcu8SJwGHaTcNUeJj/AoGADCJ26cY30c13F/8awAAmFYpZWCuTP5ppTsRmjd63ixlrqgkeLGpJ7kYb5fXkcTycRGYgP0e1kssBGcmE7DuG955fx3ZJESX3GQZ+XfMHvYGONwF1EiK1f0p6+GReC2VlQ7PIkoD9o0hojM6SnWvv9EXNjCPALEbfPFFvcniKVsE=',
            pubKey: 'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCTU3gVDv3SRXLOsFln9GEf1nJ/uCEDhOG10eC0H9l9IPpVxjuPT1ep+ykFUdvefq3D3q+W3hbmiHm81o8dYv26RxZIEioToUWp7Ec5M2B/niYoE93za9/ZDwJdl7eh2hNKwAdxTmdbXUPjkIU4vLyHKRFbJIn9X8w9djldz8hoUvC1BK4L1XrT6F2l0ruJXErH2ZwI1youfSzo87TdXIoFKdrQLuW6hOtDCGKTiS+ab/DkMODc6zl8N47Oczv7vjzoWOJMUJs1Pg0ZsD1zmISY38P0y/QyEhatZn0B8BmSWxlLQuukatzOepQI6k+HtfyAAjn4UEqnMaXTP1uwLldVAgMBAAE=',
        });

        // const dialer = await peerIdFromKeys(publicKey, privateKey);

        const node1 = await createProvider();

        const listenAddrs = node1.getMultiaddrs();
        console.log(
            'libp2p is listening on the following addresses: ',
            listenAddrs
        );

        const topic = 'test';

        /* const */ ydoc1 = new YDoc();

        const provider1 = new YjsProvider(ydoc1, node1, topic);

        ydoc1.getArray('links').push(
            _configProvider.getLinks().map((link) => ({
                url: link.url,
                title: link.title,
                favicon: link.faviconUrl,
            }))
        );
    }
}

export function testChanges() {
    ydoc1?.getArray('links').push(
        _configProvider?.getLinks().map((link) => ({
            url: link.url,
            title: link.title,
            favicon: link.faviconUrl,
        })) || []
    );
}
