import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import { app, config } from "./src/app.js";

dotenv.config({
  path: "./env",
});

Object.entries(config).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});
console.log(222);

connectDB()
  .then(() => {
    app.listen(3030 || 3030, () => {
      console.log(`Server started on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Mongo DB connection failed!!! ${err}`);
  });
