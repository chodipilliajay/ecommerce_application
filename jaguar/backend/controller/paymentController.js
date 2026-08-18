import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";
import { instance } from "../server.js";
import crypto from "crypto";
export const processPayment = handleAsyncError(async (req, res, next) => {
  if(!process.env.RAZORPAY_API_KEY || !process.env.RAZORPAY_API_SECRET || process.env.RAZORPAY_API_KEY==='your-api-key'){
    return next(new HandleError("Payment gateway is not configured yet. Please set RAZORPAY_API_KEY and RAZORPAY_API_SECRET in backend/config/config.env with real test keys from https://dashboard.razorpay.com/app/keys",500))
  }
  if(!req.body.amount || Number(req.body.amount)<=0){
    return next(new HandleError("Invalid payment amount",400))
  }
  const options = {
    amount: Math.round(Number(req.body.amount) * 100),
    currency: "INR",
  };
  try{
    const order = await instance.orders.create(options);
    res.status(200).json({
      success: true,
      order,
    });
  }catch(err){
    return next(new HandleError(err.error?.description || "Could not initiate payment. Please check your Razorpay API keys.",500))
  }
});

//Send API Key
export const sendAPIKey = handleAsyncError(async (req, res) => {
  res.status(200).json({
    key: process.env.RAZORPAY_API_KEY,
  });
});

//Payment Verification
export const paymentVerification = handleAsyncError(async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(body.toString())
    .digest("hex");
  const isAuthentic = expectedSignature === razorpay_signature;
  if (isAuthentic) {
    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      reference: razorpay_payment_id,
    });
  } else {
    return res.status(200).json({
      success: false,
      message: "Payment verification failed",
    });
  }
});
