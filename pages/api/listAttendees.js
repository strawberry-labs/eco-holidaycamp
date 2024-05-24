import dbConnect from "../../utils/dbConnect";
import Order from "../../models/OrderModel";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  const {
    page_no = 1,
    page_size = 10,
    status,
    location,
    email,
    emergencyContact,
    ageGroup,
    activitySelection,
    allWeeks,
  } = req.query;

  const pageNumber = parseInt(page_no);
  const pageSize = parseInt(page_size);

  // Build filters based on the query parameters
  const orderFilter = {};
  if (status) orderFilter.status = status;
  if (location) orderFilter.location = location;
  if (email) orderFilter.email = new RegExp(email, "i");

  const attendeeFilter = {};
  if (ageGroup) attendeeFilter["attendeeDetails.ageGroup"] = ageGroup;
  if (activitySelection)
    attendeeFilter["attendeeDetails.activitySelection"] = activitySelection;
  if (allWeeks !== undefined)
    attendeeFilter["attendeeDetails.weeks.allWeeks"] = allWeeks === "true";

  // Aggregation pipeline for fetching data
  const aggregateQuery = [
    { $match: orderFilter },
    {
      $lookup: {
        from: "attendees",
        localField: "attendees",
        foreignField: "_id",
        as: "attendeeDetails",
      },
    },
    { $match: attendeeFilter },
    { $skip: (pageNumber - 1) * pageSize },
    { $limit: pageSize },
  ];

  // Build the aggregation pipeline for counting
  const countAggregateQuery = [
    { $match: orderFilter },
    {
      $lookup: {
        from: "attendees",
        localField: "attendees",
        foreignField: "_id",
        as: "attendeeDetails",
      },
    },
    { $match: attendeeFilter },
    { $group: { _id: null, count: { $sum: 1 } } },
  ];

  try {
    // Execute the count aggregation
    const countResults = await Order.aggregate(countAggregateQuery);
    const total = countResults.length > 0 ? countResults[0].count : 0;

    // Execute the main aggregation to fetch the data
    const results = await Order.aggregate(aggregateQuery);

    res.status(200).json({
      success: true,
      data: results,
      total: total,
      page_no: pageNumber,
      pages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Aggregation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
