import dbConnect from "../../../utils/dbConnect";
import Order from "../../../models/OrderModel";
import cors from "../../../utils/corsMiddleware";

export default async function handler(req, res) {
    await cors(req, res);

    if (req.method === "GET") {
        // Check for API key in the query parameters
        if (req.headers["api_key"] !== process.env.API_KEY) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        try {
            await dbConnect();

            const orders = await Order.find({}).populate("attendees").lean(); // Using lean() for performance, returns plain JS objects

            // Transform data to flatten the structure
            const transformedOrders = orders.map((order) => ({
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
                    week1: attendee.weeks.selectedWeeks[0],
                    week2: attendee.weeks.selectedWeeks[1],
                    week3: attendee.weeks.selectedWeeks[2],
                    week4: attendee.weeks.selectedWeeks[3],
                    week5: attendee.weeks.selectedWeeks[4],
                    week6: attendee.weeks.selectedWeeks[5],
                })),
                notes: order.notes
            }));

            res.status(200).json({ success: true, data: transformedOrders });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    } else if (req.method === "POST") {
        const { orderId, status } = req.body;

        // Check for API key in the query parameters
        if (req.headers["api_key"] !== process.env.API_KEY) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Validate the input
        if (!orderId || !status) {
            return res
                .status(400)
                .json({ success: false, message: "Missing parameters" });
        }

        try {
            await dbConnect();

            // Update the status of the order
            const updatedOrder = await Order.findByIdAndUpdate(
                orderId,
                { status: status },
                { new: true }
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
