import fs from "fs";
import Cart from "../models/addtocart.model.js";
import Order from "../models/orders.model.js";
import Product from "../models/product.model.js";
import TicketBooking from "../models/ticketBooking.model.js";
import { User } from "../models/user.model.js";
import VirtualEvent from "../models/virtualEvent.model.js";
import { generateAndSendTicket } from "../services/generateTicket.js";
import { ApiError } from "./ApiError.js";
import { isValidObjectId } from "./isValidObjectId.js";
import { sendEmail } from "../services/emailService.js";
import { generateOrderReceiptHTML } from "../emails/orderReceipt.js";
import { generatePDFfromHTML } from "./generatePDFfromHTML.js";


export const updateVirtualEventStatus = async (bookingId, bookingStatus, paymentStatus, paymentIntentId = null) => {
    try {
        if (!isValidObjectId(bookingId)) {
            throw new ApiError(400, "Invalid booking ID");
        }

        const booking = await TicketBooking.findById(bookingId).populate(
            "eventId",
            "eventName eventLocation eventStartDate eventEndDate ticketPrice userId"
        );
        if (!booking) {
            throw new ApiError(404, "Booking not found");
        }

        if (booking.bookingStatus === "booked" && booking.paymentStatus === "completed") {
            throw new ApiError(400, "Booking is already completed");
        }

        if (!["booked", "cancelled"].includes(bookingStatus)) {
            throw new ApiError(
                400,
                "Invalid booking status. Must be 'booked' or 'cancelled'"
            );
        }
        if (!["pending", "completed", "failed"].includes(paymentStatus)) {
            throw new ApiError(
                400,
                "Invalid payment status. Must be 'pending', 'completed', or 'failed'"
            );
        }


        if (bookingStatus === "booked" && paymentStatus === "completed") {
            const eventId = booking.eventId._id;
            const eventDetails = await VirtualEvent.findById(eventId);

            if (!eventDetails) {
                throw new ApiError(404, "Event not found");
            }

            if (eventDetails?.noOfSlots !== null && eventDetails?.noOfSlots !== undefined) {
                if (eventDetails.noOfSlots < booking.ticketCount) {
                    throw new ApiError(
                        400,
                        `Not enough slots available. Only ${eventDetails.noOfSlots} slots left`
                    );
                }

                // Update the noOfSlots in the event
                eventDetails.noOfSlots -= booking.ticketCount;

                await eventDetails.save();
            }
        }

        const user = await User.findOne({ userId: booking.userId }).select("userId name email profile_image");
        user.profile_image = user.profile_image || `${process.env.APP_URL}/placeholder/image_place.png`;


        const qrCodeData = {
            ticketId: booking.ticketId,
            eventId: booking.eventId._id,
            eventName: booking.eventId.eventName,
            eventLocation: booking.eventId.eventLocation,
        };

        // base 64 encode the qrCodeData
        const qrCodeDataEncoded = Buffer.from(JSON.stringify(qrCodeData)).toString(
            "base64"
        );

        const eventDetails = {
            ticketId: booking.ticketId,
            eventId: booking.eventId._id,
            eventName: booking.eventId.eventName,
            date: booking.bookingDate,
            time: booking.bookingTime,
            venue: booking.eventId.eventLocation,
            noOfTickets: booking.ticketCount,
            attendeeName: user.name,
            price: booking.totalPrice,
            qrCodeData: qrCodeDataEncoded,
        };

        const ticketFilePath = await generateAndSendTicket(
            eventDetails,
            user.email,
        );

        if (!ticketFilePath.success) {
            throw new ApiError(500, "Failed to generate and send ticket");
        }

        booking.bookingStatus = bookingStatus;
        booking.paymentStatus = paymentStatus;
        booking.paymentIntentId = paymentIntentId;
        const updatedBooking = await booking.save();
        if (!updatedBooking) {
            throw new ApiError(500, "Failed to update booking status");
        }


        return {
            updatedBooking,
            eventDetails,
            user
        };



    } catch (error) {
        console.error("Error updating virtual event status:", error);
        throw new ApiError(500, "Failed to update virtual event status", error.message);
    }
};


