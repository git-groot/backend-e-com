

// // src/controllers/paymentController.js
// // Thin controller — validates input, calls service, sends response
// // No business logic here — that all lives in paymentService.js

// import paymentService from "../services/paymentService.js"

// // ─────────────────────────────────────────────────────────────────────────────
// // POST /api/payment/order
// // Creates a Razorpay order before the popup opens
// // ─────────────────────────────────────────────────────────────────────────────
// const createOrder = async (req, res) => {
//     try {
//         const { studentName, email, course, phone, amount } = req.body

//         // ── Input validation ──────────────────────────────────────────
//         if (!studentName || !email || !course || !phone || !amount) {
//             return res.status(400).json({
//                 success: false,
//                 message: "studentName, email, course, phone and amount are required",
//             })
//         }

//         if (typeof amount !== "number" || amount <= 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "amount must be a positive number (in rupees)",
//             })
//         }

//         // ── Call service ──────────────────────────────────────────────
//         const data = await paymentService.createOrder({
//             studentName,
//             email,
//             course,
//             phone,
//             amount,
//         })

//         return res.status(200).json({
//             success: true,
//             message: "Order created successfully",
//             data,
//         })

//     } catch (error) {
//         console.error("createOrder error:", error.message)
//         return res.status(500).json({
//             success: false,
//             message: "Failed to create order. Please try again.",
//         })
//     }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // POST /api/payment/verify
// // Verifies payment after student completes Razorpay popup
// // ─────────────────────────────────────────────────────────────────────────────
// const verifyPayment = async (req, res) => {
//     try {
//         const {
//             razorpay_order_id,
//             razorpay_payment_id,
//             razorpay_signature,
//         } = req.body

//         // ── Input validation ──────────────────────────────────────────
//         if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//             return res.status(400).json({
//                 success: false,
//                 message: "razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
//             })
//         }

//         // ── Call service ──────────────────────────────────────────────
//         const payment = await paymentService.verifyPayment({
//             razorpay_order_id,
//             razorpay_payment_id,
//             razorpay_signature,
//         })

//         return res.status(200).json({
//             success: true,
//             message: "Payment verified successfully",
//             paymentId: payment._id,
//             data: payment,
//         })

//     } catch (error) {
//         console.error("verifyPayment error:", error.message)

//         // Signature mismatch = 400 (bad request), not 500
//         const status = error.message.includes("invalid signature") ? 400 : 500

//         return res.status(status).json({
//             success: false,
//             message: error.message || "Payment verification failed",
//         })
//     }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // GET /api/payment/:id
// // Get payment details — used for receipt page
// // ─────────────────────────────────────────────────────────────────────────────
// const getPayment = async (req, res) => {
//     try {
//         const payment = await paymentService.getPaymentById(req.params.id)

//         return res.status(200).json({
//             success: true,
//             data: payment,
//         })

//     } catch (error) {
//         console.error("getPayment error:", error.message)
//         return res.status(404).json({
//             success: false,
//             message: "Payment not found",
//         })
//     }
// }

// module.exports = {
//     createOrder,
//     verifyPayment,
//     getPayment,
// }