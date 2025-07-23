import mongoose from "mongoose";

const virtualEventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      unique: true,
    },
    eventDescription: {
      type: String,
      required: false,
    },
    eventLocation: {
      type: String,
      required: true,
    },
    eventStartDate: {
      type: Date,
      required: true,
    },
    eventEndDate: {
      type: Date,
      required: true,
    },
    eventTimeStart: {
      type: String,
      required: true,
    },
    eventTimeEnd: {
      type: String,
      required: true,
    },
    eventImage: {
      type: String,
      required: false,
    },
    ticketPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    noOfSlots: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const VirtualEvent = mongoose.model("VirtualEvent", virtualEventSchema);
export default VirtualEvent;
