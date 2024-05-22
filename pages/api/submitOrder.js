// pages/api/submitOrder.js

import CryptoJS from "crypto-js";

export default async function handler(req, res) {
  console.log(process.env.TOTALPAY_KEY);
  console.log(process.env.TOTALPAY_SECRET);

  if (req.method === "POST") {
    try {
      // Extract data from request body
      const { orderAmount } = req.body;

      // Generate GUID
      const orderNumber = generateGUID();
      const formattedAmount = parseFloat(orderAmount).toFixed(2);
      const orderCurrency = "AED";
      const orderDescription = "test";

      // Compute the hash
      const toMD5 =
        orderNumber +
        formattedAmount +
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
          amount: formattedAmount,
          currency: orderCurrency,
          description: orderDescription,
        },
        cancel_url: "http://localhost:3000/cancel",
        success_url: "http://localhost:3000/success",
        customer: {
          name: "John Doe",
          email: "test@email.com",
        },
        billing_address: {
          country: "US",
          state: "CA",
          city: "Los Angeles",
          address: "Moor Building 35274",
          zip: "123456",
          phone: "347771112233",
        },
        recurring_init: "true",
        hash: hash,
      });
      console.log(body);

      // Make the API request
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
        // Send redirect URL back to client
        res.status(200).json({ redirect_url: jsonResponse.redirect_url });
      } else {
        res
          .status(apiResponse.status)
          .json({ error: "Failed to process payment" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    // Handle any other HTTP method
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function generateGUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
