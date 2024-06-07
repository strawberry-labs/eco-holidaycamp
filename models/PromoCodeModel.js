import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  discount: { type: Number, required: true },
  discountType: { type: String, enum: ["percentage", "flat"], required: true },
  type: { type: String, enum: ["one-time", "general"], required: true },
  expirationDate: { type: Date },
  isActive: { type: Boolean, default: true },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
});

export default mongoose.models.PromoCode ||
  mongoose.model("PromoCode", promoCodeSchema);
