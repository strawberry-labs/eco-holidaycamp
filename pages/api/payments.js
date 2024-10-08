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
                    "_id",
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
                    "approval_code",
                    "card",
                    "card_expiration_date",
                    "payee_card",
                    "card_token",
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
                    "mode"
                ])

            res.status(200).json({ success: true, data: results });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    } else {
        res.setHeader("Allow", ["OPTIONS", "GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}