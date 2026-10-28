/**
 * Razorpay Standard Web Checkout Client Service
 * Handles script injection, order creation, modal checkout lifecycle, and signature verification.
 */

/**
 * Dynamically loads Razorpay Standard Checkout SDK if not already present
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if script is already injected
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Step 1: Calls backend endpoint to create an order
 * @param {Object} params
 * @param {number} params.amount Amount in paise (minimum 100 paise)
 * @param {string} [params.currency='INR'] Currency code
 * @param {string} [params.receipt] Unique receipt identifier
 * @param {Object} [params.notes] Metadata key-values
 * @returns {Promise<{ order_id: string, amount: number, currency: string, key_id: string }>}
 */
export const createRazorpayOrder = async ({
  amount,
  currency = "INR",
  receipt,
  notes = {},
}) => {
  const numericAmount = Math.round(Number(amount));
  if (!numericAmount || isNaN(numericAmount) || numericAmount < 100) {
    throw new Error("Amount must be at least 100 paise (₹1).");
  }

  const response = await fetch("/api/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: numericAmount,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to create Razorpay order.");
  }

  return {
    order_id: data.order_id || data.orderId,
    amount: data.amount,
    currency: data.currency,
    key_id: data.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
  };
};

/**
 * Step 3: Calls backend endpoint to verify HMAC signature
 * @param {Object} params
 * @param {string} params.order_id Razorpay Order ID
 * @param {string} params.payment_id Razorpay Payment ID
 * @param {string} params.signature Razorpay generated signature
 * @returns {Promise<{ success: boolean, verified: boolean, message: string }>}
 */
export const verifyRazorpayPayment = async ({
  order_id,
  payment_id,
  signature,
}) => {
  if (!order_id || !payment_id || !signature) {
    throw new Error("Missing payment credentials for signature verification.");
  }

  const response = await fetch("/api/verify-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_id,
      payment_id,
      signature,
      razorpay_order_id: order_id,
      razorpay_payment_id: payment_id,
      razorpay_signature: signature,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Payment signature verification failed.");
  }

  return data;
};

/**
 * Step 2: Open Standard Razorpay Checkout Modal
 * @param {Object} options Configuration options
 */
export const launchRazorpayCheckout = async ({
  order_id,
  amount,
  currency = "INR",
  key_id,
  name = "Velouraz Jewellery",
  description = "Luxury Jewellery Order",
  image = "/img/logo.png",
  prefill = {},
  theme = { color: "#2e0e43" },
  notes = {},
  onSuccess,
  onError,
  onDismiss,
}) => {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    const err = new Error("Razorpay SDK failed to load. Please check your internet connection.");
    if (onError) onError(err);
    else alert(err.message);
    return;
  }

  const razorpayKey =
    key_id ||
    import.meta.env.VITE_RAZORPAY_KEY_ID ||
    "rzp_test_TtLi1EpzfxaU4d";

  const options = {
    key: razorpayKey,
    amount,
    currency,
    name,
    description,
    image,
    order_id,
    prefill: {
      name: prefill.name || "",
      email: prefill.email || "",
      contact: prefill.contact || prefill.phone || "",
    },
    notes: notes || {},
    theme: theme || { color: "#2e0e43" },
    handler: async function (response) {
      try {
        // Automatically verify signature on backend
        const verification = await verifyRazorpayPayment({
          order_id: response.razorpay_order_id || order_id,
          payment_id: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });

        if (onSuccess) {
          onSuccess({
            ...response,
            order_id: response.razorpay_order_id || order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            verified: true,
            verification,
          });
        }
      } catch (verifyErr) {
        console.error("Payment verification failure:", verifyErr);
        if (onError) {
          onError(verifyErr);
        } else {
          alert(`Verification failed: ${verifyErr.message}`);
        }
      }
    },
    modal: {
      ondismiss: function () {
        console.log("Razorpay payment modal closed by user.");
        if (onDismiss) onDismiss();
      },
    },
  };

  const paymentInstance = new window.Razorpay(options);

  // Handle failure event
  paymentInstance.on("payment.failed", function (failResponse) {
    console.error("Razorpay payment failed:", failResponse.error);
    const failError = new Error(
      failResponse.error?.description ||
      failResponse.error?.reason ||
      "Payment processing failed."
    );
    failError.details = failResponse.error;
    if (onError) {
      onError(failError);
    } else {
      alert(`Payment Failed: ${failError.message}`);
    }
  });

  paymentInstance.open();
  return paymentInstance;
};
