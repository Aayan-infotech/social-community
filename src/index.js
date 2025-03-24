import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app, config } from "./app.js";

dotenv.config({
  path: "./env",
});

Object.entries(config).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server started on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Mongo DB connection failed!!! ${err}`);
  });
