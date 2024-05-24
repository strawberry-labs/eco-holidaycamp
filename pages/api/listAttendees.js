// pages/api/listAttendees.js
import dbConnect from "../../utils/dbConnect";
import Order from "../../models/OrderModel";
import Attendee from "../../models/AttendeeModel";

export default async function handler(req, res) {
  await dbConnect();

  const { page_no = 1, page_size = 10, ...filters } = req.query;
  const skip = (page_no - 1) * page_size;

  // Filters for Attendees and Orders
  const attendeeFilters = {};
  const orderFilters = {};

  // Dynamically build filters for Attendee and Order based on fields
  Object.keys(filters).forEach((key) => {
    if (key.startsWith("attendee_")) {
      const fieldName = key.substring(9); // Remove 'attendee_' prefix
      attendeeFilters[fieldName] = { $regex: filters[key], $options: "i" };
    } else {
      const fieldName = key;
      orderFilters[fieldName] = { $regex: filters[key], $options: "i" };
    }
  });

  const pipeline = [
    { $match: orderFilters },
    {
      $lookup: {
        from: "attendees",
        localField: "attendees",
        foreignField: "_id",
        as: "attendeeDetails",
      },
    },
    { $unwind: "$attendeeDetails" },
  ];

  console.log(attendeeFilters);

  // Only add the $match stage if there are filters for attendees
  if (Object.keys(attendeeFilters).length > 0) {
    pipeline.push({ $match: { attendeeDetails: { ...attendeeFilters } } });
  }

  // Add pagination stages at the end
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: parseInt(page_size) });
  console.log(JSON.stringify(pipeline, null, 2));
  try {
    const orders = await Order.aggregate(pipeline);
    console.log(orders);

    const total = await Order.countDocuments(orderFilters);

    res.status(200).json({
      success: true,
      data: orders,
      total,
      page_no,
      pages: Math.ceil(total / page_size),
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}
