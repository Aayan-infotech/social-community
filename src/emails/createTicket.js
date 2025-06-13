function createTicketHTML(ticketData) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Ticket</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .ticket-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
            max-width: 600px;
            width: 100%;
            position: relative;
        }
        
        .ticket-header {
            background: linear-gradient(135deg, #ff6b6b, #ffd93d);
            padding: 30px;
            text-align: center;
            color: white;
            position: relative;
        }
        
        .ticket-header::before {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 0;
            right: 0;
            height: 20px;
            background: radial-gradient(circle at 10px 10px, transparent 10px, white 10px);
            background-size: 20px 20px;
        }
        
        .event-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .event-subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .ticket-body {
            padding: 40px 30px;
            background: white;
        }
        
        .ticket-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .info-item {
            padding: 15px;
            background: #f8f9ff;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        
        .info-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-size: 16px;
            color: #333;
            font-weight: 600;
        }
        
        .ticket-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 30px;
            background: #f8f9ff;
            border-top: 2px dashed #ddd;
        }
        
        .ticket-id {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #666;
            background: #e9ecef;
            padding: 8px 12px;
            border-radius: 5px;
        }
        
        .qr-placeholder {
            width: 80px;
            height: 80px;
            background: linear-gradient(45deg, #333, #666);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            text-align: center;
        }
        
        .validity {
            text-align: center;
            margin-top: 20px;
            padding: 15px;
            background: #fff3cd;
            border-radius: 8px;
            border: 1px solid #ffeaa7;
        }
        
        .validity-text {
            color: #856404;
            font-size: 14px;
        }
        
        @media (max-width: 600px) {
            .ticket-info {
                grid-template-columns: 1fr;
            }
            
            .ticket-footer {
                flex-direction: column;
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="ticket-container">
        <div class="ticket-header">
            <h1 class="event-title">${ticketData.eventName}</h1>
        </div>
        
        <div class="ticket-body">
            <div class="ticket-info">
                <div class="info-item">
                    <div class="info-label">Date</div>
                    <div class="info-value">${ticketData.date}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Time</div>
                    <div class="info-value">${ticketData.time}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Venue</div>
                    <div class="info-value">${ticketData.venue}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">No of Tickets</div>
                    <div class="info-value">${ticketData.noOfTickets}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Attendee</div>
                    <div class="info-value">${ticketData.attendeeName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Price</div>
                    <div class="info-value">$${ticketData.price}</div>
                </div>
            </div>
            
            <div class="validity">
                <p class="validity-text">
                    ⚠️ Please arrive 30 minutes before the event starts. 
                    This ticket is non-transferable and must be presented with valid ID.
                </p>
            </div>
        </div>
        
        <div class="ticket-footer">
            <div class="ticket-id">
                Ticket ID: ${ticketData.ticketId}
            </div>
            <div class="qr-placeholder" style="background: none; padding: 0;">
                <img src="${ticketData.qrData}" alt="QR Code" style="width: 80px; height: 80px;" />
            </div>
        </div>
    </div>
</body>
</html>`;
}
export {
    createTicketHTML
};