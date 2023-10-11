import type { Libp2p } from 'libp2p';
import { Stream, Connection } from '@libp2p/interface/connection';
import { Message, SignedMessage } from '@libp2p/interface/pubsub';
import { peerIdFromString } from '@libp2p/peer-id';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';

import * as Y from 'yjs';
import type { Doc as YDoc } from 'yjs';
import {
    encodeAwarenessUpdate,
    applyAwarenessUpdate,
} from 'y-protocols/awareness';
import { Awareness } from 'y-protocols/awareness';

function changesTopic(topic: string): string {
    return `/marcopolo/gossipPad/${topic}/changes/0.0.01`;
}

function stateVectorTopic(topic: string): string {
    return `/marcopolo/gossipPad/${topic}/stateVector/0.0.1`;
}

function syncProtocol(topic: string): string {
    return `/marcopolo/gossipPad/${topic}/sync/0.0.1`;
}

function awarenessProtocolTopic(topic: string): string {
    return `/marcopolo/gossipPad/${topic}/awareness/0.0.1`;
}

type PubSub = ReturnType<ReturnType<typeof gossipsub>>;

export class YjsProvider {
    ydoc: YDoc;
    node: Libp2p<{
        pubsub: PubSub;
    }>;
    peerID: string;
    topic: string;
    stateVectors: { [key: string]: Uint8Array } = {};
    unsyncedPeers: Set<string> = new Set();
    initialSync = false;
    aggressivelyKeepPeersUpdated = true;

    public awareness: Awareness;

    private _pubsub: PubSub;

    constructor(
        ydoc: YDoc,
        node: Libp2p<{
            pubsub: PubSub;
        }>,
        topic: string
    ) {
        this.ydoc = ydoc;
        this.node = node;
        this.topic = topic;
        this.peerID = this.node.peerId.toString();
        this.stateVectors[this.peerID] = Y.encodeStateVector(this.ydoc);
        this.awareness = new Awareness(ydoc);

        this.awareness.setLocalStateField('user', {
            name: this.peerID,
        });

        ydoc.on('update', this.onUpdate.bind(this));

        this._pubsub = this.node.services.pubsub;

        this.pubsub.subscribe(changesTopic(topic));
        this.pubsub.subscribe(stateVectorTopic(topic));
        this.pubsub.subscribe(awarenessProtocolTopic(topic));

        this.pubsub.addEventListener('message', async (event) => {
            if (event.detail.type !== 'signed') {
                return;
            }

            if (event.detail.topic === changesTopic(topic)) {
                this.onPubSubChanges(event.detail);
            }

            if (event.detail.topic === stateVectorTopic(topic)) {
                this.onPubSubStateVector(event.detail);
            }

            if (event.detail.topic === awarenessProtocolTopic(topic)) {
                this.onPubSubAwareness.bind(event.detail);
            }
        });

        node.handle(syncProtocol(topic), this.onSyncMsg.bind(this));

        this.tryInitialSync(this.stateVectors[this.peerID], this);
    }

    destroy(): void {
        this.pubsub.unsubscribe(changesTopic(this.topic));
        this.pubsub.unsubscribe(stateVectorTopic(this.topic));
        this.pubsub.unsubscribe(awarenessProtocolTopic(this.topic));

        this.pubsub.removeEventListener('message');

        this.node.unhandle(syncProtocol(this.topic));

        this.initialSync = true;
    }

    // Not required, but nice if we can get synced against a peer sooner rather than latter
    private async tryInitialSync(
        updateData: Uint8Array,
        origin: this | any
    ): Promise<boolean | void> {
        const tries = 10;
        const maxWaitTime = 1000;
        let waitTime = 100;
        for (let i = 0; i < tries; i++) {
            if (this.initialSync) {
                return;
            }

            // needed to type hack

            const peers = [
                ...(this.node.services.pubsub.getSubscribers(
                    stateVectorTopic(this.topic)
                ) || []),
            ];

            if (peers.length !== 0) {
                console.log('doing initial sync');
                const peer = peers[i % peers.length];
                try {
                    await this.syncPeer(peer.toString());
                    this.initialSync = true;
                    return true;
                } catch (e) {
                    console.warn('failed to sync with anyone', e);
                }
            }

            await new Promise((resolve) => setTimeout(resolve, waitTime));
            waitTime = Math.min(waitTime * 2, maxWaitTime);
        }
    }

