import dbConnect from "../../utils/dbConnect";
import Order from "../../models/OrderModel";
import cors from "../../utils/corsMiddleware";

export default async function handler(req, res) {
  await cors(req, res);

  if (req.method === "GET") {
    // Check for API key in the query parameters
    // if (req.headers["api_key"] !== process.env.API_KEY) {
    //   console.log(req.headers["api_key"]);
    //   console.log(process.env.API_KEY);
    //   return res.status(401).json({ success: false, message: "Unauthorized" });
    // }

    try {
      await dbConnect();

      const results = await Order.aggregate([
        {
          $lookup: {
            from: "attendees", // collection name in db
            localField: "attendees",
            foreignField: "_id",
            as: "attendeeDetails",
          },
        },
        {
          $unwind: "$attendeeDetails",
        },
        {
          $project: {
            _id: 0, // Exclude the default _id
            id: "$attendeeDetails._id",
            firstName: "$attendeeDetails.firstName",
            lastName: "$attendeeDetails.lastName",
            dateOfBirth: "$attendeeDetails.dateOfBirth",
            ageGroup: "$attendeeDetails.ageGroup",
            gender: "$attendeeDetails.gender",
            program: "$attendeeDetails.program",
            medicalConditions: "$attendeeDetails.medicalConditions",
            schoolName: "$attendeeDetails.schoolName",
            friendsOrSiblingsNames: "$attendeeDetails.friendsOrSiblingsNames",
            activitySelection: "$attendeeDetails.activitySelection",
            allWeeks: "$attendeeDetails.weeks.allWeeks",
            week1: {
              $arrayElemAt: ["$attendeeDetails.weeks.selectedWeeks", 0],
            },
            week2: {
              $arrayElemAt: ["$attendeeDetails.weeks.selectedWeeks", 1],
            },
            week3: {
              $arrayElemAt: ["$attendeeDetails.weeks.selectedWeeks", 2],
            },
            week4: {
              $arrayElemAt: ["$attendeeDetails.weeks.selectedWeeks", 3],
            },
            week5: {
              $arrayElemAt: ["$attendeeDetails.weeks.selectedWeeks", 4],
            },
            week6: {
              $arrayElemAt: ["$attendeeDetails.weeks.selectedWeeks", 5],
            },
            orderId: "$_id",
            orderLocation: "$location",
            orderEmail: "$email",
            emergencyContact1Name: "$emergencyContact1Name",
            emergencyContact1Phone: "$emergencyContact1Phone",
            emergencyContact2Name: "$emergencyContact2Name",
            emergencyContact2Phone: "$emergencyContact2Phone",
            orderStatus: "$status",
            createdTime: "$attendeeDetails.createdTime",
            lastModifiedTime: "$attendeeDetails.lastModifiedTime",
          },
        },
      ]);

      res.status(200).json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else if (req.method === "POST") {
    const { attendeeId, groupDetails } = req.body;

    // Check for API key in the query parameters
    if (req.headers["api_key"] !== process.env.API_KEY) {
      console.log(req.headers["api_key"]);
      console.log(process.env.API_KEY);
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Validate the input
    if (!attendeeId || !groupDetails) {
      return res
        .status(400)
        .json({ success: false, message: "Missing parameters" });
    }

    try {
      await dbConnect();

      // Construct the update object dynamically based on provided group details
      const update = {};
      if (groupDetails.week1Group !== undefined)
        update.week1Group = groupDetails.week1Group;
      if (groupDetails.week2Group !== undefined)
        update.week2Group = groupDetails.week2Group;
      if (groupDetails.week3Group !== undefined)
        update.week3Group = groupDetails.week3Group;
      if (groupDetails.week4Group !== undefined)
        update.week4Group = groupDetails.week4Group;
      if (groupDetails.week5Group !== undefined)
        update.week5Group = groupDetails.week5Group;
      if (groupDetails.week6Group !== undefined)
        update.week6Group = groupDetails.week6Group;

      // Update the attendee's group information
      const updatedAttendee = await Attendee.findByIdAndUpdate(
        attendeeId,
        { $set: update },
        { new: true }
      );

      if (!updatedAttendee) {
        return res
          .status(404)
          .json({ success: false, message: "Attendee not found" });
      }

      res.status(200).json({ success: true, data: updatedAttendee });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.setHeader("Allow", ["OPTIONS", "GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
