import dbConnect from "../../utils/dbConnect";
import Payment from "../../models/PaymentModel";
import cors from "../../utils/corsMiddleware";

export default async function handler(req, res) {
    await cors(req, res);

    if (req.method === "GET") {
        // Check for API key in the query parameters
        if (req.headers["api_key"] !== process.env.API_KEY) {
            console.log(req.headers["api_key"]);
            console.log(process.env.API_KEY);
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        try {
            await dbConnect();

            const results = await Payment.find({},
                [
                    "id",
                    "order_number",
                    "order_amount",
                    "order_currency",
                    "order_description",
                    "order_status",
                    "type",
                    "status",
                    "payment_status",
                    "reason",
                    "payee_name",
                    "payee_email",
                    "payee_country",
                    "payee_state",
                    "payee_city",
                    "payee_address",
                    "rrn",
                    "customer_name",
                    "customer_email",
                    "customer_country",
                    "customer_state",
                    "customer_city",
                    "customer_address",
                    "date",
                    "recurring_init_trans_id",
                    "recurring_token",
                    "schedule_id",
                    "exchange_rate",
                    "exchange_rate_base",
                    "exchange_currency",
                    "exchange_amount",
                    "vat_amount",
                ])

            res.status(200).json({ success: true, data: results });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    } else if (req.method === "POST") {
        const { paymentId, paymentDetails } = req.body

        // Check for API key in the query parameters
        if (req.headers["api_key"] !== process.env.API_KEY) {
            console.log(req.headers["api_key"]);
            console.log(process.env.API_KEY);
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Validate the input
        if (!paymentId || !paymentDetails) {
            return res
                .status(400)
                .json({ success: false, message: "Missing parameters" });
        }

        try {
            await dbConnect();

            // Update the attendee's group information
            const updatedPayment = await Attendee.findByIdAndUpdate(
                paymentId,
                { $set: paymentDetails },
                { new: true }
            );

            if (!updatedPayment) {
                return res
                    .status(404)
                    .json({ success: false, message: "Payment not found" });
            }

            res.status(200).json({ success: true, data: updatedPayment });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    } else {
        res.setHeader("Allow", ["OPTIONS", "GET", "POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}