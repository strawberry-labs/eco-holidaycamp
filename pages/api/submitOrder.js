import CryptoJS from "crypto-js";
import dbConnect from "../../utils/dbConnect"; // Ensure this utility is correctly set up
import Order from "../../models/OrderModel"; // Include the Order model
import Attendee from "../../models/AttendeeModel"; // Include the Attendee model
import PromoCode from "../../models/PromoCodeModel"; // Include the PromoCode model
import { sendBookingPendingEmail } from "../../utils/sendEmail";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      // Extract data from request body
      const {
        orderDetails,
        forms: attendees,
        promoCode: providedPromoCode,
      } = req.body;

      let discount = 0;
      let discountType = "";
      let promoCode;

      // Validate promo code if provided
      if (providedPromoCode) {
        promoCode = await PromoCode.findOne({ code: providedPromoCode });

        if (!promoCode || !promoCode.isActive) {
          return res
            .status(400)
            .json({ message: "Invalid or inactive promo code." });
        }

        if (promoCode.expirationDate && promoCode.expirationDate < new Date()) {
          return res.status(400).json({ message: "Promo code has expired." });
        }

        if (promoCode.type === "one-time" && promoCode.usedBy.length > 0) {
          return res
            .status(400)
            .json({ message: "Promo code has already been used." });
        }

        discount = promoCode.discount;
        discountType = promoCode.discountType;
      }

      // Calculate the order amount from the forms
      const orderAmount = attendees.reduce(
        (total, form) => total + form.priceDetails.price,
        0
      );

      // Calculate final order amount with discount if applicable
      let finalAmount = orderAmount;
      if (discountType === "percentage") {
        finalAmount = orderAmount - (orderAmount * discount) / 100;
      } else if (discountType === "flat") {
        finalAmount = orderAmount - discount;
      }
      finalAmount = parseFloat(finalAmount).toFixed(2);

      // Create attendees in the database
      const createdAttendees = await Attendee.insertMany(attendees);
      const attendeeIds = createdAttendees.map((attendee) => attendee._id);

      // Determine the order status based on the day of the week
      const dayOfWeek = new Date().getDay();
      const status = attendees.some((attendee, idx) => parseInt(attendee.ageGroup) >= 7) ? "WAITLIST" : "PENDING_PAYMENT";
      // dayOfWeek === 6 || dayOfWeek === 0 ? "WAITLIST" : "PENDING_PAYMENT";
      //attendees.every((attendee, idx) => parseInt(attendee.ageGroup) >= 7) ? "WAITLIST" : "PENDING_PAYMENT"

      // Create the order in the database
      const newOrder = await new Order({
        ...orderDetails,
        attendees: attendeeIds,
        status: status,
        promoCode: providedPromoCode ? providedPromoCode : null,
        discount: discount ? discount : null,
        discountType: discountType ? discountType : null,
      }).save();

      // Use the MongoDB order ID for the transaction
      const orderNumber = newOrder._id.toString();
      const orderCurrency = "AED";
      const orderDescription = newOrder.location;

      const nameForPG = processName(orderDetails.emergencyContact1Name);

      // Compute the hash
      const toMD5 =
        orderNumber +
        finalAmount +
        orderCurrency +
        orderDescription +
        process.env.TOTALPAY_SECRET;
      const hash = CryptoJS.SHA1(
        CryptoJS.MD5(toMD5.toUpperCase()).toString()
      ).toString(CryptoJS.enc.Hex);

      // Construct the request body for the external API
      const body = JSON.stringify({
        merchant_key: process.env.TOTALPAY_KEY,
        operation: "purchase",
        methods: ["card"],
        order: {
          number: orderNumber,
          amount: finalAmount,
          currency: orderCurrency,
          description: orderDescription,
        },
        cancel_url: `${process.env.PUBLIC_BASE_URL}/cancel`,
        success_url: `${process.env.PUBLIC_BASE_URL}/success?orderId=${orderNumber}`,
        customer: {
          name: nameForPG,
          email: orderDetails.email,
        },
        billing_address: {
          country: "AE",
          state: "Dubai",
          city: "Dubai",
          address: "Dubai",
          zip: "000000",
          phone: orderDetails.emergencyContact1Phone,
        },
        recurring_init: "true",
        hash: hash,
      });

      console.log(body);
      if (status == "PENDING_PAYMENT") {
        // Make the API request to the payment gateway
        const apiResponse = await fetch(
          "https://checkout.totalpay.global/api/v1/session",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body,
          }
        );

        if (apiResponse.ok) {
          const jsonResponse = await apiResponse.json();
          await sendBookingPendingEmail(
            orderDetails.email,
            orderNumber,
            jsonResponse.redirect_url
          );

          // Update promo code usage if valid
          if (promoCode) {
            promoCode.usedBy.push(newOrder._id);
            await promoCode.save();
          }

          // Send redirect URL back to client
          res.status(200).json({ redirect_url: jsonResponse.redirect_url });
        } else {
          console.log(res.json());
          res
            .status(apiResponse.status)
            .json({ error: "Failed to process payment" });
        }
      } else {
        res
          .status(200)
          .json({ redirect_url: `${process.env.PUBLIC_BASE_URL}/waitlist` });
      }
    } catch (error) {
      let aux = error.stack.split("\n");
      aux.splice(0, 2); //removing the line that we force to generate the error (var err = new Error();) from the message
      aux = aux.join('\n"');
      res.status(500).json({ error: error.message, details: aux });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function processName(name) {
  // Remove any special characters except spaces
  let cleanName = name.replace(/[^a-zA-Z\s]/g, "");

  // Return the first two words joined by a space, or the whole clean name if it has less than 2 words
  return cleanName;
}
