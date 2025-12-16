// /pages/api/create-order.js
// Razorpay order creation (server-side)
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { amount, receipt } = req.body; // amount in paise

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
      payment_capture: 1,
    });
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// /pages/api/verify-payment.js
// Verify payment signature
import crypto from "crypto";

export async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.status(200).json({ verified: true });
  } else {
    res.status(400).json({ verified: false });
  }
}

// /pages/api/orders.js
// Save order & generate GST invoice
import { saveOrder, generateGSTInvoice } from "../../lib/orders";

export async function createOrder(req, res) {
  const order = await saveOrder(req.body);
  const invoice = await generateGSTInvoice(order);
  res.status(200).json({ order, invoice });
}

// lib/orders.js (pseudo-implementation)
export async function saveOrder(data) {
  // save to MongoDB
  return { ...data, orderId: Date.now() };
}

export async function generateGSTInvoice(order) {
  // generate PDF invoice with GST breakup
  return { invoiceNo: `PP-${order.orderId}` };
}

// WhatsApp Auto Message (client-side)
export const whatsappCheckout = (order) => {
  const msg = `New Order - Pahadi Poshan%0AOrder ID: ${order.id}%0ATotal: ₹${order.total}%0AAddress: ${order.address}`;
  window.open(`https://wa.me/91XXXXXXXXXX?text=${msg}`);
};
