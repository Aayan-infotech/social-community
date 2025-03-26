// 1. Import the admin SDK and the sendPushNotification function.
import { firebaseAdmin } from "../config/firebase.js";

// Send push notification
const sendPushNotification = async (deviceToken, title, body, data = {}) => {
  const message = {
    token: deviceToken,
    notification: {
      title,
      body,
    },
  };



  try {
    const response = await firebaseAdmin.messaging().send(message);

    console.log("Successfully sent message:", response);
    return response;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export default sendPushNotification;
