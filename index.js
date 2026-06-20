import express from 'express'
import UserRoute from './src/routes/userRouter.js'
import { ConnectDB } from "./src/utilitys/db.js";
import torrentRouter from "./src/routes/torrentRouter.js";

import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

// increase node.js threadpool for faster disk I/O during downloads
process.env.UV_THREADPOOL_SIZE = "16";

const app = express()
ConnectDB();
app.use(express.json())
app.use(cors({
    origin: process.env.origin || 'http://localhost:3000',
    credentials: true
}))

app.get('/', (req, res) => {
    res.send('hiii backend')
})

// serve downloaded files as static
app.use("/files", express.static("downloads"));

// existing routes
app.use('/api', UserRoute)

// torrent routes
app.use('/api/torrent', torrentRouter)

app.listen(process.env.PORT, () => {
    console.log("server runing on port " + process.env.PORT);
})