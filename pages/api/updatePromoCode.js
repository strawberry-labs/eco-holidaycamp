import PromoCode from "../../models/PromoCodeModel";
import dbConnect from "../../utils/dbConnect";

export default async function handler(req, res) {
  if (req.headers["api_key"] !== process.env.API_KEY) {
    console.log(req.headers["api_key"]);
    console.log(process.env.API_KEY);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  if (req.method === "PUT") {
    const {
      code,
      description,
      discount,
      discountType,
      type,
      expirationDate,
      isActive,
    } = req.body;

    await dbConnect();

    try {
      const promoCode = await PromoCode.findOne({ code });

      if (!promoCode) {
        return res.status(404).json({ message: "Promo code not found." });
      }

      promoCode.description = description || promoCode.description;
      promoCode.discount = discount || promoCode.discount;
      promoCode.discountType = discountType || promoCode.discountType;
      promoCode.type = type || promoCode.type;
      promoCode.expirationDate = expirationDate || promoCode.expirationDate;
      promoCode.isActive =
        isActive !== undefined ? isActive : promoCode.isActive;

      await promoCode.save();

      return res
        .status(200)
        .json({ message: "Promo code updated successfully." });
    } catch (error) {
      return res.status(500).json({ message: "Server error." });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
