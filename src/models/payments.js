


// // src/models/payment.js
// // Stores every payment record — both successful and failed

// import mongoose from "mongoose"

// const paymentSchema = new mongoose.Schema(
//     {
//         // ── Student info ──────────────────────────────────────────────
//         studentName: {
//             type: String,
//             required: true,
//             trim: true,
//         },
//         email: {
//             type: String,
//             required: true,
//             trim: true,
//             lowercase: true,
//         },
//         course: {
//             type: String,
//             required: true,
//         },
//         phone: {
//             type: String,
//             required: true,
//         },

//         // ── Payment info ──────────────────────────────────────────────
//         amount: {
//             type: Number,
//             required: true,  // stored in RUPEES (not paise)
//         },
//         currency: {
//             type: String,
//             default: "INR",
//         },

//         // ── Razorpay IDs ──────────────────────────────────────────────
//         razorpayOrderId: {
//             type: String,
//             required: true,
//             unique: true,  // one order per document
//         },
//         razorpayPaymentId: {
//             type: String,
//             default: null,   // filled in after successful payment
//         },
//         razorpaySignature: {
//             type: String,
//             default: null,
//         },

//         // ── Status ────────────────────────────────────────────────────
//         status: {
//             type: String,
//             enum: ["created", "paid", "failed"],
//             default: "created",
//             // created → order made, user hasn't paid yet
//             // paid    → payment verified ✅
//             // failed  → signature mismatch or error
//         },

//         paidAt: {
//             type: Date,
//             default: null,  // set when status becomes "paid"
//         },
//     },
//     {
//         timestamps: true, // adds createdAt and updatedAt automatically
//     }
// )

// module.exports = mongoose.model("Payment", paymentSchema)