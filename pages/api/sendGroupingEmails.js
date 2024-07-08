import dbConnect from "../../utils/dbConnect";
import { sendGroupingEmail } from "../../utils/sendEmail";
import Order from "../../models/OrderModel";

export default async function handler(req, res) {
  await dbConnect();
  try {
    const apiKey = req.headers["api_key"];
    const { week } = req.query;

    if (req.method === "POST" && apiKey == process.env.API_KEY) {
      if (!week || week < 1 || week > 6) {
        return res.status(400).json({ error: "Invalid week parameter" });
      }

      const orders = await Order.find({ status: "PAID" }).populate("attendees");

      let count = 1;
      for (const order of orders) {
        for (const attendee of order.attendees) {
          if (attendee.weeks.selectedWeeks[week - 1]) {
            const weekGroupField = `week${week}Group`;
            const weekGroup = attendee[weekGroupField];

            if (weekGroup) {
              console.log(
                count,
                " ",
                order.emergencyContact1Name,
                " ",
                order.email,
                " ",
                attendee.firstName,
                " ",
                " ",
                weekGroup
              );
              count = count + 1;
              //   await sendGroupingEmail(
              //     order.emergencyContact1Name,
              //     "bradley.c@ecoventureme.com",
              //     attendee,
              //     weekGroup,
              //     week,
              //     order.location
              //   );

              await sendGroupingEmail(
                order.emergencyContact1Name,
                order.email,
                attendee,
                weekGroup,
                week,
                order.location
              );
            }
          }
        }
      }
      //   await sendGroupingEmail(
      //     "Chirag Asarpota",
      //     "hi@chiragasarpota.com",
      //     { firstName: "John ", lastName: "Smith" },
      //     "Dolphins 1",
      //     week,
      //     "Kings' School Al Barsha"
      //   );

      res.status(200).send("Emails sent successfully.");
    } else {
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    let aux = error.stack.split("\n");
    aux.splice(0, 2);
    aux = aux.join('\n"');
    res.status(500).json({ error: error.message, details: aux });
  }
}
