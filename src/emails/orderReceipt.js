export const generateOrderReceiptHTML = (orderData) => {
    const { seller, buyer, shippingAddress, orderId, invoiceNumber = "", paymentMethod = "Card", items = [] } = orderData;

    const subtotal = items.reduce((acc, item) => acc + (item.product.product_price * item.quantity), 0);
    const discount = items.reduce((acc, item) => acc + (item.product.product_price * item.quantity * item.product.product_discount / 100), 0);
    const totalAmount = subtotal - discount;
    const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

    return `
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                color: #333;
                margin: 20px;
            }
            .invoice-container {
                border: 1px solid #ddd;
                padding: 20px;
                border-radius: 8px;
                background: #fff;
            }
            .invoice-header {
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 20px;
                color: #2c3e50;
                text-transform: uppercase;
            }
            .seller-section {
                margin-bottom: 15px;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 6px;
                background: #f9f9f9;
            }
            .seller-title {
                font-weight: bold;
                margin-bottom: 5px;
                color: #2c3e50;
            }
            .seller-name {
                font-size: 14px;
                font-weight: bold;
                color: #16a085;
            }
            .section-title {
                font-weight: bold;
                margin-bottom: 5px;
                color: #2c3e50;
                text-decoration: underline;
            }
            .invoice-to-section {
                margin-bottom: 20px;
            }
            .invoice-to, .invoice-details {
                font-size: 12px;
                line-height: 1.5;
                background: #fcfcfc;
                border-radius: 6px;
            }
            table.items-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }
            table.items-table th {
                background: #2c3e50;
                color: #fff;
                text-align: center;
                padding: 8px;
                font-size: 11px;
            }
            table.items-table td {
                border: 1px solid #ddd;
                padding: 6px;
            }
            table.items-table tbody tr:nth-child(even) {
                background: #f9f9f9;
            }
            table.items-table tfoot td {
                font-weight: bold;
                background: #ecf0f1;
            }
            .amount-words {
                margin-top: 10px;
                font-weight: bold;
                font-style: italic;
                color: #34495e;
            }
            .terms-conditions {
                margin-top: 20px;
                font-size: 11px;
                color: #555;
            }
            .terms-title {
                font-weight: bold;
                margin-bottom: 5px;
                color: #2c3e50;
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="invoice-header">INVOICE</div>

            <div class="seller-section">
                <div class="seller-title">Sold By / Seller</div>
                <div class="seller-info">
                    <div class="seller-name">${seller.name}</div>
                    <div class="seller-details">
                        <p>${seller.address}</p>
                        <p>${seller.city}, ${seller.state}, ${seller.country}</p>
                        <p>Phone : ${seller.mobile}</p>
                    </div>
                </div>
            </div>

            <div class="invoice-to-section" style="display: flex; gap: 10px;">
                <div class="invoice-to" style="flex: 1; border: 1px solid #ddd; padding: 10px;">
                    <div class="section-title">Bill To</div>
                    <p><strong>Name :</strong> ${buyer.name}</p>
                    <p><strong>Address :</strong> ${shippingAddress.address}</p>
                    <p><strong>City :</strong> ${shippingAddress.city}</p>
                    <p><strong>State :</strong> ${shippingAddress.state}</p>
                    <p><strong>ZIP Code :</strong> ${shippingAddress.pincode}</p>
                    <p><strong>Country :</strong> ${shippingAddress.country}</p>
                </div>
                <div class="invoice-details" style="flex: 1; border: 1px solid #ddd; padding: 10px;">
                    <p><strong>Order ID :</strong> ${orderId}</p>
                    <p><strong>Invoice Number :</strong> ${invoiceNumber}</p>
                    <p><strong>Invoice Date :</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>Payment Method :</strong> ${paymentMethod}</p>
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item #</th>
                        <th>Item</th>
                        <th>Unit Price</th>
                        <th>Discount(%)</th>
                        <th>Qty.</th>
                        <th>Net Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item, index) => {
        const netPrice = item.product.product_price - (item.product.product_price * item.product.product_discount / 100);
        const rowTotal = netPrice * item.quantity;
        return `
                        <tr>
                            <td style="text-align: center;">${index + 1}</td>
                            <td>
                                ${item.product.product_name}<br/>
                                <span style="font-size: 9px; color: #666;">(SKU: ${item.product._id})</span>
                            </td>
                            <td style="text-align: right;">${item.product.product_price}</td>
                            <td style="text-align: right;">${item.product.product_discount}%</td>
                            <td style="text-align: center;">${item.quantity}</td>
                            <td style="text-align: right;">${netPrice}</td>
                            <td style="text-align: right;">${rowTotal}</td>
                        </tr>`;
    }).join("")}
                    <tr style="font-weight: bold; background: #ecf0f1;">
                        <td colspan="4">Total</td>
                        <td style="text-align: center;">${totalQuantity}</td>
                        <td></td>
                        <td style="text-align: right;">${totalAmount}</td>
                    </tr>
                </tbody>
            </table>

            <div class="amount-words">
                Amount in Words: ${convertNumberToWords(totalAmount)}
            </div>

            <div class="terms-conditions">
                <div class="terms-title">Terms & Conditions:</div>
                <ol>
                    <li>Payment is due within 7 days of invoice date unless other arrangements have been made.</li>
                    <li>Returns must be authorized and returned within 4 days of delivery in original condition.</li>
                </ol>
            </div>
        </div>
    </body>
    </html>
    `;
};

// 1 to Million
const convertNumberToWords = (num) => {
    const a = [
        'zero', 'one', 'two', 'three', 'four',
        'five', 'six', 'seven', 'eight', 'nine',
        'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
        'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
    ];
    const b = [
        '', '', 'twenty', 'thirty', 'forty',
        'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
    ];
    const c = [
        'hundred', 'thousand', 'million'
    ];

    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '');
    if (num < 1000) return a[Math.floor(num / 100)] + ' ' + c[0] + (num % 100 ? ' and ' + convertNumberToWords(num % 100) : '');
    if (num < 1000000) return convertNumberToWords(Math.floor(num / 1000)) + ' ' + c[1] + (num % 1000 ? ' ' + convertNumberToWords(num % 1000) : '');
    return convertNumberToWords(Math.floor(num / 1000000)) + ' ' + c[2] + (num % 1000000 ? ' ' + convertNumberToWords(num % 1000000) : '');
}