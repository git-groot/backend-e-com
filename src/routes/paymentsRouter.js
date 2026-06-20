

// // src/routes/paymentRouter.js
// // Follows the same pattern as your userRouter.js

// import express from "express"
// const router = express.Router()
// const paymentController = require("../controllers/paymentsController")

// // POST /api/payment/order   → create Razorpay order (before popup)
// router.post("/order", paymentController.createOrder)

// // POST /api/payment/verify  → verify after student pays (after popup)
// router.post("/verify", paymentController.verifyPayment)

// // GET  /api/payment/:id     → get payment details (receipt page)
// router.get("/:id", paymentController.getPayment)

// module.exports = router