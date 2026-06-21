import path from "path";
import fs from "fs";
import client, { extraTrackers } from "../utilitys/torrentClient.js";

const DOWNLOAD_PATH = path.resolve("downloads");

if (!fs.existsSync(DOWNLOAD_PATH)) {
    fs.mkdirSync(DOWNLOAD_PATH, { recursive: true });
}

// stores ALL torrents (queued, downloading, completed)
const torrentMap = new Map();

// ─── Add to List Only (no download) ──────────────────────
export const addTorrent = (magnetURI) => {
    return new Promise((resolve, reject) => {

        if (!magnetURI || !magnetURI.startsWith("magnet:")) {
            return reject(new Error("Invalid magnet link"));
        }

        // extract infoHash from magnet link
        const infoHashMatch = magnetURI.match(/urn:btih:([a-fA-F0-9]{40})/i);
        if (!infoHashMatch) {
            return reject(new Error("Invalid magnet link - no infoHash found"));
        }

        const infoHash = infoHashMatch[1].toLowerCase();

        // check already in list
        if (torrentMap.has(infoHash)) {
            return reject(new Error("Torrent already in list"));
        }

        // extract name from magnet link
        const nameMatch = magnetURI.match(/dn=([^&]+)/);
        const name = nameMatch
            ? decodeURIComponent(nameMatch[1].replace(/\+/g, " "))
            : "Unknown Torrent";

        // just save in map — no webtorrent yet
        torrentMap.set(infoHash, {
            infoHash,
            name,
            magnetURI,
            status: "queued",      // ← queued means added but not downloading
            progress: 0,
            downloadSpeed: 0,
            uploadSpeed: 0,
            numPeers: 0,
            downloaded: 0,
            totalSize: 0,
            timeRemaining: 0,
            done: false,
            files: [],
            addedAt: new Date(),
        });

        resolve({
            infoHash,
            name,
            status: "queued",
            message: "Added to list. Click Download when you want the file.",
        });
    });
};

// ─── Get All Torrents ─────────────────────────────────────
export const getAllTorrents = () => {
    const result = [];

    for (const [infoHash, meta] of torrentMap) {
        // if actively downloading, get live stats from webtorrent
        const torrent = client.get(infoHash);

        if (torrent && !torrent.done) {
            // update map with live stats
            torrentMap.set(infoHash, {
                ...meta,
                status: "downloading",
                progress: parseFloat((torrent.progress * 100).toFixed(2)),
                downloadSpeed: torrent.downloadSpeed,
                uploadSpeed: torrent.uploadSpeed,
                numPeers: torrent.numPeers,
                downloaded: torrent.downloaded,
                totalSize: torrent.length,
                timeRemaining: torrent.timeRemaining,
            });

            result.push(torrentMap.get(infoHash));
        } else {
            result.push(meta);
        }
    }

    return result;
};

// ─── Get Status of One ────────────────────────────────────
export const getTorrentStatus = (infoHash) => {
    const meta = torrentMap.get(infoHash);
    if (!meta) return null;

    const torrent = client.get(infoHash);

    if (torrent) {
        return {
            ...meta,
            progress: parseFloat((torrent.progress * 100).toFixed(2)),
            downloadSpeed: torrent.downloadSpeed,
            numPeers: torrent.numPeers,
            downloaded: torrent.downloaded,
            totalSize: torrent.length,
            timeRemaining: torrent.timeRemaining,
            done: torrent.done,
        };
    }

    return meta;
};

// ─── Download: Start + Stream to Local ───────────────────
export const startAndStreamDownload = (infoHash, res) => {
    return new Promise((resolve, reject) => {
        const meta = torrentMap.get(infoHash);

        if (!meta) {
            return reject(new Error("Torrent not found. Add it first."));
        }

        // ── Already completed → stream immediately ──
        if (meta.status === "completed" && meta.files.length > 0) {
            const file = meta.files[0];
            const filePath = path.resolve("downloads", file.path);

            if (!fs.existsSync(filePath)) {
                return reject(new Error("File not found on disk"));
            }

            res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("Content-Length", file.size);

            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            return;
        }

        // ── Already downloading → wait for done ──
        if (meta.status === "downloading") {
            const torrent = client.get(infoHash);
            if (torrent) {
                torrent.on("done", () => streamFile(torrent, infoHash, res));
                return;
            }
        }

        // ── Queued → NOW start downloading via webtorrent ──
        torrentMap.set(infoHash, { ...meta, status: "downloading" });

        client.add(
            meta.magnetURI,
            {
                path: DOWNLOAD_PATH,
                announce: extraTrackers,
            },
            (torrent) => {
                console.log(`⬇️ Started: ${torrent.name}`);

                torrent.on("done", () => {
                    streamFile(torrent, infoHash, res);
                });

                torrent.on("error", (err) => {
                    torrentMap.set(infoHash, {
                        ...torrentMap.get(infoHash),
                        status: "error",
                        error: err.message,
                    });
                    reject(err);
                });
            }
        );
    });
};

// ─── Helper: Stream file to browser ──────────────────────
const streamFile = (torrent, infoHash, res) => {
    const file = torrent.files[0];
    const filePath = path.resolve("downloads", file.path);

    const files = torrent.files.map((f) => ({
        name: f.name,
        size: f.length,
        path: f.path,
    }));

    torrentMap.set(infoHash, {
        ...torrentMap.get(infoHash),
        status: "completed",
        progress: 100,
        done: true,
        files,
    });

    console.log(`✅ Streaming to client: ${file.name}`);

    res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", file.length);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
};

// ─── Remove Torrent ───────────────────────────────────────
export const removeTorrent = (infoHash, deleteFiles = false) => {
    return new Promise((resolve, reject) => {
        const meta = torrentMap.get(infoHash);
        if (!meta) return reject(new Error("Torrent not found"));

        const torrent = client.get(infoHash);

        if (torrent) {
            // actively downloading → remove from webtorrent too
            client.remove(infoHash, { destroyStore: deleteFiles }, (err) => {
                if (err) return reject(err);
                torrentMap.delete(infoHash);
                resolve({ success: true });
            });
        } else {
            // just queued → remove from map only
            torrentMap.delete(infoHash);
            resolve({ success: true });
        }
    });
};