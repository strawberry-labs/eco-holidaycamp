import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

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
