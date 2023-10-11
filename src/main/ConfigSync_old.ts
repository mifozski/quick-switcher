// import crypto from 'crypto';
// // @ts-ignore
// import Swarm from 'discovery-swarm';
// // @ts-ignore
// import defaults from 'dat-swarm-defaults';
// import getPort from 'get-port';
// import { Doc as YDoc } from 'yjs';
// // @ts-ignore
// // import ss from 'socket.io-stream';
// import fs from 'fs';
// import net from 'net';
// import { createLibp2p } from 'libp2p';
// // import { createpeer } from '@libp2p/peer-id-factory';
// // import PeerId from 'peer-id';
// import PeerId from '@libp2p/peer-id';
// import { webSockets } from '@libp2p/websockets';
// import { yamux } from '@chainsafe/libp2p-yamux';
// import { noise } from '@chainsafe/libp2p-noise';

// import { Link } from './Config';
// import { getPendingChangesPath } from './paths';
// import { Multiaddr } from 'multiaddr';
// import Provider from 'y-libp2p';

// export enum UpdateFlag {
//     ADDED = 'added',
//     REMOVED = 'removed',
//     UPDATED = 'updated',
// }

// export type LinkChange = {
//     url: string;
//     timestamp: number;
// } & (
//     | {
//           updateFlag: UpdateFlag.ADDED;
//           title: string;
//       }
//     | {
//           updateFlag: UpdateFlag.REMOVED;
//       }
//     | {
//           updateFlag: UpdateFlag.UPDATED;
//           newTitle: string;
//       }
// );

// type IncomingMessage =
//     | {
//           type: 'getState';
//       }
//     | {
//           type: 'state';
//           links: Link[];
//       };

// /**
//  * Here we will save our TCP peer connections
//  *
//  * using the peer id as key: { peer_id: TCP_Connection }
//  *
//  */
// const peers: {
//     [id: string]: {
//         conn: net.Socket;
//         seq: number;
//     };
// } = {};
// // Counter for connections, used for identify connections

// let connSeq = 0;

// // Peer Identity, a random hash for identify your peer
// const myId = crypto.randomBytes(32);
// console.log('Your identity: ' + myId.toString('hex'));

// let _config: ConfigAccessor | null = null;

// type ConfigAccessor = {
//     getLinksFromTimestamp: (startTimestamp: number) => Link[];
//     getLinks: () => Link[];
// };

// export async function init(config: ConfigAccessor): Promise<void> {
//     _config = config;

//     const dialer = await PeerId.createFromJSON({
//         id: 'QmNMMAqSxPetRS1cVMmutW5BCN1qQQyEr4u98kUvZjcfEw',
//         privKey:
//             'CAASpQkwggShAgEAAoIBAQDPek2aeHMa0blL42RTKd6xgtkk4Zkldvq4LHxzcag5uXepiQzWANEUvoD3KcUTmMRmx14PvsxdLCNst7S2JSa0R2n5wSRs14zGy6892lx4H4tLBD1KSpQlJ6vabYM1CJhIQRG90BtzDPrJ/X1iJ2HA0PPDz0Mflam2QUMDDrU0IuV2m7gSCJ5r4EmMs3U0xnH/1gShkVx4ir0WUdoWf5KQUJOmLn1clTRHYPv4KL9A/E38+imNAXfkH3c2T7DrCcYRkZSpK+WecjMsH1dCX15hhhggNqfp3iulO1tGPxHjm7PDGTPUjpCWKpD5e50sLqsUwexac1ja6ktMfszIR+FPAgMBAAECggEAB2H2uPRoRCAKU+T3gO4QeoiJaYKNjIO7UCplE0aMEeHDnEjAKC1HQ1G0DRdzZ8sb0fxuIGlNpFMZv5iZ2ZFg2zFfV//DaAwTek9tIOpQOAYHUtgHxkj5FIlg2BjlflGb+ZY3J2XsVB+2HNHkUEXOeKn2wpTxcoJE07NmywkO8Zfr1OL5oPxOPlRN1gI4ffYH2LbfaQVtRhwONR2+fs5ISfubk5iKso6BX4moMYkxubYwZbpucvKKi/rIjUA3SK86wdCUnno1KbDfdXSgCiUlvxt/IbRFXFURQoTV6BOi3sP5crBLw8OiVubMr9/8WE6KzJ0R7hPd5+eeWvYiYnWj4QKBgQD6jRlAFo/MgPO5NZ/HRAk6LUG+fdEWexA+GGV7CwJI61W/Dpbn9ZswPDhRJKo3rquyDFVZPdd7+RlXYg1wpmp1k54z++L1srsgj72vlg4I8wkZ4YLBg0+zVgHlQ0kxnp16DvQdOgiRFvMUUMEgetsoIx1CQWTd67hTExGsW+WAZQKBgQDT/WaHWvwyq9oaZ8G7F/tfeuXvNTk3HIJdfbWGgRXB7lJ7Gf6FsX4x7PeERfL5a67JLV6JdiLLVuYC2CBhipqLqC2DB962aKMvxobQpSljBBZvZyqP1IGPoKskrSo+2mqpYkeCLbDMuJ1nujgMP7gqVjabs2zj6ACKmmpYH/oNowJ/T0ZVtvFsjkg+1VsiMupUARRQuPUWMwa9HOibM1NIZcoQV2NGXB5Z++kR6JqxQO0DZlKArrviclderUdY+UuuY4VRiSEprpPeoW7ZlbTku/Ap8QZpWNEzZorQDro7bnfBW91fX9/81ets/gCPGrfEn+58U3pdb9oleCOQc/ifpQKBgBTYGbi9bYbd9vgZs6bd2M2um+VFanbMytS+g5bSIn2LHXkVOT2UEkB+eGf9KML1n54QY/dIMmukA8HL1oNAyalpw+/aWj+9Ui5kauUhGEywHjSeBEVYM9UXizxz+m9rsoktLLLUI0o97NxCJzitG0Kub3gn0FEogsUeIc7AdinZAoGBANnM1vcteSQDs7x94TDEnvvqwSkA2UWyLidD2jXgE0PG4V6tTkK//QPBmC9eq6TIqXkzYlsErSw4XeKO91knFofmdBzzVh/ddgx/NufJV4tXF+a2iTpqYBUJiz9wpIKgf43/Ob+P1EA99GAhSdxz1ess9O2aTqf3ANzn6v6g62Pv',
//         pubKey: 'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDPek2aeHMa0blL42RTKd6xgtkk4Zkldvq4LHxzcag5uXepiQzWANEUvoD3KcUTmMRmx14PvsxdLCNst7S2JSa0R2n5wSRs14zGy6892lx4H4tLBD1KSpQlJ6vabYM1CJhIQRG90BtzDPrJ/X1iJ2HA0PPDz0Mflam2QUMDDrU0IuV2m7gSCJ5r4EmMs3U0xnH/1gShkVx4ir0WUdoWf5KQUJOmLn1clTRHYPv4KL9A/E38+imNAXfkH3c2T7DrCcYRkZSpK+WecjMsH1dCX15hhhggNqfp3iulO1tGPxHjm7PDGTPUjpCWKpD5e50sLqsUwexac1ja6ktMfszIR+FPAgMBAAE=',
//     });

