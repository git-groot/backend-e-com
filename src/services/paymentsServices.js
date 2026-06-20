

// // src/services/paymentService.js
// // All Razorpay business logic lives here
// // Controllers stay thin — they just call these functions

// import Razorpay from "razorpay"
// import crypto from "crypto"
// import Payment from "../models/payments.js"


// // ── Razorpay instance ─────────────────────────────────────────────────────────
// // Created once, reused across all service functions
// const razorpay = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET,
// })

// // ─────────────────────────────────────────────────────────────────────────────
// // createOrder
// // Called when student submits the admission form
// // Creates an order in Razorpay and saves a "created" record in MongoDB
// // ─────────────────────────────────────────────────────────────────────────────
// const createOrder = async ({ studentName, email, course, phone, amount }) => {

//     // Create order with Razorpay
//     // amount must be in PAISE → multiply rupees × 100
//     const razorpayOrder = await razorpay.orders.create({
//         amount: Math.round(amount * 100), // ₹500 → 50000 paise
//         currency: "INR",
//         receipt: `rcpt_${Date.now()}`,     // your internal reference
//         notes: {
//             studentName,
//             course,
//             email,
//         },
//     })

//     // Save to MongoDB with status "created"
//     const payment = await Payment.create({
//         studentName,
//         email,
//         course,
//         phone,
//         amount,                             // store in rupees
//         razorpayOrderId: razorpayOrder.id,
//         status: "created",
//     })

//     return {
//         orderId: razorpayOrder.id,        // browser needs this to open popup
//         amount: razorpayOrder.amount,    // in paise
//         currency: razorpayOrder.currency,
//         paymentId: payment._id,             // your DB record id
//     }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // verifyPayment
// // Called after student completes payment in Razorpay popup
// // Verifies the signature — if valid, marks payment as "paid"
// // ─────────────────────────────────────────────────────────────────────────────
// const verifyPayment = async ({
//     razorpay_order_id,
//     razorpay_payment_id,
//     razorpay_signature,
// }) => {

//     // ── Step 1: Re-create the signature ──────────────────────────────
//     // Razorpay signs "order_id|payment_id" with your secret key
//     // We do the same — if both match, the payment is genuine
//     const expectedSignature = crypto
//         .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//         .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//         .digest("hex")

//     const isValid = expectedSignature === razorpay_signature

//     if (!isValid) {
//         // Signature mismatch — mark as failed in DB
//         await Payment.findOneAndUpdate(
//             { razorpayOrderId: razorpay_order_id },
//             { status: "failed" }
//         )
//         throw new Error("Payment verification failed: invalid signature")
//     }

//     // ── Step 2: Update DB record to "paid" ───────────────────────────
//     const payment = await Payment.findOneAndUpdate(
//         { razorpayOrderId: razorpay_order_id },
//         {
//             razorpayPaymentId: razorpay_payment_id,
//             razorpaySignature: razorpay_signature,
//             status: "paid",
//             paidAt: new Date(),
//         },
//         { new: true }  // return the updated document
//     )

//     if (!payment) {
//         throw new Error("Payment record not found for order: " + razorpay_order_id)
//     }

//     return payment
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // getPaymentById
// // Fetch a single payment record — for receipt page
// // ─────────────────────────────────────────────────────────────────────────────
// const getPaymentById = async (paymentId) => {
//     const payment = await Payment.findById(paymentId)
//     if (!payment) throw new Error("Payment not found")
//     return payment
// }

// module.exports = {
//     createOrder,
//     verifyPayment,
//     getPaymentById,
// }