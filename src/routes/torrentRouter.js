import express from "express";
import {
    addTorrentController,
    getTorrentStatusController,
    getAllTorrentsController,
    removeTorrentController,
    downloadController,
} from "../controllers/torrentController.js";

const router = express.Router();

router.post("/add", addTorrentController);                   // add magnet (paused)
router.get("/list", getAllTorrentsController);                // list all torrents
router.get("/status/:infoHash", getTorrentStatusController); // check progress
router.get("/download/:infoHash", downloadController);       // start + stream to local
router.delete("/:infoHash", removeTorrentController);        // remove torrent

export default router;