import dbConnect from "../../utils/dbConnect";
import Attendee from "../../models/AttendeeModel";
import Order from "../../models/OrderModel";
import Payment from "../../models/PaymentModel";
import cors from "../../utils/corsMiddleware";

export default async function handler(req, res) {
  await cors(req, res);

  try {
    if (req.method === "GET") {
      if (req.headers["api_key"] !== process.env.API_KEY) {
        console.log(req.headers["api_key"]);
        console.log(process.env.API_KEY);
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      await dbConnect();

      // Fetch all paid orders
      const paidOrders = await Order.find({ status: "PAID" });

      // Extract attendee IDs from paid orders
      const attendeeIds = paidOrders.flatMap((order) => order.attendees);

      // Total number of attendees from paid orders
      const totalAttendees = await Attendee.countDocuments({
        _id: { $in: attendeeIds },
      });

      // Total number of paid orders
      const totalOrders = paidOrders.length;

      // Total revenue generated from successful sale payments
      const totalRevenue = await Payment.aggregate([
        { $match: { status: "success", type: "sale" } },
        { $group: { _id: null, totalAmount: { $sum: "$order_amount" } } },
      ]);

      // Number of orders by status (for any status)
      const ordersByStatus = await Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      // Revenue by date
      const revenueByDate = await Payment.aggregate([
        { $match: { status: "success", type: "sale" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            totalAmount: { $sum: "$order_amount" },
          },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            totalAmount: 1,
          },
        },
        { $sort: { date: 1 } },
      ]);

      // Revenue by location
      const revenueByLocation = await Order.aggregate([
        { $match: { status: "PAID" } },
        {
          $lookup: {
            from: "payments",
            let: { order_id: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$order_number", "$$order_id"] },
                      { $eq: ["$status", "success"] },
                      { $eq: ["$type", "sale"] },
                    ],
                  },
                },
              },
            ],
            as: "payments",
          },
        },
        { $unwind: "$payments" },
        {
          $group: {
            _id: "$location",
            totalAmount: { $sum: "$payments.order_amount" },
          },
        },
        {
          $project: {
            _id: 0,
            location: "$_id",
            totalAmount: 1,
          },
        },
        { $sort: { location: 1 } },
      ]);

      // Attendee count by location, activity selection, and age group
      const attendeeCountByLocationAndActivity = await Order.aggregate([
        { $match: { status: "PAID" } },
        {
          $lookup: {
            from: "attendees",
            localField: "attendees",
            foreignField: "_id",
            as: "attendeesDetails",
          },
        },
        { $unwind: "$attendeesDetails" },
        {
          $group: {
            _id: {
              location: "$location",
              activitySelection: "$attendeesDetails.activitySelection",
              ageGroup: "$attendeesDetails.ageGroup",
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            location: "$_id.location",
            activitySelection: "$_id.activitySelection",
            ageGroup: "$_id.ageGroup",
            count: 1,
          },
        },
        { $sort: { location: 1, activitySelection: 1, ageGroup: 1 } },
      ]);

      const metrics = {
        totalAttendees,
        totalOrders,
        totalRevenue: totalRevenue[0]?.totalAmount || 0,
        ordersByStatus,
        revenueByDate,
        revenueByLocation,
        attendeeCountByLocationAndActivity,
      };

      res.status(200).json(metrics);
    } else {
      res.setHeader("Allow", ["OPTIONS", "GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
