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
    attendeesDetails += `<tr><td colspan="3"><strong>${attendee.firstName} ${attendee.lastName}</strong></td></tr>`;

    attendee.priceDetails.details.forEach((weekDetail) => {
      attendeesDetails += `<tr><td colspan="3">Week: ${weekDetail.week}</td></tr>`;
      weekDetail.details.forEach((detail) => {
        attendeesDetails += `<tr><td style="padding-left: 20px;">${
          detail.description
        }</td><td style="text-align: right;">$${detail.cost.toFixed(
          2
        )}</td></tr>`;
      });
    });

    let attendeeTotal = attendee.priceDetails.price;
    attendeesDetails += `<tr><td></td><td style="text-align: right;"><strong>Subtotal:</strong></td><td style="text-align: right;">$${attendeeTotal.toFixed(
      2
    )}</td></tr>`;
    totalSum += attendeeTotal;
  });

  attendeesDetails += `<tr><td colspan="2" style="text-align: right;"><strong>Total Price:</strong></td><td style="text-align: right;">$${totalSum.toFixed(
    2
  )}</td></tr>`;
  attendeesDetails += "</table>";

  htmlTemplate = htmlTemplate.replace("{{order_id}}", order._id.toString());
  htmlTemplate = htmlTemplate.replace("{{attendeesDetails}}", attendeesDetails);
  htmlTemplate = htmlTemplate.replace("{{total}}", totalSum.toFixed(2));

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
