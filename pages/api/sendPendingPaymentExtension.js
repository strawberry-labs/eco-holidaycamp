import dbConnect from "../../utils/dbConnect";
import { sendBookingPendingEmail } from "../../utils/sendEmail";
import Order from "../../models/OrderModel"; // Update path as necessary
import CryptoJS from "crypto-js";

export default async function handler(req, res) {
  await dbConnect();
  try {
    const apiKey = req.headers["api_key"];
    const { orderId, price } = req.query;

    if (req.method === "POST" && apiKey == process.env.API_KEY) {
      const orderCurrency = "AED";

      const order = await Order.findById(orderId).populate("attendees");
      if (!order) {
        console.log("Order not found");
        return;
      }

      console.log(order);
      // Store order details in a variable
      let orderDetails = {
        id: order._id,
        location: order.location,
        email: order.email,
        status: order.status,
        attendees: [],
      };

      // Iterate over attendees to calculate prices
      let totalOrderPrice = price;
      order.attendees.forEach((attendee) => {
        let attendeeDetails = {
          firstName: attendee.firstName,
          lastName: attendee.lastName,
          program: attendee.program,
          weeks: attendee.weeks,
          priceDetails: attendee.priceDetails,
        };

        // Add detailed attendee info to order details
        orderDetails.attendees.push(attendeeDetails);
      });

      // Output the complete order details and the calculated price
      console.log("Order Details:", orderDetails);
      console.log("Total Order Price:", totalOrderPrice);

      const formattedAmount = parseFloat(totalOrderPrice).toFixed(2);
      const orderDescription = orderDetails.location;

      // Compute the hash
      const toMD5 =
        orderDetails.id +
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
          number: orderDetails.id,
          amount: formattedAmount,
          currency: orderCurrency,
          description: orderDescription,
        },
        cancel_url: `${process.env.PUBLIC_BASE_URL}/cancel`,
        success_url: `${process.env.PUBLIC_BASE_URL}/success?orderId=${orderDetails.id}`,
        customer: {
          name: orderDetails.emergencyContact1Name,
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
          orderDetails.id,
          jsonResponse.redirect_url
        );
        // Send redirect URL back to client
        res.status(200).json({ redirect_url: jsonResponse.redirect_url });
      } else {
        console.log("Im in error");
        console.log(res.json());
        res
          .status(apiResponse.status)
          .json({ error: "Failed to process payment" });
      }
    } else {
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    let aux = error.stack.split("\n");
    aux.splice(0, 2); //removing the line that we force to generate the error (var err = new Error();) from the message
    aux = aux.join('\n"');
    res.status(500).json({ error: error.message, details: aux });
  }
}
