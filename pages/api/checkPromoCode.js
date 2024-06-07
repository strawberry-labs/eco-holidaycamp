import PromoCode from "../../models/PromoCodeModel";
import dbConnect from "../../utils/dbConnect";
import { applyRateLimiter } from "../../utils/rateLimit";

export default async function handler(req, res) {
  try {
    await applyRateLimiter(req, res, async () => {
      if (req.method === "POST") {
        const { code, orderId } = req.body;

        await dbConnect();

        try {
          const promoCode = await PromoCode.findOne({ code });

          if (!promoCode || !promoCode.isActive) {
            return res
              .status(400)
              .json({ message: "Invalid or inactive promo code." });
          }

          if (
            promoCode.expirationDate &&
            promoCode.expirationDate < new Date()
          ) {
            return res.status(400).json({ message: "Promo code has expired." });
          }

          if (promoCode.type === "one-time" && promoCode.usedBy.length > 0) {
            return res
              .status(400)
              .json({ message: "Promo code has already been used." });
          }

          return res.json({
            message: "Promo code is valid.",
            discount: promoCode.discount,
            discountType: promoCode.discountType,
          });
        } catch (error) {
          return res.status(500).json({ message: "Server error." });
        }
      } else {
        return res.status(405).json({ message: "Method not allowed" });
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(429).json({ message: error.message });
    } else {
      return res.status(500).json({ message: "Server error." });
    }
  }
}
