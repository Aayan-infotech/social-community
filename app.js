import express from 'express';
// import cors from 'cors';
import {loadConfig} from './config/loadConfig.js';
import connectToDatabase from './config/db.js';
import {logger} from "./utils/logger.js";
import routes from './routes/index.js';

const startServer = async () => {
    try {
        const config = await loadConfig();
        console.log("config",config);
        const app = express();
        
        // const corsOptions={
        //     // origin: ['*'],
        //     origin:'*'
        // }

        // app.use(cors(corsOptions));
        app.use(express.json());

        await connectToDatabase(config.DB_URI);

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