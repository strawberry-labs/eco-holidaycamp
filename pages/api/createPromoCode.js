import PromoCode from "../../models/PromoCodeModel";
import dbConnect from "../../utils/dbConnect";

const generateRandomCode = () => {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export default async function handler(req, res) {
  if (req.headers["api_key"] !== process.env.API_KEY) {
    console.log(req.headers["api_key"]);
    console.log(process.env.API_KEY);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  if (req.method === "POST") {
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
      let promoCode = code;
      if (!promoCode) {
        promoCode = generateRandomCode();
        while (await PromoCode.findOne({ code: promoCode })) {
          promoCode = generateRandomCode(); // Ensure the code is unique
        }
      }

      const newPromoCode = new PromoCode({
        code: promoCode,
        description,
        discount,
        discountType,
        type,
        expirationDate,
        isActive,
      });

      await newPromoCode.save();

      return res
        .status(201)
        .json({ message: "Promo code created successfully.", code: promoCode });
    } catch (error) {
      return res.status(500).json({ message: "Server error." });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