//     console.log('creating libp2p');

//     const node = await createLibp2p({
//         transports: [/* tcp(),  */ webSockets()],
//         streamMuxers: [yamux() /* , mplex() */],
//         connectionEncryption: [noise()],
//         addresses: {
//             listen: [new Multiaddr('/ip4/127.0.0.1/tcp/0/ws').toString()],
//         },
//         /*  addresses: {
//             listen: ['/ip4/0.0.0.0/tcp/0'],
//         }, */
//         peerId: dialer,
//         // peerDiscovery: {
//         //     autod
//         // }
//     });

//     // node.getMultiaddrs().forEach((ma) => {
//     //     console.log(ma.toString());
//     // });

//     await node.start();

//     const topic = 'test';

//     const ydoc1 = new YDoc();

//     // const provider1 = new Provider(ydoc1, node, topic);

//     // console.log('started: ', provider1);

//     // const libp2p = await createLibp2p({
//     //     start: true,
//     //     peerId: dialer,
//     //     addresses: {
//     //         listen: ['/ip4/0.0.0.0/tcp/0'],
//     //     },
//     // });
//     console.log('libp2p:', node);

//     // libp2p node is ready, so we can start using ipfs-pubsub-room
//     // const room = Room(libp2p, 'room-name');

//     const pendingChangesPath = getPendingChangesPath();

//     if (!fs.existsSync(pendingChangesPath)) {
//         fs.closeSync(fs.openSync(pendingChangesPath, 'w'));
//     }
//     const pendingChanges =
//         (JSON.parse(
//             fs.readFileSync(pendingChangesPath).toString() || '[]'
//         ) as LinkChange[]) || [];
// }

// // reference to redline interface
// // let rl: readline.Interface | undefined = undefined;
// /**
//  * Function for safely call console.log with readline interface active
//  */
// function log(...args: any[]) {
//     // console.log(...args);
//     // if (rl) {
//     //     // @ts-ignore
//     //     rl.clearLine();
//     //     rl.close();
//     //     rl = undefined;
//     // }
//     // for (let i = 0, len = args.length; i < len; i++) {
//     //     console.log(args[i]);
//     // }
//     // askUser();
// }

// /*
//  * Function to get text input from user and send it to other peers
//  * Like a chat :)
//  */
// const askUser = async () => {
//     // rl = readline.createInterface({
//     //     input: process.stdin,
//     //     output: process.stdout,
//     // });
//     // rl.question('Send message: ', (message) => {
//     //     // Broadcast to peers
//     //     for (const id in peers) {
//     //         peers[id].conn.write(message);
//     //     }
//     //     rl?.close();
//     //     rl = undefined;
//     //     askUser();
//     // });
// };

// /**
//  * Default DNS and DHT servers
//  * This servers are used for peer discovery and establishing connection
//  *
//  */
// const config = defaults({
//     // peer-id
//     id: myId,
// });

