
import path from "path";
import fs from "fs";
import client, { extraTrackers } from "../utilitys/torrentClient.js";

// downloads folder at root level
const DOWNLOAD_PATH = path.resolve("downloads");

// make sure downloads folder exists
if (!fs.existsSync(DOWNLOAD_PATH)) {
    fs.mkdirSync(DOWNLOAD_PATH, { recursive: true });
}

// in-memory store of all torrents
// { infoHash: { infoHash, name, status, files, addedAt } }
const torrentMap = new Map();

// ─── Add Torrent ──────────────────────────────────────────
export const addTorrent = (magnetURI) => {
    return new Promise((resolve, reject) => {

        // validate magnet link
        if (!magnetURI || !magnetURI.startsWith("magnet:")) {
            return reject(new Error("Invalid magnet link"));
        }

        // check if already added
        const existing = client.torrents.find(
            (t) => t.magnetURI === magnetURI || magnetURI.includes(t.infoHash)
        );
        if (existing) {
            return reject(new Error("Torrent already added"));
        }

        client.add(
            magnetURI,
            {
                path: DOWNLOAD_PATH,
                announce: extraTrackers,
            },
            (torrent) => {
                // save to map
                torrentMap.set(torrent.infoHash, {
                    infoHash: torrent.infoHash,
                    name: torrent.name,
                    status: "downloading",
                    files: [],
                    addedAt: new Date(),
                });

                // when download completes
                torrent.on("done", () => {
                    const files = torrent.files.map((f) => ({
                        name: f.name,
                        size: f.length,
                        downloadUrl: `/files/${encodeURIComponent(f.path)}`,
                    }));

                    torrentMap.set(torrent.infoHash, {
                        ...torrentMap.get(torrent.infoHash),
                        status: "seeding",
                        files,
                    });

                    console.log(`✅ Torrent done: ${torrent.name}`);
                });

                torrent.on("error", (err) => {
                    torrentMap.set(torrent.infoHash, {
                        ...torrentMap.get(torrent.infoHash),
                        status: "error",
                        error: err.message,
                    });
                });

                resolve({
                    infoHash: torrent.infoHash,
                    name: torrent.name,
                    status: "downloading",
                });
            }
        );
    });
};

// ─── Get Status of One Torrent ────────────────────────────
export const getTorrentStatus = (infoHash) => {
    const torrent = client.get(infoHash);
    const meta = torrentMap.get(infoHash);

    if (!torrent || !meta) {
        return null;
    }

    return {
        infoHash: torrent.infoHash,
        name: torrent.name,
        status: meta.status,
        progress: parseFloat((torrent.progress * 100).toFixed(2)),  // 0 to 100
        downloadSpeed: torrent.downloadSpeed,   // bytes/sec
        uploadSpeed: torrent.uploadSpeed,       // bytes/sec
        numPeers: torrent.numPeers,
        downloaded: torrent.downloaded,         // bytes downloaded
        totalSize: torrent.length,              // total bytes
        timeRemaining: torrent.timeRemaining,   // ms remaining
        done: torrent.done,
        files: meta.files,
        addedAt: meta.addedAt,
    };
};

// ─── Get All Torrents ─────────────────────────────────────
export const getAllTorrents = () => {
    return client.torrents.map((torrent) => {
        const meta = torrentMap.get(torrent.infoHash);
        return {
            infoHash: torrent.infoHash,
            name: torrent.name,
            status: meta?.status || "unknown",
            progress: parseFloat((torrent.progress * 100).toFixed(2)),
            downloadSpeed: torrent.downloadSpeed,
            numPeers: torrent.numPeers,
            done: torrent.done,
            addedAt: meta?.addedAt,
        };
    });
};

// ─── Remove Torrent ───────────────────────────────────────
export const removeTorrent = (infoHash, deleteFiles = false) => {
    return new Promise((resolve, reject) => {
        const torrent = client.get(infoHash);

        if (!torrent) {
            return reject(new Error("Torrent not found"));
        }

        client.remove(infoHash, { destroyStore: deleteFiles }, (err) => {
            if (err) return reject(err);
            torrentMap.delete(infoHash);
            resolve({ success: true, deleteFiles });
        });
    });
};