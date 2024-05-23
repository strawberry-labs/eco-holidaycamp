import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import dbConnect from "./dbConnect"; // Ensure dbConnect is correctly pathed
import Order from "../models/OrderModel"; // Correct the path as per your project structure

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_SES_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
  region: "us-east-1", // Update this to the region you are using in SES
});

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

// Utility to read and process the HTML file
const getHtmlEmailContent = (orderId, bookingLink) => {
  const filePath = path.join(
    process.cwd(),
    "templates",
    "bookingPendingTemplate.html"
  );
  console.log(filePath);
  let htmlContent = fs.readFileSync(filePath, "utf8");
  htmlContent = htmlContent.replace("{{orderId}}", orderId);
  htmlContent = htmlContent.replace("{{bookingLink}}", bookingLink);
  return htmlContent;
};

// Send Email Function
export const sendBookingPendingEmail = async (
  toEmail,
  orderId,
  bookingLink
) => {
  const htmlBody = getHtmlEmailContent(orderId, bookingLink);

  const params = {
    Source: "Ecoventure Bookings <bookings@strawberrylabs.net>",
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: "Pending Payment - Holiday Camp",
      },
      Body: {
        Html: {
          Data: htmlBody,
        },
      },
    },
  };

  try {
    const data = await ses.sendEmail(params).promise();
    console.log("Email sent:", data);
    return data;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email sending failed");
  }
};

const getHtmlConfirmationEmailContent = (order) => {
  const filePath = path.join(
    process.cwd(),
    "templates",
    "bookingConfirmationTemplate.html"
  );
  let htmlTemplate = fs.readFileSync(filePath, "utf8");

  let attendeesDetails =
    '<table style="width: 100%; border-collapse: collapse;">';
  let totalSum = 0;

  order.attendees.forEach((attendee, index) => {
    attendeesDetails += `<tr><td colspan="3"><strong>${attendee.firstName} ${attendee.lastName} - ${attendee.program}</strong></td></tr>`;

    if (attendee.weeks.allWeeks) {
      attendeesDetails += `<tr><td>All Weeks Selected</td><td style="text-align: right;">AED ${attendee.priceDetails.price.toFixed(
        2
      )}</td></tr>`;
    } else {
      attendee.priceDetails.details.forEach((weekDetail) => {
        attendeesDetails += `<tr><td colspan="3">${weekDetail.week}</td></tr>`;
        weekDetail.details.forEach((detail) => {
          attendeesDetails += `<tr><td style="padding-left: 20px;">${
            detail.description
          }</td><td style="text-align: right;">AED ${detail.cost.toFixed(
            2
          )}</td></tr>`;
        });
      });
    }

    let attendeeTotal = attendee.priceDetails.price;
    attendeesDetails += `<tr><td></td><td style="text-align:right;"><strong>Subtotal:</strong></td><td style="text-align: right;">AED ${attendeeTotal.toFixed(
      2
    )}</td></tr>`;
    totalSum += attendeeTotal;
  });

  attendeesDetails += `<tr><td colspan="2" style="text-align:right;"><strong>Total Price:</strong></td><td style="text-align: right;">AED ${totalSum.toFixed(
    2
  )}</td></tr>`;
  attendeesDetails += "</table>";

  htmlTemplate = htmlTemplate.replace("{{order_id}}", order._id.toString());
  htmlTemplate = htmlTemplate.replace("{{location}}", order.location);
  htmlTemplate = htmlTemplate.replace("{{attendeesDetails}}", attendeesDetails);
  htmlTemplate = htmlTemplate.replace("{{total}}", totalSum.toFixed(2));

  switch (order.location) {
    case "Kings Al Barsha":
      htmlTemplate.replace(
        "{{embed_link}}",
        `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30164.770492381467!2d55.252068715508635!3d25.079669838646602!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6eeba2badd1d%3A0xe98b599532679868!2sKings&#39;%20School%20Al%20Barsha!5e0!3m2!1sen!2sae!4v1716481981429!5m2!1sen!2sae`
      );
      break;
    case "Kings School Dubai":
      htmlTemplate.replace(
        "{{embed_link}}",
        `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d115583.33804915193!2d55.043285697265596!3d25.13639020000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6a4cfe809601%3A0x7a31dfbc6141d9c1!2sKings&#39;%20School%20Dubai!5e0!3m2!1sen!2sae!4v1716482493122!5m2!1sen!2sae`
      );
      break;
    default:
      htmlTemplate.replace(
        "{{embed_link}}",
        `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30164.770492381467!2d55.252068715508635!3d25.079669838646602!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6eeba2badd1d%3A0xe98b599532679868!2sKings&#39;%20School%20Al%20Barsha!5e0!3m2!1sen!2sae!4v1716481981429!5m2!1sen!2sae`
      );
  }

  return htmlTemplate;
};

export const sendBookingConfirmationEmail = async (orderId) => {
  await dbConnect();
  const order = await Order.findById(orderId).populate("attendees");

  const toEmail = order.email; // Assuming the email is stored directly in the order document
  const htmlBody = getHtmlConfirmationEmailContent(order);

  const params = {
    Source: "Ecoventure Bookings <bookings@strawberrylabs.net>",
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: "Booking Confirmation",
      },
      Body: {
        Html: {
          Data: htmlBody,
        },
      },
    },
  };

  try {
    const data = await ses.sendEmail(params).promise();
    console.log("Email sent:", data);
    return data;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email sending failed");
  }
};
