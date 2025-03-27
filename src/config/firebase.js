import admin from "firebase-admin";
import fs from "fs";
import { loadConfig } from "./loadConfig";

const config = loadConfig();

let serviceAccount;
if (process.env.NODE_ENV === "development") {
  serviceAccount = JSON.parse(fs.readFileSync("./src/config/sericeAccountJSON.json"));
} else {
  serviceAccount =
    typeof config.FIREBASE_CONFIG === "string"
      ? JSON.parse(config.FIREBASE_CONFIG)
      : config.FIREBASE_CONFIG;
}

const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export { firebaseAdmin };
