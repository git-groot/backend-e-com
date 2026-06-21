import {
    addTorrent,
    getTorrentStatus,
    getAllTorrents,
    removeTorrent,
    startAndStreamDownload,
} from "../services/torrentServices.js";

// POST /api/torrent/add
export const addTorrentController = async (req, res) => {
    try {
        const { magnetURI } = req.body;
        if (!magnetURI) {
            return res.status(400).json({ success: false, message: "magnetURI is required" });
        }
        const result = await addTorrent(magnetURI);
        return res.status(201).json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// GET /api/torrent/status/:infoHash
export const getTorrentStatusController = async (req, res) => {
    try {
        const { infoHash } = req.params;
        const result = getTorrentStatus(infoHash);
        if (!result) {
            return res.status(404).json({ success: false, message: "Torrent not found" });
        }
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/torrent/list
export const getAllTorrentsController = async (req, res) => {
    try {
        const result = getAllTorrents();
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/torrent/:infoHash
export const removeTorrentController = async (req, res) => {
    try {
        const { infoHash } = req.params;
        const { deleteFiles } = req.query;
        const result = await removeTorrent(infoHash, deleteFiles === "true");
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }
};

// GET /api/torrent/download/:infoHash  ← MERGED API
export const downloadController = async (req, res) => {
    try {
        const { infoHash } = req.params;
        await startAndStreamDownload(infoHash, res);
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};