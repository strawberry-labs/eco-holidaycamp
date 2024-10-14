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
    Source: "Ecoventure Bookings <info@ecoventureme.com>",
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
  let subtotal = 0;

  order.attendees.forEach((attendee) => {
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
    subtotal += attendeeTotal;
  });

  attendeesDetails += `<tr><td colspan="2" style="text-align:right;"><strong>Subtotal:</strong></td><td style="text-align: right;">AED ${subtotal.toFixed(
    2
  )}</td></tr>`;

  if (order.promoCode) {
    const discountAmount =
      order.discountType === "percentage"
        ? (subtotal * order.discount) / 100
        : order.discount;
    subtotal -= discountAmount;
    attendeesDetails += `<tr><td colspan="2" style="text-align:right;"><strong>Promo Code (${
      order.promoCode
    }) Discount:</strong></td><td style="text-align: right;">AED ${discountAmount.toFixed(
      2
    )}</td></tr>`;
  }

  attendeesDetails += `<tr><td colspan="2" style="text-align:right;"><strong>Total:</strong></td><td style="text-align: right;">AED ${subtotal.toFixed(
    2
  )}</td></tr>`;
  attendeesDetails += "</table>";

  htmlTemplate = htmlTemplate.replace("{{order_id}}", order._id.toString());
  htmlTemplate = htmlTemplate.replace("{{location}}", order.location);
  htmlTemplate = htmlTemplate.replace("{{attendeesDetails}}", attendeesDetails);
  htmlTemplate = htmlTemplate.replace("{{total}}", subtotal.toFixed(2));

  console.log(order.location);
  switch (order.location) {
    case "Kings' School Al Barsha":
      console.log("im inside this case");
      htmlTemplate = htmlTemplate.replace(
        "{{map_link}}",
        `https://maps.app.goo.gl/YM6gVRX1Uhj8K2cX7`
      );
      htmlTemplate = htmlTemplate.replace(
        "{{map_image_link}}",
        `https://cdn.strawberrylabs.net/strawberrylabs/kings-barsha.png`
      );
      break;
    case "Kings' School Dubai":
      htmlTemplate = htmlTemplate.replace(
        "{{map_link}}",
        `https://maps.app.goo.gl/HZygjbZE11oTDXU96`
      );
      htmlTemplate = htmlTemplate.replace(
        "{{map_image_link}}",
        `https://cdn.strawberrylabs.net/strawberrylabs/kings-dubai.png`
      );
      break;
    default:
      htmlTemplate = htmlTemplate.replace(
        "{{map_link}}",
        `https://maps.app.goo.gl/YM6gVRX1Uhj8K2cX7`
      );
      htmlTemplate = htmlTemplate.replace(
        "{{map_image_link}}",
        `https://cdn.strawberrylabs.net/strawberrylabs/kings-dubai.png`
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
    Source: "Ecoventure Bookings <info@ecoventureme.com>",
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

const getHtmlExtensionEmailContent = (order) => {
  const filePath = path.join(
    process.cwd(),
    "templates",
    "bookingExtensionTemplate.html"
  );
  let htmlTemplate = fs.readFileSync(filePath, "utf8");

  let customerDetails =
    '<table style="width: 100%; border-collapse: collapse;">';

  customerDetails += `<tr><td colspan="3"><strong>Name: ${order.emergencyContact1Name} </strong></td></tr>`;
  customerDetails += `<tr><td colspan="3"><strong>Phone: ${order.emergencyContact1Phone} </strong></td></tr>`;
  customerDetails += `<tr><td colspan="3"><strong>Email: ${order.email} </strong></td></tr>`;
  customerDetails += `<tr><td colspan="3"><strong>Camp Location: ${order.location} </strong></td></tr>`;

  customerDetails += "</table>";

  htmlTemplate = htmlTemplate.replace("{{order_id}}", order._id.toString());
  htmlTemplate = htmlTemplate.replace("{{location}}", order.location);
  htmlTemplate = htmlTemplate.replace("{{customerDetails}}", customerDetails);

  return htmlTemplate;
};

export const sendBookingExtensionConfirmationEmail = async (orderId) => {
  await dbConnect();
  const order = await Order.findById(orderId);

  const htmlBody = getHtmlExtensionEmailContent(order);

  const params = {
    Source: "Ecoventure Bookings <info@ecoventureme.com>",
    Destination: {
      ToAddresses: ["info@ecoventureme.com", "chirag@strawberrylabs.net"],
    },
    Message: {
      Subject: {
        Data: `Booking Extension Confirmation | ${orderId}`,
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

// Utility to read and process the HTML file for grouping email
const getHtmlGroupingEmailContent = (
  emergencyContact1Name,
  attendee,
  weekGroup,
  location
) => {
  const filePath = path.join(
    process.cwd(),
    "templates",
    "groupingEmailTemplate.html"
  );
  let htmlContent = fs.readFileSync(filePath, "utf8");
  htmlContent = htmlContent.replace(
    "{{emergencyContact1Name}}",
    emergencyContact1Name
  );
  htmlContent = htmlContent.replace("{{firstName}}", attendee.firstName);
  htmlContent = htmlContent.replace("{{lastName}}", attendee.lastName);
  htmlContent = htmlContent.replace("{{weekGroup}}", weekGroup);
  htmlContent = htmlContent.replace(/{{location}}/g, location);

  return htmlContent;
};

// Send Grouping Email Function
export const sendGroupingEmail = async (
  emergencyContact1Name,
  toEmail,
  attendee,
  weekGroup,
  week,
  location
) => {
  const htmlBody = getHtmlGroupingEmailContent(
    emergencyContact1Name,
    attendee,
    weekGroup,
    location
  );

  const params = {
    Source: "Ecoventure Bookings <info@ecoventureme.com>",
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: `Precamp - October Half Term Holiday Camp | ${attendee.firstName} ${attendee.lastName}`,
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
    console.log("Grouping Email sent:", data);
    return data;
  } catch (error) {
    console.error("Failed to send grouping email:", error);
    throw new Error("Grouping email sending failed");
  }
};

const getHtmlWaitlistUserEmailContent = (emergencyContact1Name, attendees) => {
  const filePath = path.join(
    process.cwd(),
    "templates",
    "waitlistUserEmailTemplate.html"
  );
  console.log(filePath);
  let htmlContent = fs.readFileSync(filePath, "utf8");
  htmlContent = htmlContent.replace(
    "{{emergencyContact1Name}}",
    emergencyContact1Name
  );

  console.log(attendees);

  const attendeesString = attendees
    .map(
      (attendee, _idx) =>
        `${_idx + 1}. <strong> ${attendee.firstName} ${
          attendee.lastName
        } </strong> <br/>`
    )
    .reduce((accumulator, attendee) => accumulator + attendee, "");

  htmlContent = htmlContent.replace("{{attendees}}", attendeesString);

  return htmlContent;
};

export const sendWaitlistUserEmail = async (
  toEmail,
  attendees,
  emergencyContact1Name
) => {
  const htmlBody = getHtmlWaitlistUserEmailContent(
    emergencyContact1Name,
    attendees
  );

  const params = {
    Source: "Ecoventure Bookings <info@ecoventureme.com>",
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: "Waitlist - Holiday Camp",
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

const getHtmlWaitlistAdminEmailContent = (orderId) => {
  const filePath = path.join(
    process.cwd(),
    "templates",
    "waitlistAdminEmailTemplate.html"
  );
  console.log(filePath);
  let htmlContent = fs.readFileSync(filePath, "utf8");
  htmlContent = htmlContent.replace("{{order_id}}", orderId);
  return htmlContent;
};

export const sendWaitlistAdminEmail = async (orderId) => {
  const htmlBody = getHtmlWaitlistAdminEmailContent(orderId);

  const params = {
    Source: "Ecoventure Bookings <info@ecoventureme.com>",
    Destination: {
      ToAddresses: ["info@ecoventureme.com", "chirag@strawberrylabs.net"],
    },
    Message: {
      Subject: {
        Data: "Waitlist - Holiday Camp",
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

const getHtmlWaitlistRejectionUserEmailContent = (
  emergencyContact1Name,
  orderId
) => {
  const filePath = path.join(
    process.cwd(),
    "templates",
    "waitlistRejectionUserEmailTemplate.html"
  );
  console.log(filePath);
  let htmlContent = fs.readFileSync(filePath, "utf8");
  htmlContent = htmlContent.replace(
    "{{emergencyContact1Name}}",
    emergencyContact1Name
  );
  htmlContent = htmlContent.replace("{{order_id}}", orderId);
  return htmlContent;
};

export const sendWaitlistRejectionUserEmail = async (
  toEmail,
  orderId,
  emergencyContact1Name
) => {
  const htmlBody = getHtmlWaitlistRejectionUserEmailContent(
    emergencyContact1Name,
    orderId
  );

  const params = {
    Source: "Ecoventure Bookings <info@ecoventureme.com>",
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: "Waitlist Rejected - Holiday Camp",
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

const getHtmlWaitlistRejectionAdminEmailContent = (orderId) => {
  const filePath = path.join(
    process.cwd(),
    "templates",
    "waitlistRejectionAdminEmailTemplate.html"
  );
  console.log(filePath);
  let htmlContent = fs.readFileSync(filePath, "utf8");
  htmlContent = htmlContent.replace("{{order_id}}", orderId);
  return htmlContent;
};

export const sendWaitlistRejectionAdminEmail = async (orderId) => {
  const htmlBody = getHtmlWaitlistRejectionAdminEmailContent(orderId);

  const params = {
    Source: "Ecoventure Bookings <info@ecoventureme.com>",
    Destination: {
      ToAddresses: ["info@ecoventureme.com", "chirag@strawberrylabs.net"],
    },
    Message: {
      Subject: {
        Data: "Waitlist Rejection - Holiday Camp",
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

const getWaitlistAcceptanceEmailContent = (orderId, bookingLink) => {
  const filePath = path.join(
    process.cwd(),
    "templates",
    "waitlistAcceptanceEmailTemplate.html"
  );
  console.log(filePath);
  let htmlContent = fs.readFileSync(filePath, "utf8");
  htmlContent = htmlContent.replace("{{orderId}}", orderId);
  htmlContent = htmlContent.replace("{{bookingLink}}", bookingLink);
  return htmlContent;
};

// Send Email Function
export const sendWaitlistAcceptanceEmail = async (
  toEmail,
  orderId,
  bookingLink
) => {
  const htmlBody = getWaitlistAcceptanceEmailContent(orderId, bookingLink);

  const params = {
    Source: "Ecoventure Bookings <info@ecoventureme.com>",
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: "Waitlist Accepted - Holiday Camp",
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
