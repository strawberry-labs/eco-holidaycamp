import mongoose from "mongoose";
import "./AttendeeModel";

const orderSchema = new mongoose.Schema({
  location: String,
  email: String,
  emergencyContact1Name: String,
  emergencyContact1Phone: String,
  emergencyContact2Name: String,
  emergencyContact2Phone: String,
  termsAndConditions: Boolean,
  orderConfirmation: Boolean,
  bookingConfirmation: Boolean,
  status: {
    type: String,
    enum: ["WAITLIST", "PENDING_PAYMENT", "PAID"],
    default: "PENDING_PAYMENT",
  },
  createdTime: { type: Date, default: Date.now },
  lastModifiedTime: { type: Date, default: Date.now },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attendee" }],
  promoCode: { type: String, default: null },
  discount: { type: Number, default: null },
  discountType: { type: String, enum: ["percentage", "flat"], default: null },
  notes: { type: String, default: null }
});

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
