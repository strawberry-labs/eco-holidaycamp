import CryptoJS from "crypto-js";
import dbConnect from "../../utils/dbConnect"; // Ensure this utility is correctly set up
import Order from "../../models/OrderModel"; // Include the Order model
import Attendee from "../../models/AttendeeModel"; // Include the Attendee model
import { sendBookingPendingEmail } from "../../utils/sendEmail";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      // Extract data from request body
      const { orderAmount, orderDetails, forms: attendees } = req.body;

      // Create attendees in the database
      const createdAttendees = await Attendee.insertMany(attendees);
      const attendeeIds = createdAttendees.map((attendee) => attendee._id);

      // Determine the order status based on the day of the week
      const dayOfWeek = new Date().getDay();
      const status =
        dayOfWeek === 6 || dayOfWeek === 0 ? "WAITLIST" : "PENDING_PAYMENT";

      // Create the order in the database
      const newOrder = await new Order({
        ...orderDetails,
        attendees: attendeeIds,
        status: status,
      }).save();

      // Use the MongoDB order ID for the transaction
      const orderNumber = newOrder._id.toString();
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
          // Send redirect URL back to client
          res.status(200).json({ redirect_url: jsonResponse.redirect_url });
        } else {
          res
            .status(apiResponse.status)
            .json({ error: "Failed to process payment" });
        }
      } else {
        res.status(200).json({ redirect_url: "http://locahost:3000/waitlist" });
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