// // const server= net.createServer(connectio)

// /**
//  * discovery-swarm library establishes a TCP p2p connection and uses
//  *
//  * discovery-channel library for peer discovery
//  */
// const sw = Swarm(config);

// (async () => {
//     // Choose a random unused port for listening TCP peer connections

//     const port = await getPort();

//     sw.listen(port);
//     console.log('Listening to port: ' + port);

//     /**
//      * The channel we are connecting to.
//      * Peers should discover other peers in this channel
//      */
//     sw.join('me-quick-switcher');

//     sw.on('connection', (conn: any, info: any) => {
//         // Connection id

//         const seq = connSeq;

//         const peerId = info.id.toString('hex');
//         log(`Connected #${seq} to peer: ${peerId}`);

//         // Keep alive TCP connection with peer

//         if (info.initiator) {
//             try {
//                 conn.setKeepAlive(true, 600);
//             } catch (exception) {
//                 log('exception', exception);
//             }
//         }

//         let messageBuffer = '';
//         conn.on('data', (message: string) => {
//             console.log(
//                 'Received Message from peer ' + peerId,
//                 '----> ' + message
//             );

//             messageBuffer += message;
//         });

//         conn.on('end', () => {
//             console.log('received end');
//             const data = JSON.parse(messageBuffer);
//             messageBuffer = '';

//             // console.log('chunksRemaining:', data.chunksRemaining);

//             handlePeerMessage(data, peerId);
//         });

//         conn.on('close', () => {
//             // Here we handle peer disconnection

//             log(`Connection ${seq} closed, peer id: ${peerId}`);

//             // If the closing connection is the last connection with the peer, removes the peer

//             if (peers[peerId].seq === seq) {
//                 delete peers[peerId];
//             }
//         });

//         // Save the connection

//         peers[peerId] = {
//             conn,
//             seq,
//         };
//         connSeq++;

//         console.log('requesting links from ', peerId);
//         // retrieveLinks(peerId);
//     });

//     // Read user message from command line
//     // askUser();
// })();

// function retrieveLinks(peerId: string) {
//     peers[peerId].conn.write(
//         JSON.stringify({
//             type: 'getState',
//         })
//     );
// }

// function handlePeerMessage(message: IncomingMessage, senderId: string) {
//     if (!_config) {
//         throw new Error('Config was not initialized');
//     }

//     switch (message.type) {
//         case 'getState':
//             handleGetStateMessage(senderId);
//             break;
//         case 'state':
//             handleStateMessage(message.links);
//             break;
//         default:
//             break;
//     }
// }

// function handleGetStateMessage(senderId: string) {
//     // const links = _config?.getLinks() || [];
//     // console.log('handingg get state: ');
//     // const stream: net.Socket = ss.createStream();
//     // stream.on('end', function () {
//     //     console.log('file sent');
//     // });
//     // ss(peers[senderId].conn).emit('sendData', stream);
//     // stream.write(
//     //     JSON.stringify({
//     //         type: 'state',
//     //         links: links,
//     //     })
//     // );
//     // stream.end();
//     // --------------
//     // const chunks: Link[][] = [];
//     // const chunkSize = 50;
//     // for (let i = 0; i < links.length; i += chunkSize) {
//     //     const chunk = links.slice(i, i + chunkSize);
//     //     chunks.push(chunk);
//     // }
//     // console.log('number of chunks:', chunks.length);
//     // peers[senderId].conn.write(
//     //     JSON.stringify({
//     //         type: 'state',
//     //         links: links,
//     //         // chunksRemaining: chunks.length - i - 1,
//     //     })
//     // );
//     // peers[senderId].conn.end();
//     // chunks.forEach((chunk, i) => {
//     //     console.log('sending state for ', senderId);
//     //     peers[senderId].conn.write(
//     //         JSON.stringify({
//     //             type: 'state',
//     //             links: chunk,
//     //             chunksRemaining: chunks.length - i - 1,
//     //         })
//     //     );
//     // });
// }

// function handleStateMessage(remoteLinks: Link[]) {
//     if (!_config) {
//         throw new Error('Config was not initialized');
//     }

//     const localLinks = _config.getLinks();

//     const localLinkMap = localLinks?.reduce<{ [linkUrl: string]: number }>(
//         (acc, link, i) => {
//             acc[link.url] = i;
//             return acc;
//         },
//         {}
//     );

//     remoteLinks.forEach((remoteLink) => {
//         const matchingLocalLinkIndex = localLinkMap[remoteLink.url];
//         const localLink = localLinks[matchingLocalLinkIndex];

//         if (
//             matchingLocalLinkIndex !== undefined &&
//             localLink.updated < remoteLink.updated
//         ) {
//             localLink.title = remoteLink.title;
//             localLink.updated = remoteLink.updated;
//         } else if (matchingLocalLinkIndex === undefined) {
//             localLinks.push(remoteLink);
//         }
//     });

//     // console.log('new local links: ', localLinks);
// }

// // function broadcastChanges() {}

// // export function triggerSync() {}
