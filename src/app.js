import express from "express"
import cors from 'cors'
import cookieParser from "cookie-parser";
import routes from './routes/index.js';
import errorHandler from "./middlewares/errorhandler.middleware.js";
import { loadConfig } from "./config/loadConfig.js";

const app = express();

const config = await loadConfig();




app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "10kb" }))
app.use(express.urlencoded({ extended: true, limit: "10kb" }))
app.use(express.static("public"))
app.use(cookieParser())


app.use(errorHandler);


console.log(111);

app.use("/api/",routes);
app.get('/', (req, res, next) => res.end("Hello world"));



export { app , config }