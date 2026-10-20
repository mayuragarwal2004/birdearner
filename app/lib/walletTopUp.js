import RazorpayCheckout from "react-native-razorpay";
import apiService from "./apiService";

// Collects `amount` (in rupees) through Razorpay and credits it to the client's wallet.
// Uses the same order, verify and wallet-deposit steps as the Add Money screen.
// Resolves to { success: true } or { success: false, cancelled, message }.
export const payAmountToWallet = async ({ amount, name, email, phone, pictureUrl, description }) => {
  const payable = Math.round(Number(amount) * 100) / 100;
  if (!payable || payable <= 0) {
    return { success: false, cancelled: false, message: "Invalid amount" };
  }

  try {
    await apiService.init();

    const orderResponse = await apiService.createPaymentOrder(payable, "WALLET_DEPOSIT");
    if (!orderResponse?.success) {
      return { success: false, cancelled: false, message: orderResponse?.message || "Could not start payment" };
    }

    const { order } = orderResponse;
    const razorpayResponse = await RazorpayCheckout.open({
      description: description || `Pay ₹${payable.toFixed(2)}`,
      image: pictureUrl,
      currency: order.currency,
      key: order.key,
      amount: order.amount,
      order_id: order.id,
      name,
      prefill: { email, phone: phone || "", name },
      theme: { color: "#4B0082" },
    });

    const verification = await apiService.verifyPayment({
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature,
    });

    if (!verification?.success) {
      return { success: false, cancelled: false, message: verification?.message || "Payment verification failed" };
    }
    return { success: true };
  } catch (error) {
    const cancelled =
      error?.code === 0 ||
      error?.description === "Payment Cancelled" ||
      error?.error?.description === "Payment Cancelled";
    return {
      success: false,
      cancelled,
      message: cancelled ? "Payment was cancelled" : error?.message || "Payment failed",
    };
  }
};
