export const generateOrderReceiptHTML = (orderData) => {
    const { seller, buyer, shippingAddress, orderId, invoiceNumber = "", paymentMethod = "Card", items = [] } = orderData;

    const subtotal = items.reduce((acc, item) => acc + (item.product.product_price * item.quantity), 0);
    const discount = items.reduce((acc, item) => acc + (item.product.product_price * item.quantity * item.product.product_discount / 100), 0);
    const totalAmount = subtotal - discount;
    const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

    return `
    <div class="invoice-container">
            <h1 class="invoiceHeader" style="color:#2c3e50;text-align:center;">INVOICE</h1>
            <table data-pdfmake="{&quot;widths&quot;:[500]}">
               <thead>
                   <tr>
                       <th style="width: 50%;border:none;">Seller/Sold By</th>
                   </tr>
               </thead>
                <tbody>
                    <tr>
                        <td style="width: 50%;border:none;"><strong>Seller Name:</strong> ${seller.name}</td>
                    </tr>
                    <tr>
                        <td style="border:none;"><strong>Seller Address:</strong> ${seller.address} , ${seller.city}, ${seller.state}, ${seller.country}</td>
                    </tr>
                    <tr>
                        <td style="border:none;"><strong>Seller Phone:</strong> ${seller.mobile}</td>
                    </tr>
                    <tr>
                        <td style="border:none;"><strong>Seller Email:</strong> ${seller.email}</td>
                    </tr>
                </tbody>
            </table>


            <table data-pdfmake="{&quot;widths&quot;:[500]}">
            <thead>
                <tr>
                    <th style="border:none;">Bill To</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border:none;"><strong>Name:</strong> ${buyer.name}</td>
                </tr>
                <tr>
                    <td style="border:none;"><strong>Phone:</strong> ${buyer.mobile}</td>
                </tr>
                <tr>
                    <td style="border:none;"><strong>Email:</strong> ${buyer.email}</td>
                </tr>
                 <tr>
                    <td style="border:none;"><strong>Address:</strong> ${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.country}</td>
                </tr>
                <tr>
                    <td style="border:none;"><strong>Phone:</strong> ${shippingAddress.mobile}</td>
                </tr>
                <tr>
                    <td style="border:none;"><strong>Alternate Phone:</strong> ${shippingAddress.alternate_mobile}</td>
                </tr>
            </tbody>
            </table>



            <table class="items-table" data-pdfmake="{&quot;widths&quot;:[100,&quot;*&quot;,&quot;auto&quot;,&quot;auto&quot;,&quot;auto&quot;,&quot;auto&quot;,&quot;auto&quot;]}">
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