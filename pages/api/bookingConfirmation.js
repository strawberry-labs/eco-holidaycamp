import dbConnect from "../../utils/dbConnect";
import { sendBookingConfirmationEmail } from "../../utils/sendEmail";
import cors from "../../utils/corsMiddleware";

export default async function handler(req, res) {
  await cors(req, res);

  await dbConnect();
  try {
    const apiKey = req.headers["api_key"];
    const { orderId } = req.query;

    if (req.method === "POST" && apiKey == process.env.API_KEY) {
      {
        await sendBookingConfirmationEmail(orderId);

        res.status(200).json({
          message: "Booking Confirmation sent successfully",
          orderId: orderId,
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
