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
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      await dbConnect();

      const paidOrders = await Order.find({ status: "PAID" });
      const attendeeIds = paidOrders.flatMap((order) => order.attendees);
      const totalAttendees = await Attendee.countDocuments({
        _id: { $in: attendeeIds },
      });
      const totalOrders = paidOrders.length;

      const totalRevenue = await Payment.aggregate([
        { $match: { status: "success", type: "sale" } },
        { $group: { _id: null, totalAmount: { $sum: "$order_amount" } } },
      ]);

      const ordersByStatus = await Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

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

      const attendeeCountByLocationAndActivity = await Order.aggregate([
        { $match: { status: "PAID" } },
        {
          $lookup: {
            from: "attendees",
            localField: "attendees",
            foreignField: "_id",
            as: "attendeeDetails",
          },
        },
        { $unwind: "$attendeeDetails" },
        {
          $group: {
            _id: {
              location: "$location",
              activitySelection: "$attendeeDetails.activitySelection",
              ageGroup: "$attendeeDetails.ageGroup",
            },
            count: { $sum: 1 },
            weeks: {
              $push: "$attendeeDetails.weeks.selectedWeeks",
            },
          },
        },
        {
          $project: {
            _id: 0,
            location: "$_id.location",
            activitySelection: "$_id.activitySelection",
            ageGroup: "$_id.ageGroup",
            count: 1,
            weeks: 1,
          },
        },
      ]);

      const processedAttendeeCount = attendeeCountByLocationAndActivity.map(
        (item) => {
          const weekCounts = item.weeks.reduce(
            (acc, weeks) => {
              weeks.forEach((selected, index) => {
                if (selected) {
                  acc[`week${index + 1}`] += 1;
                }
              });
              return acc;
            },
            {
              week1: 0,
              week2: 0,
              week3: 0,
              week4: 0,
              week5: 0,
              week6: 0,
            }
          );
          return {
            location: item.location,
            activitySelection: item.activitySelection,
            ageGroup: item.ageGroup,
            count: item.count,
            data: weekCounts,
          };
        }
      );

      const metrics = {
        totalAttendees,
        totalOrders,
        totalRevenue: totalRevenue[0]?.totalAmount || 0,
        ordersByStatus,
        revenueByDate,
        revenueByLocation,
        attendeeCountByLocationAndActivity: processedAttendeeCount,
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
