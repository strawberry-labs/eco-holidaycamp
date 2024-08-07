import dbConnect from "../../../utils/dbConnect";
import Order from "../../../models/OrderModel";
import Attendee from "../../../models/AttendeeModel";
import cors from "../../../utils/corsMiddleware";
import mongoose from "mongoose";

export default async function handler(req, res) {
    await cors(req, res);

    if (req.method === "GET") {

        const ObjectId = mongoose.Types.ObjectId;

        const { attendeeId } = req.query;

        // Check for API key in the query parameters
        if (req.headers["api_key"] !== process.env.API_KEY) {
            console.log(req.headers["api_key"]);
            console.log(process.env.API_KEY);
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

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
                        week1Days: {
                            $cond: {
                                if: {
                                    $eq: [
                                        {
                                            $size: {
                                                $arrayElemAt: ["$attendeeDetails.weeks.daysOfWeek", 0],
                                            },
                                        },
                                        5,
                                    ],
                                },
                                then: "Week Pass",
                                else: {
                                    $reduce: {
                                        input: {
                                            $arrayElemAt: ["$attendeeDetails.weeks.daysOfWeek", 0],
                                        },
                                        initialValue: "",
                                        in: {
                                            $concat: [
                                                "$$value",
                                                {
                                                    $cond: {
                                                        if: { $eq: ["$$value", ""] },
                                                        then: "",
                                                        else: ", ",
                                                    },
                                                },
                                                "$$this",
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        week2Days: {
                            $cond: {
                                if: {
                                    $eq: [
                                        {
                                            $size: {
                                                $arrayElemAt: ["$attendeeDetails.weeks.daysOfWeek", 1],
                                            },
                                        },
                                        5,
                                    ],
                                },
                                then: "Week Pass",
                                else: {
                                    $reduce: {
                                        input: {
                                            $arrayElemAt: ["$attendeeDetails.weeks.daysOfWeek", 1],
                                        },
                                        initialValue: "",
                                        in: {
                                            $concat: [
                                                "$$value",
                                                {
                                                    $cond: {
                                                        if: { $eq: ["$$value", ""] },
                                                        then: "",
                                                        else: ", ",
                                                    },
                                                },
                                                "$$this",
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        week3Days: {
                            $cond: {
                                if: {
                                    $eq: [
                                        {
                                            $size: {
                                                $arrayElemAt: ["$attendeeDetails.weeks.daysOfWeek", 2],
                                            },
                                        },
                                        5,
                                    ],
                                },
                                then: "Week Pass",
                                else: {
                                    $reduce: {
                                        input: {
                                            $arrayElemAt: ["$attendeeDetails.weeks.daysOfWeek", 2],
                                        },
                                        initialValue: "",
                                        in: {
                                            $concat: [
                                                "$$value",
                                                {
                                                    $cond: {
                                                        if: { $eq: ["$$value", ""] },
                                                        then: "",
                                                        else: ", ",
                                                    },
                                                },
                                                "$$this",
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        week4Days: {
                            $cond: {
                                if: {
                                    $eq: [
                                        {
                                            $size: {
                                                $arrayElemAt: ["$attendeeDetails.weeks.daysOfWeek", 3],
                                            },
                                        },
                                        5,
                                    ],
                                },
                                then: "Week Pass",
                                else: {
                                    $reduce: {
                                        input: {
                                            $arrayElemAt: ["$attendeeDetails.weeks.daysOfWeek", 3],
                                        },
                                        initialValue: "",
                                        in: {
                                            $concat: [
                                                "$$value",
                                                {
                                                    $cond: {
                                                        if: { $eq: ["$$value", ""] },
                                                        then: "",
                                                        else: ", ",
                                                    },
                                                },
                                                "$$this",
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        week5Days: {
                            $cond: {
                                if: {
                                    $eq: [
                                        {
                                            $size: {
                                                $arrayElemAt: ["$attendeeDetails.weeks.daysOfWeek", 4],
                                            },
                                        },
                                        5,
                                    ],
                                },
                                then: "Week Pass",
                                else: {
                                    $reduce: {
                                        input: {
                                            $arrayElemAt: ["$attendeeDetails.weeks.daysOfWeek", 4],
                                        },
                                        initialValue: "",
                                        in: {
                                            $concat: [
                                                "$$value",
                                                {
                                                    $cond: {
                                                        if: { $eq: ["$$value", ""] },
                                                        then: "",
                                                        else: ", ",
                                                    },
                                                },
                                                "$$this",
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        week6Days: {
                            $cond: {
                                if: {
                                    $eq: [
                                        {
                                            $size: {
                                                $arrayElemAt: ["$attendeeDetails.weeks.daysOfWeek", 5],
                                            },
                                        },
                                        5,
                                    ],
                                },
                                then: "Week Pass",
                                else: {
                                    $reduce: {
                                        input: {
                                            $arrayElemAt: ["$attendeeDetails.weeks.daysOfWeek", 5],
                                        },
                                        initialValue: "",
                                        in: {
                                            $concat: [
                                                "$$value",
                                                {
                                                    $cond: {
                                                        if: { $eq: ["$$value", ""] },
                                                        then: "",
                                                        else: ", ",
                                                    },
                                                },
                                                "$$this",
                                            ],
                                        },
                                    },
                                },
                            },
                        },

                        orderId: "$_id",
                        orderLocation: "$location",
                        orderEmail: "$email",
                        emergencyContact1Name: "$emergencyContact1Name",
                        emergencyContact1Phone: "$emergencyContact1Phone",
                        emergencyContact2Name: "$emergencyContact2Name",
                        emergencyContact2Phone: "$emergencyContact2Phone",
                        orderStatus: "$status",
                        week1Group: "$attendeeDetails.week1Group",
                        week2Group: "$attendeeDetails.week2Group",
                        week3Group: "$attendeeDetails.week3Group",
                        week4Group: "$attendeeDetails.week4Group",
                        week5Group: "$attendeeDetails.week5Group",
                        week6Group: "$attendeeDetails.week6Group",
                        createdTime: "$attendeeDetails.createdTime",
                        lastModifiedTime: "$attendeeDetails.lastModifiedTime",
                    },
                },
                {
                    $match: {
                        id: new ObjectId(`${attendeeId}`)
                    }
                }
            ]);

            res.status(200).json({ success: true, data: results });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    } else if (req.method === "POST") {
        const { body } = req.body;
        const { attendeeId } = req.query;

        // Check for API key in the query parameters
        if (req.headers["api_key"] !== process.env.API_KEY) {
            console.log(req.headers["api_key"]);
            console.log(process.env.API_KEY);
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Validate the input
        if (!attendeeId || !body) {
            return res
                .status(400)
                .json({ success: false, message: "Missing parameters" });
        }

        try {
            //await dbConnect();

            const daysOfWeek = body.daysOfWeek;

            let details = []

            for (let i = 0; i < daysOfWeek.length; i += 1) {
                const week = daysOfWeek[i]

                if (week.length == 0) continue

                let subDetails = {}
                subDetails["week"] = `Week ${i + 1}`

                let priceDetails = []

                if (week.length == 5) {
                    priceDetails.push({
                        description: "Full Week",
                        cost: body.attendeesInSameOrder > 1 ? 845 : 945
                    })
                } else {
                    priceDetails = daysOfWeek[i].map((day) => {
                        return {
                            description: day,
                            cost: 200
                        }
                    })
                }

                subDetails["details"] = priceDetails
                details.push(subDetails)
            }

            // Construct the update object dynamically based on provided group details
            const update = {
                firstName: body.firstName,
                lastName: body.lastName,
                dateOfBirth: body.dateOfBirth,
                ageGroup: body.ageGroup,
                gender: body.gender,
                medicalConditions: body.medicalConditions,
                schoolName: body.schoolName,
                friendsOrSiblingsNames: body.friendsOrSiblingsNames,
                activitySelection: body.activitySelection,
                lastModifiedTime: body.lastModifiedTime,
                week1Group: body.week1Group,
                week2Group: body.week2Group,
                week3Group: body.week3Group,
                week4Group: body.week4Group,
                week5Group: body.week5Group,
                week6Group: body.week6Group,
                weeks: {
                    selectedWeeks: body.selectedWeeks,
                    daysOfWeek: body.daysOfWeek,
                },
                priceDetails: {
                    price: body.price,
                    details: details
                }

            };

            const updatedAttendee = await Attendee.findByIdAndUpdate(
                attendeeId,
                { $set: update },
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
