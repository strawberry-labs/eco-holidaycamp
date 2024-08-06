import dbConnect from "../../utils/dbConnect"; // Ensure this utility is correctly set up

import Order from "../../models/OrderModel";
import { sendWaitlistRejectionAdminEmail, sendWaitlistRejectionUserEmail } from "../../utils/sendEmail";

export default async function handler(req, res) {
    await dbConnect();

    if (req.headers["api_key"] !== process.env.API_KEY) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.method === "POST") {
        try {
            // Extract data from request body
            const {
                orderNumber
            } = req.body;

            const orderDetails = await Order.findById(orderNumber)

            console.log(orderDetails)

            //update order status to REJECTED
            await Order.updateOne(
                { _id: orderNumber },
                {
                    $set: {
                        status: "REJECTED",
                        lastModifiedTime: new Date(), // Set last modified date to current date and time 
                    }
                }
            )

            await sendWaitlistRejectionAdminEmail(orderNumber);
            await sendWaitlistRejectionUserEmail(orderDetails.email, orderNumber, orderDetails.emergencyContact1Name)

            // Send redirect URL back to client
            res.status(200).json({ "message": "rejected order" });
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