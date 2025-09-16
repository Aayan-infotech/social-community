// Import required modules
import { nanoid } from "nanoid";
import { User } from "../models/user.model.js";
import { ApiError } from "./ApiError.js";
import QRCode from "qrcode";
import Order from "../models/orders.model.js";
import EventLoginUser from "../models/eventLoginUser.model.js";

const generateReferralCode = async function (name) {
  if (!name) {
    throw new Error("Name is required to generate referral code");
  }

  let referralCode;
  let exists = true;
  const firstName = name.split(" ")[0].toLowerCase();

  while (exists) {
    referralCode = firstName + nanoid(5);
    exists = await User.exists({ referralCode });
  }

  return referralCode;
};

const generateUniqueUserId = async () => {
  let lastUser = await User.findOne({}, { userId: 1 }).sort({ createdAt: -1 });

  let lastNumber = lastUser ? parseInt(lastUser.userId.split("-")[1]) : 1000;
  let newNumber = (lastNumber + 1) % 10000;
  if (newNumber < 1001) newNumber = 1001;

  let formattedId = `user-${String(newNumber).padStart(5, "0")}`;
  return formattedId;
};


const handleReferral = async (referralCode, newUserId) => {
  console.error("handleReferral", referralCode, newUserId);
  const referrer = await User.findOne({ referralCode });
  console.error(referrer);
  if (!referrer) {
    throw new ApiError(400, "Invalid referral code");
  }

  await User.updateOne(
    { userId: referrer.userId },
    { $push: { referrals: newUserId } }
  );

  return referrer.userId;
};

function getRelatedRelation(baseRelation, gender) {
  const relationMap = {
    father: { male: "son", female: "daughter" },
    mother: { male: "son", female: "daughter" },
    son: { male: "father", female: "mother" },
    daughter: { male: "father", female: "mother" },
    grandfather: { male: "grandson", female: "granddaughter" },
    grandmother: { male: "grandson", female: "granddaughter" },
    grandson: { male: "grandfather", female: "grandmother" },
    granddaughter: { male: "grandfather", female: "grandmother" },
    uncle: { male: "nephew", female: "niece" },
    aunt: { male: "nephew", female: "niece" },
    nephew: { male: "uncle", female: "aunt" },
    niece: { male: "uncle", female: "aunt" },
    brother: { male: "brother", female: "sister" },
    sister: { male: "brother", female: "sister" },
    husband: { male: "wife", female: "wife" },
    wife: { male: "husband", female: "husband" },
    cousin_brother: { male: "cousin_brother", female: "cousin_sister" },
    cousin_sister: { male: "cousin_brother", female: "cousin_sister" },
    great_grandfather: {
      male: "great_grandson",
      female: "great_granddaughter",
    },
    great_grandmother: {
      male: "great_grandson",
      female: "great_granddaughter",
    },
    great_great_grandfather: {
      male: "great_great_grandson",
      female: "great_great_granddaughter",
    },
    great_great_grandmother: {
      male: "great_great_grandson",
      female: "great_great_granddaughter",
    },
    great_uncle: { male: "grandnephew", female: "grandniece" },
    great_aunt: { male: "grandnephew", female: "grandniece" },
  };

  const relation = relationMap[baseRelation.toLowerCase()];
  if (!relation) {
    return "Unknown relation";
  }

  return relation[gender.toLowerCase()] || "Unknown gender";
}

const getHierarchyLevel = (relation) => {
  const hierarchy = {
    "great great grandfather": 1,
    "great great grandmother": 1,
    "great grandfather": 2,
    "great grandmother": 2,
    grandfather: 3,
    grandmother: 3,
    "great uncle": 4,
    "great aunt": 4,
    father: 5,
    mother: 5,
    uncle: 6,
    aunt: 6,
    self: 7,
    husband: 7,
    wife: 7,
    brother: 7,
    sister: 7,
    "cousin brother": 7,
    "cousin sister": 7,
    son: 8,
    daughter: 8,
    nephew: 8,
    niece: 8,
    grandson: 9,
    granddaughter: 9,
    "great grandson": 10,
    "great granddaughter": 10,
  };

  return hierarchy[relation] || null;
};


// Generate unique ticket ID
function generateTicketId() {
  return 'TKT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

async function generateQRCodeData(data) {
  const dataURL = await QRCode.toDataURL(data);
  return dataURL;
}

function convertTo12Hour(time24) {
  const [hour, minute] = time24.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute);

  const options = { hour: 'numeric', minute: '2-digit', hour12: true };
  return date.toLocaleTimeString('en-US', options);
}

function generateUniqueOrderId() {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const nanoidPart = nanoid(5).toUpperCase();

  // check if the generated order ID already exists in the database
  Order.findOne({ orderId: `ORDER_${timestamp}${randomPart}${nanoidPart}` })
    .then(existingOrder => {
      if (existingOrder) {
        return generateUniqueOrderId();
      }
    });

  return `ORDER_${timestamp}${randomPart}${nanoidPart}`;
}


const changeDateTimeZone = (date, timezone) => {
  if (!date || !timezone) {
    throw new Error("Date and timezone are required");
  }
  const options = { timeZone: timezone, hour12: false };
  return new Date(date.toLocaleString("en-US", options));
}

const generateUniqueUsername = async () => {
  let lastUser = await EventLoginUser.findOne({}, { username: 1 }).sort({ createdAt: -1 });
  let lastNumber = lastUser ? parseInt(lastUser.username.split("EventUser")[1]) : 0;
  let newNumber = (lastNumber + 1) % 10000;
  let formattedId = `EventUser${String(newNumber).padStart(5, "0")}`;
  return formattedId;
};

async function generateRandomPassword(length = 12) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:<>?";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  return password;
}

function currentDateTime(timezone) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === "year").value;
  const month = parts.find(p => p.type === "month").value;
  const day = parts.find(p => p.type === "day").value;
  const hour = parts.find(p => p.type === "hour").value;
  const minute = parts.find(p => p.type === "minute").value;
  const second = parts.find(p => p.type === "second").value;

  // build ISO string in UTC
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
}


export {
  generateReferralCode,
  generateUniqueUserId,
  handleReferral,
  getRelatedRelation,
  getHierarchyLevel,
  generateTicketId,
  generateQRCodeData,
  convertTo12Hour,
  generateUniqueOrderId,
  changeDateTimeZone,
  generateUniqueUsername,
  generateRandomPassword,
  currentDateTime
};