    private onUpdate(updateData: Uint8Array, origin: this) {
        if (origin !== this) {
            this.publishUpdate(updateData);

            return;
        }
    }

    private publishUpdate(updateData: Uint8Array) {
        if (!this.node.isStarted()) {
            return;
        }

        console.log('publisihng update');

        this.pubsub.publish(changesTopic(this.topic), updateData);
        const stateV = Y.encodeStateVector(this.ydoc);
        this.stateVectors[this.peerID] = stateV;
        this.pubsub.publish(stateVectorTopic(this.topic), stateV);

        // Publish awareness as well
        this.pubsub.publish(
            awarenessProtocolTopic(this.topic),
            encodeAwarenessUpdate(this.awareness, [this.ydoc.clientID])
        );
    }

    private onPubSubChanges(msg: SignedMessage) {
        console.log('on pubsub changes');
        this.updateYdoc(msg.data);
    }

    private onPubSubStateVector(msg: SignedMessage) {
        this.stateVectors[msg.from.toString()] = msg.data;

        if (!Uint8ArrayEquals(msg.data, this.stateVectors[this.peerID])) {
            // Bookkeep that this peer is out of date
            // console.log("Peer is out of date", msg.from)
            this.queuePeerSync(msg.from.toString());
        }
    }

    private onPubSubAwareness(msg: Message) {
        // console.log("Got awareness update", msg)
        applyAwarenessUpdate(this.awareness, msg.data, this);
    }

    private updateYdoc(updateData: Uint8Array) {
        console.trace('updating doc:', updateData.length);
        this.initialSync = true;
        Y.applyUpdate(this.ydoc, updateData, this);
        console.log(
            'doc after update:',
            this.ydoc.getText('testDoc').toString()
        );
        this.stateVectors[this.peerID] = Y.encodeStateVector(this.ydoc);
    }

    storeStateVector(peerID: string, stateVector: Uint8Array): void {
        this.stateVectors[peerID] = stateVector;
    }

    fetchStateVector(peerID: string): Uint8Array {
        return this.stateVectors[peerID];
    }

    private async runSyncProtocol(
        stream: Stream,
        remotePeer: string,
        initiate: boolean
    ) {
        if (initiate) {
            await stream.sink([
                this.stateVectors[this.peerID],
                Y.encodeStateAsUpdate(this.ydoc, this.stateVectors[remotePeer]),
            ]);
        }

        const [{ value: stateVector }, { value: updateData }] = [
            await stream.source[Symbol.asyncIterator]().next(),
            await stream.source[Symbol.asyncIterator]().next(),
        ];
        this.stateVectors[remotePeer] = stateVector.slice(0);
        console.log('runSyncProtocol');
        this.updateYdoc(updateData.slice(0));

        if (!initiate) {
            await stream.sink([
                Y.encodeStateVector(this.ydoc),
                Y.encodeStateAsUpdate(this.ydoc, this.stateVectors[remotePeer]),
            ]);
        }

        stream.close();
    }

    private async onSyncMsg({
        stream,
        connection,
    }: {
        stream: Stream;
        connection: Connection;
    }) {
        console.log('onSyncMsg');
        await this.runSyncProtocol(
            stream,
            connection.remotePeer.toString(),
            false
        );
    }

    private queuePeerSync(peerID: string) {
        this.unsyncedPeers.add(peerID);
        if (this.aggressivelyKeepPeersUpdated) {
            for (const peerID of this.unsyncedPeers) {
                this.syncPeer(peerID).catch(console.error);
            }
        } else {
            throw new Error('Not implemented');
        }
    }

    private async syncPeer(peerID: string) {
        try {
            const stream = await this.node.dialProtocol(
                peerIdFromString(peerID),
                syncProtocol(this.topic)
            );
            console.log('syncing peer:', stream);
            await this.runSyncProtocol(stream, peerID, true);
            return;
        } catch (e) {
            console.warn(`Failed to sync with ${peerIdFromString(peerID)}`, e);
        }

        throw new Error('Failed to sync with peer');
    }

    private get pubsub(): PubSub {
        return this._pubsub;
    }
}

function Uint8ArrayEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
