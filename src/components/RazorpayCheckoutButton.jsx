import React, { useState } from "react";
import { loadRazorpayScript, createRazorpayOrder, verifyRazorpayPayment } from "../services/razorpayService";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";

/**
 * Razorpay Standard Web Checkout Button Component
 * Follows Razorpay 3-step Standard Checkout lifecycle:
 * 1. Creates order via POST /api/create-order
 * 2. Opens Razorpay Standard Checkout modal with order_id
 * 3. On modal payment success, verifies signature via POST /api/verify-payment
 */
const RazorpayCheckoutButton = ({
  amount, // In rupees (e.g., 1499) or in paise if isAmountInPaise is true
  isAmountInPaise = false,
  currency = "INR",
  customerDetails = {},
  receipt,
  notes = {},
  buttonText,
  className = "",
  disabled = false,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCheckout = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (disabled || loading) return;

    setErrorMessage("");
    setLoading(true);

    try {
      // 1. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error("Razorpay checkout SDK failed to load. Please check your network connection.");
      }

      // Convert rupees to paise if needed
      const amountInPaise = isAmountInPaise ? Math.round(amount) : Math.round(Number(amount) * 100);

      if (isNaN(amountInPaise) || amountInPaise < 100) {
        throw new Error("Order amount must be at least ₹1.00 (100 paise).");
      }

      // 2. Call backend endpoint to create Razorpay Order
      const order = await createRazorpayOrder({
        amount: amountInPaise,
        currency,
        receipt,
        notes,
      });

      const keyId = order.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TtLi1EpzfxaU4d";

      // 3. Configure Razorpay Standard Checkout Options
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Velouraz Jewellery",
        description: "Haute Joaillerie Order Payment",
        image: "/img/logo.png",
        order_id: order.order_id,
        prefill: {
          name: customerDetails.name || "",
          email: customerDetails.email || "",
          contact: customerDetails.phone || customerDetails.contact || "",
        },
        notes: notes || {},
        theme: {
          color: "#2e0e43",
        },
        // Step 2 & 3: Handle Payment Success and verify signature on backend
        handler: async function (response) {
          try {
            setLoading(true);

            // Step 3: Send razorpay_order_id, razorpay_payment_id, and razorpay_signature to /api/verify-payment
            const verification = await verifyRazorpayPayment({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (onPaymentSuccess) {
              await onPaymentSuccess({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                verification,
              });
            }
          } catch (verifyError) {
            console.error("Payment signature verification failed:", verifyError);
            const msg = verifyError.message || "Payment verification failed. Invalid signature.";
            setErrorMessage(msg);
            if (onPaymentError) onPaymentError(verifyError);
          } finally {
            setLoading(false);
          }
        },
        // Handle modal dismiss (user cancelled)
        modal: {
          ondismiss: function () {
            setLoading(false);
            console.log("Payment cancelled: checkout modal was closed by user.");
            if (onPaymentCancel) onPaymentCancel();
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      // Handle payment.failed event
      razorpayInstance.on("payment.failed", function (response) {
        setLoading(false);
        const description = response.error?.description || response.error?.reason || "Transaction failed.";
        console.error("Razorpay Payment Failed Event:", response.error);
        setErrorMessage(`Payment Failed: ${description}`);
        if (onPaymentError) {
          const err = new Error(description);
          err.details = response.error;
          onPaymentError(err);
        }
      });

      // Open payment modal
      razorpayInstance.open();
    } catch (err) {
      console.error("Razorpay checkout initialization error:", err);
      const msg = err.message || "Could not initialize checkout. Please try again.";
      setErrorMessage(msg);
      setLoading(false);
      if (onPaymentError) onPaymentError(err);
    }
  };

  const defaultClasses =
    "w-full bg-[#2e0e43] hover:bg-[#3d1459] text-white py-4 px-6 rounded-xl font-medium tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={disabled || loading}
        className={className || defaultClasses}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-[#C8A46A]" />
            <span>Processing Checkout...</span>
          </>
        ) : (
          buttonText || (
            <>
              <ShieldCheck className="w-5 h-5 text-[#C8A46A]" />
              <span>Pay with Razorpay</span>
            </>
          )
        )}
      </button>

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

export default RazorpayCheckoutButton;
