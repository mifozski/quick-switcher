import crypto from 'crypto';
// @ts-ignore
import Swarm from 'discovery-swarm';
// @ts-ignore
import defaults from 'dat-swarm-defaults';
import getPort from 'get-port';
import fs from 'fs';
import net from 'net';

import { Link } from './Config';
import { getPendingChangesPath } from './paths';

export enum UpdateFlag {
    ADDED = 'added',
    REMOVED = 'removed',
    UPDATED = 'updated',
}

export type LinkChange = {
    url: string;
    timestamp: number;
} & (
    | {
          updateFlag: UpdateFlag.ADDED;
          title: string;
      }
    | {
          updateFlag: UpdateFlag.REMOVED;
      }
    | {
          updateFlag: UpdateFlag.UPDATED;
          newTitle: string;
      }
);

type IncomingMessage =
    | {
          type: 'getState';
      }
    | {
          type: 'state';
          links: Link[];
      };

/**
 * Here we will save our TCP peer connections
 *
 * using the peer id as key: { peer_id: TCP_Connection }
 *
 */
const peers: {
    [id: string]: {
        conn: net.Socket;
        seq: number;
    };
} = {};
// Counter for connections, used for identify connections

let connSeq = 0;

// Peer Identity, a random hash for identify your peer
const myId = crypto.randomBytes(32);
console.log('Your identity: ' + myId.toString('hex'));

let _config: ConfigAccessor | null = null;

type ConfigAccessor = {
    getLinksFromTimestamp: (startTimestamp: number) => Link[];
    getLinks: () => Link[];
};

export function init(config: ConfigAccessor): void {
    _config = config;

    const pendingChangesPath = getPendingChangesPath();

    if (!fs.existsSync(pendingChangesPath)) {
        fs.closeSync(fs.openSync(pendingChangesPath, 'w'));
    }
    const pendingChanges =
        (JSON.parse(
            fs.readFileSync(pendingChangesPath).toString() || '[]'
        ) as LinkChange[]) || [];
}

// reference to redline interface
// let rl: readline.Interface | undefined = undefined;
/**
 * Function for safely call console.log with readline interface active
 */
function log(...args: any[]) {
    // console.log(...args);
    // if (rl) {
    //     // @ts-ignore
    //     rl.clearLine();
    //     rl.close();
    //     rl = undefined;
    // }
    // for (let i = 0, len = args.length; i < len; i++) {
    //     console.log(args[i]);
    // }
    // askUser();
}

/*
 * Function to get text input from user and send it to other peers
 * Like a chat :)
 */
const askUser = async () => {
    // rl = readline.createInterface({
    //     input: process.stdin,
    //     output: process.stdout,
    // });
    // rl.question('Send message: ', (message) => {
    //     // Broadcast to peers
    //     for (const id in peers) {
    //         peers[id].conn.write(message);
    //     }
    //     rl?.close();
    //     rl = undefined;
    //     askUser();
    // });
};

/**
 * Default DNS and DHT servers
 * This servers are used for peer discovery and establishing connection
 *
 */
const config = defaults({
    // peer-id
    id: myId,
});

// const server= net.createServer(connectio)

/**
 * discovery-swarm library establishes a TCP p2p connection and uses
 *
 * discovery-channel library for peer discovery
 */
const sw = Swarm(config);

(async () => {
    // Choose a random unused port for listening TCP peer connections

    const port = await getPort();

    sw.listen(port);
    console.log('Listening to port: ' + port);

    /**
     * The channel we are connecting to.
     * Peers should discover other peers in this channel
     */
    sw.join('me-quick-switcher');

    sw.on('connection', (conn: any, info: any) => {
        // Connection id

        const seq = connSeq;

        const peerId = info.id.toString('hex');
        log(`Connected #${seq} to peer: ${peerId}`);

        // Keep alive TCP connection with peer

        if (info.initiator) {
            try {
                conn.setKeepAlive(true, 600);
            } catch (exception) {
                log('exception', exception);
            }
        }

        let messageBuffer = '';
        conn.on('data', (message: string) => {
            // log('Received Message from peer ' + peerId, '----> ' + message);

            messageBuffer += message;
        });

        conn.on('end', () => {
            console.log('received end');
            const data = JSON.parse(messageBuffer);
            messageBuffer = '';

            // console.log('chunksRemaining:', data.chunksRemaining);

            handlePeerMessage(data, peerId);
        });

        conn.on('close', () => {
            // Here we handle peer disconnection

            log(`Connection ${seq} closed, peer id: ${peerId}`);

            // If the closing connection is the last connection with the peer, removes the peer

            if (peers[peerId].seq === seq) {
                delete peers[peerId];
            }
        });

        // Save the connection

        peers[peerId] = {
            conn,
            seq,
        };
        connSeq++;

        // console.log('requesting links from ', peerId);
        retrieveLinks(peerId);
    });

    // Read user message from command line
    // askUser();
})();

function retrieveLinks(peerId: string) {
    peers[peerId].conn.write(
        JSON.stringify({
            type: 'getState',
        })
    );
}

function handlePeerMessage(message: IncomingMessage, senderId: string) {
    if (!_config) {
        throw new Error('Config was not initialized');
    }

    switch (message.type) {
        case 'getState':
            handleGetStateMessage(senderId);
            break;
        case 'state':
            handleStateMessage(message.links);
            break;
        default:
            break;
    }
}

function handleGetStateMessage(senderId: string) {
    const links = _config?.getLinks() || [];

    const chunks: Link[][] = [];
    const chunkSize = 50;
    for (let i = 0; i < links.length; i += chunkSize) {
        const chunk = links.slice(i, i + chunkSize);
        chunks.push(chunk);
    }
    console.log('number of chunks:', chunks.length);

    console.log(peers[senderId].conn);

    peers[senderId].conn.write(
        JSON.stringify({
            type: 'state',
            links: links,
            // chunksRemaining: chunks.length - i - 1,
        })
    );

    // chunks.forEach((chunk, i) => {
    //     console.log('sending state for ', senderId);
    //     peers[senderId].conn.write(
    //         JSON.stringify({
    //             type: 'state',
    //             links: chunk,
    //             chunksRemaining: chunks.length - i - 1,
    //         })
    //     );
    // });
}

function handleStateMessage(remoteLinks: Link[]) {
    if (!_config) {
        throw new Error('Config was not initialized');
    }

    const localLinks = _config.getLinks();

    const localLinkMap = localLinks?.reduce<{ [linkUrl: string]: number }>(
        (acc, link, i) => {
            acc[link.url] = i;
            return acc;
        },
        {}
    );

    remoteLinks.forEach((remoteLink) => {
        const matchingLocalLinkIndex = localLinkMap[remoteLink.url];
        const localLink = localLinks[matchingLocalLinkIndex];

        if (
            matchingLocalLinkIndex !== undefined &&
            localLink.updateTs < remoteLink.updateTs
        ) {
            localLink.title = remoteLink.title;
            localLink.updateTs = remoteLink.updateTs;
        } else if (matchingLocalLinkIndex === undefined) {
            localLinks.push(remoteLink);
        }
    });

    // console.log('new local links: ', localLinks);
}

function broadcastChanges() {}

export function triggerSync() {}
