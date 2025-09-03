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
            max-width: 700px;
            width: 100%;
            position: relative;
        }
        
        .ticket-header {
            background: linear-gradient(135deg, #ff6b6b, #ffd93d);
            padding: 25px 30px;
            text-align: center;
            color: white;
            position: relative;
        }
        
        .ticket-header::after {
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
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .ticket-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            background: white;
        }
        
        .ticket-table td {
            padding: 20px;
            vertical-align: top;
            border: none;
        }
        
        .qr-section {
            width: 200px;
            text-align: center;
            background: #f8f9ff;
            border-right: 2px dashed #ddd;
            position: relative;
        }
        
        .qr-code {
            width: 160px;
            height: 160px;
            background: white;
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .qr-code img {
            width: 140px;
            height: 140px;
            border-radius: 10px;
        }
        
        .scan-text {
            font-size: 12px;
            color: #666;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 15px;
        }
        
        .ticket-id {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            color: #666;
            background: #e9ecef;
            padding: 6px 10px;
            border-radius: 5px;
            display: inline-block;
            transform: rotate(-90deg);
            white-space: nowrap;
            position: absolute;
            left: -25px;
            top: 50%;
            transform-origin: center;
        }
        
        .data-section {
            background: white;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .info-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .info-table tr:last-child td {
            border-bottom: none;
        }
        
        .info-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            font-weight: bold;
            width: 120px;
            background: #f8f9ff;
            border-right: 3px solid #667eea;
        }
        
        .info-value {
            font-size: 16px;
            color: #333;
            font-weight: 600;
            background: white;
        }
        
        .price-row .info-value {
            color: #ff6b6b;
            font-size: 18px;
            font-weight: bold;
        }
        
        .attendee-row .info-value {
            color: #667eea;
            font-weight: bold;
        }
        
        .validity-section {
            background: #fff3cd;
            border-top: 2px dashed #ffeaa7;
            text-align: center;
        }
        
        .validity-text {
            color: #856404;
            font-size: 13px;
            line-height: 1.4;
            margin: 0;
        }
        
        .warning-icon {
            font-size: 16px;
            margin-right: 8px;
        }
        
        @media (max-width: 650px) {
            .ticket-table {
                display: block;
            }
            
            .ticket-table tbody,
            .ticket-table tr,
            .ticket-table td {
                display: block;
                width: 100%;
            }
            
            .qr-section {
                width: 100%;
                border-right: none;
                border-bottom: 2px dashed #ddd;
                text-align: center;
                padding: 20px;
            }
            
            .ticket-id {
                position: static;
                transform: none;
                margin-top: 10px;
            }
            
            .data-section {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="ticket-container">
        <div class="ticket-header">
            <h1 class="event-title" style="color:#2c3e50;text-align:center;">${ticketData.eventName}</h1>
        </div>
        
        <table class="ticket-table">
            <tbody>
                <tr>
                    <td class="qr-section" rowspan="2">
                        <div class="scan-text">Scan to Verify</div>
                        <div class="qr-code">
                            <img src="${ticketData.qrData}" alt="QR Code" />
                        </div>
                        <div class="ticket-id">
                            ID: ${ticketData.ticketId}
                        </div>
                    </td>
                    
                    <td class="data-section">
                        <table class="info-table" data-pdfmake="{&quot;widths&quot;:[&quot;auto&quot;,&quot;*&quot;]}">
                            <tr>
                                <td class="info-label">Event Date</td>
                                <td class="info-value">${ticketData.date}</td>
                            </tr>
                            <tr>
                                <td class="info-label">Event Time</td>
                                <td class="info-value">${ticketData.time}</td>
                            </tr>
                            <tr>
                                <td class="info-label">Venue</td>
                                <td class="info-value">${ticketData.venue}</td>
                            </tr>
                            <tr>
                                <td class="info-label">Quantity</td>
                                <td class="info-value">${ticketData.noOfTickets} Ticket(s)</td>
                            </tr>
                            <tr class="attendee-row">
                                <td class="info-label">Attendee</td>
                                <td class="info-value">${ticketData.attendeeName}</td>
                            </tr>
                            <tr class="price-row">
                                <td class="info-label">Total Price</td>
                                <td class="info-value">$${ticketData.price}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                
                <tr>
                    <td class="validity-section">
                        <p class="validity-text">
                            <span class="warning-icon">⚠️</span>
                            Please arrive 30 minutes before the event starts.<br>
                            This ticket is non-transferable and must be presented with valid ID.
                        </p>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>`;
}

export {
    createTicketHTML
};