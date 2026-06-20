
import express from "express";
import {
    addTorrentController,
    getTorrentStatusController,
    getAllTorrentsController,
    removeTorrentController,
} from "../controllers/torrentController.js";

const router = express.Router();

router.post("/add", addTorrentController);           // add magnet link
router.get("/list", getAllTorrentsController);        // list all torrents
router.get("/status/:infoHash", getTorrentStatusController); // one torrent status
router.delete("/:infoHash", removeTorrentController); // remove torrent

export default router;