export const updateOrderStatus = async (
    orderId,
    paymentStatus,
    orderStatus,
    paymentIntentId = null,
    userId,
    product_ids
) => {
    try {

        const aggregation = [];

        aggregation.push({ $match: { orderId } });
        aggregation.push({
            $lookup: {
                from: "deliveryaddresses",
                localField: "shippingAddressId",
                foreignField: "_id",
                as: "shippingAddress"
            }
        });
        aggregation.push({
            $unwind: {
                path: "$shippingAddress",
                preserveNullAndEmptyArrays: true
            }
        });

        aggregation.push({
            $lookup: {
                from: "products",
                localField: "items.productId",
                foreignField: "_id",
                as: "product"
            }
        });


        aggregation.push({
            $lookup: {
                from: 'users',
                localField: 'sellerId',
                foreignField: 'userId',
                as: 'seller'
            }
        });

        aggregation.push({
            $unwind: {
                path: "$seller",
                preserveNullAndEmptyArrays: true
            }
        });

        aggregation.push({
            $lookup: {
                from: 'users',
                localField: 'buyerId',
                foreignField: 'userId',
                as: 'userDetails'
            }
        });

        aggregation.push({
            $unwind: {
                path: "$userDetails",
                preserveNullAndEmptyArrays: true
            }
        });

        aggregation.push({
            $project: {
                _id: 0,
                orderId: 1,
                buyerId: 1,
                shippingAddress: {
                    name: "$shippingAddress.name",
                    mobile: "$shippingAddress.mobile",
                    alternate_mobile: "$shippingAddress.alternate_mobile",
                    address: "$shippingAddress.address",
                    city: "$shippingAddress.city",
                    state: "$shippingAddress.state",
                    country: "$shippingAddress.country",
                    pincode: "$shippingAddress.pincode"
                },
                totalAmount: 1,
                currency: 1,
                paymentStatus: 1,
                createdAt: 1,
                updatedAt: 1,
                items: {
                    $map: {
                        input: "$items",
                        as: "item",
                        in: {
                            $mergeObjects: [
                                "$$item",
                                {
                                    product: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$product",
                                                    as: "prod",
                                                    cond: { $eq: ["$$prod._id", "$$item.productId"] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                },
                seller: {
                    name: "$seller.name",
                    email: "$seller.email",
                    mobile: "$seller.mobile",
                    address: "$seller.address",
                    city: "$seller.city",
                    state: "$seller.state",
                    country: "$seller.country",
                    profile_image: { $ifNull: ["$seller.profile_image", `${process.env.APP_URL}/placeholder/person.png`] }
                },
                buyer: {
                    name: "$userDetails.name",
                    email: "$userDetails.email",
                    mobile: "$userDetails.mobile",
                    profile_image: { $ifNull: ["$userDetails.profile_image", `${process.env.APP_URL}/placeholder/person.png`] }
                }
            }
        });


        const orders = await Order.aggregate(aggregation);
        if (!orders || orders.length === 0) {
            throw new ApiError(404, "Order not found");
        }

        const updates = {};

        if (paymentStatus) {
            updates.paymentStatus = paymentStatus;
            if (paymentIntentId) updates.paymentIntentId = paymentIntentId;
        }

        if (paymentStatus === "paid" && userId && product_ids?.length > 0) {
            await Cart.deleteMany({ userId, productId: { $in: product_ids } });

            for (const order of orders) {
                for (const item of order.items) {
                    await Product.updateOne(
                        { _id: item.productId },
                        { $inc: { product_quantity: -item.quantity } }
                    );
                }
            }
        }

        let updateQuery = {};
        if (orderStatus) {
            updateQuery = {
                $set: {
                    "items.$[].status": orderStatus,
                    status: orderStatus,
                    placeOrderDate: new Date(),
                    ...updates
                }
            };
        } else if (paymentStatus) {
            updateQuery = { $set: updates };
        }

        const result = await Order.updateMany({ orderId }, updateQuery);

        const htmlEmailContent = fs.readFileSync("./src/emails/orderConfirmation.html", "utf-8");
        const emailContent = htmlEmailContent
            .replace("{{name}}", orders[0].buyer.name)
            .replace("{{orderId}}", orderId)
            .replace("{{orderDate}}", new Date().toLocaleDateString())
            .replace("{{itemTables}}", orders.map(
                order => order.items.map(item => `<div class="order-item">
                    <span>${item.product.product_name}</span>
                    <span>${Number(item.product.product_price) - Number((item.product.product_price * item.product.product_discount) / 100).toFixed(2)}</span>
                </div>`).join(""))
            )
            .replace("{{totalPrice}}", orders.reduce((sum, order) => sum + Number(order.totalAmount), 0))
            .replace("{{shippingAddress}}", `${orders[0]?.shippingAddress?.mobile}, ${orders[0]?.shippingAddress?.alternate_mobile}, ${orders[0]?.shippingAddress?.name}, ${orders[0]?.shippingAddress?.address} ,${orders[0]?.shippingAddress?.city} , ${orders[0]?.shippingAddress?.state}, ${orders[0]?.shippingAddress?.country}, ${orders[0]?.shippingAddress?.pincode}`);


        const send = await sendEmail(orders[0].buyer.email, "Order Confirmation", emailContent);
        if (!send.success) {
            throw new ApiError(500, "Failed to send order confirmation email");
        }


        // // Send order placed mail to vendors
        await Promise.all(orders.map(async order => {
            const vendorEmailContent = fs.readFileSync("./src/emails/vendorOrderConfirmation.html", "utf-8");
            const vendorEmail = vendorEmailContent
                .replace("{{vendorName}}", order.seller.name)
                .replace("{{orderNumber}}", orderId)
                .replace("{{customerName}}", order.buyer.name)
                .replace("{{customerEmail}}", order.buyer.email)
                .replace("{{customerPhone}}", order.buyer.mobile)
                .replace("{{shippingAddress}}", `${order?.shippingAddress?.mobile}, ${order?.shippingAddress?.alternate_mobile}, ${order?.shippingAddress?.address} ,${order?.shippingAddress?.city} , ${order?.shippingAddress?.state}, ${order?.shippingAddress?.country}, ${order?.shippingAddress?.pincode}`)
                .replace("{{orderItems}}", order.items.map(item => `<div class="order-item">
                <span>${item.product.product_name}</span>
                <span>${item.product.product_price - (item.product.product_price * item.product.product_discount) / 100}</span>
            </div>`).join(""));
            const sellerEmail = order.seller.email;

            const orderReceipt = generateOrderReceiptHTML(order);
            const generatedReceipt = await generatePDFfromHTML(orderReceipt);


            const attachments = [
                {
                    filename: `order-${orderId}.pdf`,
                    content: generatedReceipt,
                    contentType: 'application/pdf',
                }
            ]
            const sendVendorEmail = await sendEmail(sellerEmail, "New Order Confirmation", vendorEmail, attachments);
            if (!sendVendorEmail.success) {
                throw new ApiError(500, "Failed to send vendor order confirmation email");
            }
        }));

        const updatedOrders = await Order.find({ orderId });
        return updatedOrders;
    } catch (error) {
        console.error("Error updating order status:", error);
        throw new ApiError(500, "Failed to update order status", error.message);
    }
};

