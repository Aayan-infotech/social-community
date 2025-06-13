import { generateQRCodeData } from "../utils/HelperFunctions.js";
import { createTicketHTML } from "../emails/createTicket.js";
import { generatePDFfromHTML } from "../utils/generatePDFfromHTML.js";
import { sendEmail } from "./emailService.js";
import { ApiError } from "../utils/ApiError.js";


async function generateAndSendTicket(eventDetails, recipientEmail) {
    try {
        // Generate ticket data
        const ticketId = eventDetails.ticketId ;
        const qrData = await generateQRCodeData(ticketId, eventDetails.eventId);

        const ticketData = {
            ticketId: ticketId,
            eventName: eventDetails.eventName,
            eventType: eventDetails.eventType,
            date: eventDetails.date,
            time: eventDetails.time,
            venue: eventDetails.venue,
            noOfTickets: eventDetails.noOfTickets,
            attendeeName: eventDetails.attendeeName,
            price: eventDetails.price,
            qrData: qrData
        };

        // Generate HTML ticket
        const ticketHTML = createTicketHTML(ticketData);
        const pdfBuffer = await generatePDFfromHTML(ticketHTML);

        const mailOptions = {
            subject: `🎫 Your Ticket for ${eventDetails.eventName}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Event Ticket is Ready!</h2>
          <p>Dear ${eventDetails.attendeeName},</p>
          <p>Thank you for your booking! Please find your event ticket below:</p>
          <hr style="margin: 20px 0;">
          ${ticketHTML}
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 14px;">
            Please save this email and present your ticket (digital or printed) at the venue.<br>
            For any queries, contact us at support@example.com
          </p>
        </div>
      `,
            attachments: [
                {
                    filename: `ticket-${ticketId}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                }
            ]
        };

        // Send email
        const emailResponse = await sendEmail('ankul.yadav@aayaninfotech.com', mailOptions.subject, mailOptions.html, mailOptions.attachments);
        if (!emailResponse.success) {
            throw new ApiError(500, 'Failed to send ticket email');
        }

        return {
            success: true,
            message: 'Ticket generated and sent successfully',
        };


    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
export {
    generateAndSendTicket
};