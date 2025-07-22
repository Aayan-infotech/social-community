import { loadConfig } from "./src/config/loadConfig.js";
import dotenv from "dotenv";


dotenv.config({
  path: "./env",
});

const init = async () => {
  const config = await loadConfig();

  Object.entries(config).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

await init();
