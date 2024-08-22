import dbConnect from "../../utils/dbConnect";
import Order from "../../models/OrderModel";
import Payment from "../../models/PaymentModel";
import {
  sendBookingConfirmationEmail,
  sendBookingExtensionConfirmationEmail,
} from "../../utils/sendEmail";
import crypto from "crypto";

export default async function handler(req, res) {
  await dbConnect();
  try {
    const origin = req.headers.origin;
    // Log the origin to the console or handle it as needed
    console.log("Request Origin:", origin);

    console.log(`Callback Body: \n\n${JSON.stringify(req.body)}`);

    if (req.method === "POST") {
      const callbackData = req.body;

      const {
        id,
        order_number,
        order_amount,
        order_currency,
        order_description,
        order_status,
        type,
        status,
        payment_status,
        reason,
        payee_name,
        payee_email,
        payee_country,
        payee_state,
        payee_city,
        payee_address,
        rrn,
        approval_code,
        card,
        card_expiration_date,
        payee_card,
        card_token,
        customer_name,
        customer_email,
        customer_country,
        customer_state,
        customer_city,
        customer_address,
        customer_ip,
        date,
        recurring_init_trans_id,
        recurring_token,
        schedule_id,
        exchange_rate,
        exchange_rate_base,
        exchange_currency,
        exchange_amount,
        vat_amount,
        hash,
      } = callbackData;

      // Save the full payment response in the payments collection
      const payment = new Payment({
        id,
        order_number,
        order_amount,
        order_currency,
        order_description,
        order_status,
        type,
        status,
        payment_status,
        reason,
        payee_name,
        payee_email,
        payee_country,
        payee_state,
        payee_city,
        payee_address,
        rrn,
        approval_code,
        card,
        card_expiration_date,
        payee_card,
        card_token,
        customer_name,
        customer_email,
        customer_country,
        customer_state,
        customer_city,
        customer_address,
        customer_ip,
        date,
        recurring_init_trans_id,
        recurring_token,
        schedule_id,
        exchange_rate,
        exchange_rate_base,
        exchange_currency,
        exchange_amount,
        vat_amount,
        hash,
        mode: "online",
      });

      if (!verifyHash(callbackData)) {
        return res.status(403).json({
          error: "Invalid hash, request might have been tampered with",
        });
      } else {
        await payment.save();

        const orderId = order_number;
        const order = await Order.findById(orderId);

        // Check payment status and update order if settled
        if (status === "success" && type === "sale") {
          if (order.status === "PAID") {
            await sendBookingExtensionConfirmationEmail(order_number);
          }
          const updateResult = await Order.updateOne(
            { _id: order_number },
            {
              $set: {
                status: "PAID",
                lastModifiedTime: new Date(), // Set last modified date to current date and time
              },
            }
          );

          if (updateResult.modifiedCount === 1) {
            console.log("Order updated successfully.");
            await sendBookingConfirmationEmail(order_number);
          } else {
            console.log("Order was not updated.");
          }
        }

        res.status(200).json({
          message: "Callback received successfully",
          paymentId: payment.id,
        });
      }
    } else {
      res.status(405).json({ error: "Method Not Allowed" });
    }
  } catch (error) {
    let aux = error.stack.split("\n");
    aux.splice(0, 2); //removing the line that we force to generate the error (var err = new Error();) from the message
    aux = aux.join('\n"');
    console.log(`Error in callback - ${error}\n${aux}`);
  }
}

// function parseCallbackData(callbackString) {
//   const obj = {};
//   // Split the string by "||" to get each key-value pair
//   const pairs = callbackString.split("||");
//   pairs.forEach((pair) => {
//     const [key, value] = pair.split("=");
//     if (key && value) {
//       obj[key.trim()] = value.trim();
//     }
//   });
//   return obj;
// }

function verifyHash(data) {
  const stringToHash = `${data.id}${data.order_number}${data.order_amount}${data.order_currency}${data.order_description}${process.env.TOTALPAY_SECRET}`;
  const md5Hash = crypto
    .createHash("md5")
    .update(stringToHash.toUpperCase())
    .digest("hex");
  const sha1Hash = crypto.createHash("sha1").update(md5Hash).digest("hex");
  console.log(`Calculated Hash: ${sha1Hash}`);

  return sha1Hash === data.hash;
}
