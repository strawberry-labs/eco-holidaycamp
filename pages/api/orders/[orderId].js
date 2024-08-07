import dbConnect from "../../../utils/dbConnect";
import Order from "../../../models/OrderModel";
import cors from "../../../utils/corsMiddleware";

export default async function handler(req, res) {
    await cors(req, res);

    if (req.method === "GET") {
        const { orderId } = req.query;

        console.log(orderId)
        // Check for API key in the query parameters
        if (req.headers["api_key"] !== process.env.API_KEY) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        try {
            await dbConnect();

            const order = await Order.findById(orderId).populate("attendees").lean(); // Using lean() for performance, returns plain JS objects

            // Transform data to flatten the structure
            const transformedOrder = {
                id: order._id,
                location: order.location,
                email: order.email,
                emergencyContact1Name: order.emergencyContact1Name,
                emergencyContact1Phone: order.emergencyContact1Phone,
                emergencyContact2Name: order.emergencyContact2Name,
                emergencyContact2Phone: order.emergencyContact2Phone,
                termsAndConditions: order.termsAndConditions,
                orderConfirmation: order.orderConfirmation,
                bookingConfirmation: order.bookingConfirmation,
                status: order.status,
                createdTime: order.createdTime,
                lastModifiedTime: order.lastModifiedTime,
                attendees: order.attendees.map((attendee) => ({
                    id: attendee._id,
                    firstName: attendee.firstName,
                    lastName: attendee.lastName,
                    dateOfBirth: attendee.dateOfBirth,
                    ageGroup: attendee.ageGroup,
                    gender: attendee.gender,
                    program: attendee.program,
                    medicalConditions: attendee.medicalConditions,
                    schoolName: attendee.schoolName,
                    friendsOrSiblingsNames: attendee.friendsOrSiblingsNames,
                    activitySelection: attendee.activitySelection,
                    allWeeks: attendee.allWeeks,
                    selectedWeeks: attendee.weeks.selectedWeeks,
                    daysOfWeek: attendee.weeks.daysOfWeek,
                    week1Group: attendee.week1Group,
                    week2Group: attendee.week2Group,
                    week3Group: attendee.week3Group,
                    week4Group: attendee.week4Group,
                    week5Group: attendee.week5Group,
                    week6Group: attendee.week6Group,

                })),
                notes: order.notes
            };

            res.status(200).json({ success: true, data: transformedOrder });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    } else if (req.method === "POST") {
        const { body } = req.body;
        const { orderId } = req.query;

        // Check for API key in the query parameters
        if (req.headers["api_key"] !== process.env.API_KEY) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Validate the input
        if (!orderId || !body) {
            return res
                .status(400)
                .json({ success: false, message: "Missing parameters" });
        }

        try {
            await dbConnect();

            // Update the status of the order
            const updatedOrder = await Order.findByIdAndUpdate(
                orderId,
                body
            );

            if (!updatedOrder) {
                return res
                    .status(404)
                    .json({ success: false, message: "Order not found" });
            }

            res.status(200).json({ success: true, data: updatedOrder });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    } else {
        res.setHeader("Allow", ["OPTIONS", "GET", "POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
