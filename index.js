import express from 'express'
import UserRoute from './src/routes/userRouter.js'
import { ConnectDB } from "./src/utilitys/db.js";

import dotenv from "dotenv";
import cors from "cors";
dotenv.config();


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

app.use('/api', UserRoute)

app.listen(process.env.PORT, () => {
    console.log("server runing on port " + process.env.PORT);
})