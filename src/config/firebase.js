import admin from "firebase-admin";

const serviceAccount =
   typeof process.env.FIREBASE_CONFIG === "string"
     ? JSON.parse(process.env.FIREBASE_CONFIG)
     : process.env.FIREBASE_CONFIG;



const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export { firebaseAdmin };
