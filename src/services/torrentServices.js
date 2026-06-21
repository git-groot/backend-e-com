import path from "path";
import fs from "fs";
import client, { extraTrackers } from "../utilitys/torrentClient.js";

const DOWNLOAD_PATH = path.resolve("downloads");

if (!fs.existsSync(DOWNLOAD_PATH)) {
    fs.mkdirSync(DOWNLOAD_PATH, { recursive: true });
}

const torrentMap = new Map();

// ─── Add Torrent (paused) ─────────────────────────────────
export const addTorrent = (magnetURI) => {
    return new Promise((resolve, reject) => {

        if (!magnetURI || !magnetURI.startsWith("magnet:")) {
            return reject(new Error("Invalid magnet link"));
        }

        const existing = client.torrents.find(
            (t) => magnetURI.includes(t.infoHash)
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
                // pause immediately after adding
                torrent.pause();

                torrentMap.set(torrent.infoHash, {
                    infoHash: torrent.infoHash,
                    name: torrent.name,
                    magnetURI,
                    status: "paused",
                    files: [],
                    addedAt: new Date(),
                });

                torrent.on("done", () => {
                    const files = torrent.files.map((f) => ({
                        name: f.name,
                        size: f.length,
                        path: f.path,
                    }));

                    torrentMap.set(torrent.infoHash, {
                        ...torrentMap.get(torrent.infoHash),
                        status: "completed",
                        files,
                    });

                    console.log(`✅ Done: ${torrent.name}`);
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
                    status: "paused",
                    message: "Torrent added. Click download to start.",
                });
            }
        );
    });
};

// ─── Get Status ───────────────────────────────────────────
export const getTorrentStatus = (infoHash) => {
    const torrent = client.get(infoHash);
    const meta = torrentMap.get(infoHash);

    if (!torrent || !meta) return null;

    return {
        infoHash: torrent.infoHash,
        name: torrent.name,
        status: meta.status,
        progress: parseFloat((torrent.progress * 100).toFixed(2)),
        downloadSpeed: torrent.downloadSpeed,
        uploadSpeed: torrent.uploadSpeed,
        numPeers: torrent.numPeers,
        downloaded: torrent.downloaded,
        totalSize: torrent.length,
        timeRemaining: torrent.timeRemaining,
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

        if (!torrent) return reject(new Error("Torrent not found"));

        client.remove(infoHash, { destroyStore: deleteFiles }, (err) => {
            if (err) return reject(err);
            torrentMap.delete(infoHash);
            resolve({ success: true, deleteFiles });
        });
    });
};

// ─── Download: Start + Stream to Local ───────────────────
export const startAndStreamDownload = (infoHash, res) => {
    return new Promise((resolve, reject) => {
        const torrent = client.get(infoHash);
        const meta = torrentMap.get(infoHash);

        if (!torrent || !meta) {
            return reject(new Error("Torrent not found. Add it first."));
        }

        // ── Case 1: Already fully downloaded → stream immediately ──
        if (torrent.done) {
            const file = torrent.files[0]; // get first file (main file)
            const filePath = path.resolve("downloads", file.path);

            if (!fs.existsSync(filePath)) {
                return reject(new Error("File not found on disk"));
            }

            res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("Content-Length", file.length);

            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            return;
        }

        // ── Case 2: Not downloaded yet → resume + wait for done ──
        torrent.resume();

        torrentMap.set(infoHash, {
            ...meta,
            status: "downloading",
        });

        console.log(`⬇️  Downloading: ${torrent.name}`);

        torrent.on("done", () => {
            const files = torrent.files.map((f) => ({
                name: f.name,
                size: f.length,
                path: f.path,
            }));

            torrentMap.set(infoHash, {
                ...torrentMap.get(infoHash),
                status: "completed",
                files,
            });

            // stream file to user after download completes
            const file = torrent.files[0];
            const filePath = path.resolve("downloads", file.path);

            res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("Content-Length", file.length);

            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        });
    });
};