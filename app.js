import express from 'express';
import passport from "passport";
import cors from 'cors';
import session from 'express-session';
import { loadConfig } from './config/loadConfig.js';
import connectToDatabase from './config/db.js';
import { logger } from "./utils/logger.js";
import routes from './routes/index.js';
import "./config/passport.js";

const startServer = async () => {
    try {
        const config = await loadConfig();
        const app = express();

        const corsOptions = {
            // origin: ['*'],
            origin: '*',
            credentials: true
        }

        app.use(cors(corsOptions));
        app.use(express.json());

        app.use(session({
            secret: config.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: { secure: false }
        }));

        app.use(passport.initialize());
        app.use(passport.session());

        await connectToDatabase('mongodb+srv://ujjwalsingh:ujjwal123@cluster0.qbl1z.mongodb.net/social-community');

        app.use('/', routes);

        const PORT = config.PORT || 3030;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error) {
        logger.error(`Server failed to start: ${error.message}`);
    }

};

startServer();