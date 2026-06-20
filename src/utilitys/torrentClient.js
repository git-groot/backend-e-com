

import WebTorrent from "webtorrent";

// Extra trackers for faster downloads
const extraTrackers = [
    "udp://tracker.opentrackr.org:1337/announce",
    "udp://open.tracker.cl:1337/announce",
    "udp://tracker.openbittorrent.com:6969/announce",
    "udp://tracker.leechers-paradise.org:6969/announce",
    "wss://tracker.btorrent.xyz",
    "wss://tracker.openwebtorrent.com",
];

// ONE client for entire server lifetime
const client = new WebTorrent({
    maxConns: 100,       // more connections = faster
    downloadLimit: -1,   // unlimited download speed
    uploadLimit: -1,     // unlimited upload = attracts more peers
    dht: true,           // peer discovery
});

client.on("error", (err) => {
    console.error("WebTorrent client error:", err.message);
});

export { extraTrackers };
export default client;