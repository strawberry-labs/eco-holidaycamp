import dbConnect from "../../utils/dbConnect";
import Order from "../../models/OrderModel";
import Payment from "../../models/PaymentModel";
import { sendBookingConfirmationEmail } from "../../utils/sendEmail";

export default async function handler(req, res) {
  await dbConnect();
  try {
    console.log(`Callback Body: \n\n${req.body}`);
    if (req.method === "POST") {
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
      } = req.body;

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
      });

      await payment.save();

      // Check payment status and update order if settled
      if (status === "success" && type === "sale") {
        await Order.updateOne(
          { _id: order_number },
          { $set: { status: "PAID" } }
        );
        await sendBookingConfirmationEmail(order_number);
      }

      res.status(200).json({
        message: "Callback received successfully",
        paymentId: payment.id,
      });
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
