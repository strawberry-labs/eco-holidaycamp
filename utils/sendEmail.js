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

    if (attendee.weeks.allWeeks) {
      attendeesDetails += `<tr><td colspan="3">All weeks selected</td></tr>`;
    } else {
      attendee.weeks.selectedWeeks.forEach((selected, weekIndex) => {
        if (selected) {
          attendeesDetails += `<tr><td colspan="3">Week ${
            weekIndex + 1
          }</td></tr>`;
          attendee.weeks.daysOfWeek[weekIndex].forEach((day) => {
            attendeesDetails += `<tr><td style="padding-left: 20px;">${day}</td><td></td><td></td></tr>`;
          });
        }
      });
    }

    attendee.priceDetails.details.forEach((item) => {
      attendeesDetails += `<tr><td style="padding-left: 40px;">${
        item.description
      }</td><td>$${item.cost.toFixed(2)}</td></tr>`;
    });

    attendeesDetails += `<tr><td></td><td style="text-align:right;"><strong>Subtotal:</strong></td><td>$${attendee.priceDetails.price.toFixed(
      2
    )}</td></tr>`;
    totalSum += attendee.priceDetails.price;
  });

  attendeesDetails += `<tr><td colspan="2" style="text-align:right;"><strong>Total Price:</strong></td><td>$${totalSum.toFixed(
    2
  )}</td></tr>`;
  attendeesDetails += "</table>";

  htmlTemplate = htmlTemplate.replace("{{order_id}}", order._id.toString());
  htmlTemplate = htmlTemplate.replace("{{attendeesDetails}}", attendeesDetails);

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
