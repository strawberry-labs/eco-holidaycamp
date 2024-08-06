import CryptoJS from "crypto-js";

import dbConnect from "../../utils/dbConnect"; // Ensure this utility is correctly set up
import cors from "../../utils/corsMiddleware";
import Order from "../../models/OrderModel";
import { sendWaitlistAcceptanceEmail } from "../../utils/sendEmail";

export default async function handler(req, res) {
    await cors(req, res)
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

            const orderDetails = await Order.findById(orderNumber).populate('attendees')

            console.log(orderDetails)

            const discount = orderDetails.discount;
            const discountType = orderDetails.discountType;

            // Calculate the order amount from the forms
            const orderAmount = orderDetails.attendees.reduce(
                (total, form) => total + form.priceDetails.price,
                0
            );

            // Calculate final order amount with discount if applicable
            let finalAmount = orderAmount;
            if (discountType === "percentage") {
                finalAmount = orderAmount - (orderAmount * discount) / 100;
            } else if (discountType === "flat") {
                finalAmount = orderAmount - discount;
            }
            finalAmount = parseFloat(finalAmount).toFixed(2);

            const orderCurrency = "AED";
            const orderDescription = orderDetails.location;

            // Compute the hash
            const toMD5 =
                orderNumber +
                finalAmount +
                orderCurrency +
                orderDescription +
                process.env.TOTALPAY_SECRET;
            const hash = CryptoJS.SHA1(
                CryptoJS.MD5(toMD5.toUpperCase()).toString()
            ).toString(CryptoJS.enc.Hex);

            const nameForPG = processName(orderDetails.emergencyContact1Name);

            // Construct the request body for the external API
            const body = JSON.stringify({
                merchant_key: process.env.TOTALPAY_KEY,
                operation: "purchase",
                methods: ["card"],
                order: {
                    number: orderNumber,
                    amount: finalAmount,
                    currency: orderCurrency,
                    description: orderDescription,
                },
                cancel_url: `${process.env.PUBLIC_BASE_URL}/cancel`,
                success_url: `${process.env.PUBLIC_BASE_URL}/success?orderId=${orderNumber}`,
                customer: {
                    name: nameForPG,
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

            console.log(body)

            //update order status to PENDING_PAYMENT
            await Order.updateOne(
                { _id: orderNumber },
                {
                    $set: {
                        status: "PENDING_PAYMENT",
                        lastModifiedTime: new Date(), // Set last modified date to current date and time 
                    }
                })

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
                await sendWaitlistAcceptanceEmail(
                    orderDetails.email,
                    orderNumber,
                    jsonResponse.redirect_url
                );

                // Send redirect URL back to client
                res.status(200).json({ redirect_url: jsonResponse.redirect_url });
            } else {
                console.log(res.json());
                res
                    .status(apiResponse.status)
                    .json({ error: "Failed to process payment" });
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

function processName(name) {
    // Remove any special characters except spaces
    let cleanName = name.replace(/[^a-zA-Z\s]/g, "");

    // Return the first two words joined by a space, or the whole clean name if it has less than 2 words
    return cleanName;
}
