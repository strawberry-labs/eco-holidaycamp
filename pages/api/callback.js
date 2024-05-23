import dbConnect from "../../utils/dbConnect";
import Order from "../../models/OrderModel";
import Payment from "../../models/PaymentModel";
import { sendBookingConfirmationEmail } from "../../utils/sendEmail";

export default async function handler(req, res) {
  await dbConnect();

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
      ...otherParams
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
      ...otherParams,
    });

    await payment.save();

    // Check payment status and update order if settled
    if (payment_status === "settled") {
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
}
