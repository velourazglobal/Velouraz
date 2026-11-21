import {
  db,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "./utils/firebaseServer.js";

// Default coupons fallback matching couponService.js
const DEFAULT_COUPONS = [
  {
    code: "VELOURAZ10",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 1499,
    maxDiscount: 1000,
    expiryDate: "2028-12-31",
    isActive: true,
  },
  {
    code: "LUXE500",
    discountType: "flat",
    discountValue: 500,
    minOrderAmount: 2999,
    maxDiscount: 500,
    expiryDate: "2028-12-31",
    isActive: true,
  },
  {
    code: "ROYAL15",
    discountType: "percentage",
    discountValue: 15,
    minOrderAmount: 4999,
    maxDiscount: 2500,
    expiryDate: "2028-12-31",
    isActive: true,
  },
];

const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON in request body.",
        });
      }
    }

    const {
      items,
      customerDetails,
      couponCode,
      userId,
      // Backward compatibility for raw amount test calls
      amount: rawAmount,
      currency: rawCurrency = "INR",
      receipt: rawReceipt,
      notes: rawNotes = {},
    } = body || {};

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("[Razorpay API] Missing keyId or keySecret in environment.");
      return res.status(500).json({
        success: false,
        message: "Razorpay credentials are not configured on the server.",
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CASE 1: Full Express Checkout Flow (Server-Calculated & Pending Order Saved)
    // ─────────────────────────────────────────────────────────────────────────────
    if (items && Array.isArray(items) && items.length > 0 && customerDetails) {
      // 1. Validate customer details
      const cleanName = (customerDetails.name || "").trim();
      const cleanEmail = normalizeEmail(customerDetails.email);
      const cleanPhone = (customerDetails.phone || "").replace(/\D/g, "");
      const cleanFlat = (customerDetails.flat || "").trim();
      const cleanAddress = (customerDetails.address || "").trim();
      const cleanCity = (customerDetails.city || "").trim();
      const cleanState = (customerDetails.state || "").trim();
      const cleanPincode = (customerDetails.pincode || "").replace(/\D/g, "");

      if (!cleanName || cleanName.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid recipient full name.",
        });
      }

      if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address.",
        });
      }

      if (cleanPhone.length < 10) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 10-digit mobile phone number.",
        });
      }

      if (!cleanAddress || !cleanCity || !cleanState || cleanPincode.length !== 6) {
        return res.status(400).json({
          success: false,
          message: "Please complete all required shipping address fields with a valid 6-digit pincode.",
        });
      }

      // 2. Authoritative Price and Stock Validation from Database
      let calculatedSubtotal = 0;
      const validatedItems = [];

      for (const item of items) {
        const qty = Math.max(1, Number(item.quantity) || 1);
        const productId = item.id;

        if (!productId) {
          return res.status(400).json({
            success: false,
            message: "Invalid product item in cart.",
          });
        }

        // Fetch authoritative product document from Firestore
        let itemPrice = Number(item.price || 0);
        let itemName = item.name || "Velouraz Fine Jewellery";
        let itemImage = item.image || item.primaryImage || "/img/jewellery/j.png";

        try {
          const productRef = doc(db, "products", productId);
          const productSnap = await getDoc(productRef);

          if (productSnap.exists()) {
            const productData = productSnap.data();

            if (productData.deleted === true) {
              return res.status(400).json({
                success: false,
                message: `Product "${productData.name || productId}" is no longer available.`,
              });
            }

            // Check stock availability
            const availableStock = Number(productData.stock ?? 0);
            if (availableStock < qty) {
              return res.status(400).json({
                success: false,
                message: `Only ${availableStock} unit(s) of "${productData.name || "Item"}" available, but ${qty} was requested.`,
              });
            }

            // Use authoritative database price
            if (productData.price !== undefined && !isNaN(Number(productData.price))) {
              itemPrice = Number(productData.price);
            }
            if (productData.name) {
              itemName = productData.name;
            }
            if (productData.images && productData.images.length > 0) {
              itemImage = productData.images[0];
            } else if (productData.image) {
              itemImage = productData.image;
            }
          }
        } catch (dbErr) {
          console.warn(`[Firestore Product Read Notice] ${productId}:`, dbErr?.message);
        }

        calculatedSubtotal += itemPrice * qty;

        validatedItems.push({
          id: productId,
          name: itemName,
          price: itemPrice,
          original_price: Number(item.original_price || itemPrice),
          quantity: qty,
          image: itemImage,
          size: item.size || null,
          metal: item.metal || null,
        });
      }

      // 3. Server-side Coupon Calculation
      let discountAmount = 0;
      let appliedCouponData = null;

      if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
        const cleanCode = couponCode.trim().toUpperCase();
        let foundCoupon = null;

        try {
          const couponSnap = await getDocs(collection(db, "coupons"));
          const firestoreCoupons = couponSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          foundCoupon = firestoreCoupons.find((c) => (c.code || "").toUpperCase() === cleanCode);
        } catch (couponDbErr) {
          console.warn("[Firestore Coupon Read Notice]:", couponDbErr?.message);
        }

        if (!foundCoupon) {
          foundCoupon = DEFAULT_COUPONS.find((c) => c.code === cleanCode);
        }

        if (foundCoupon && foundCoupon.isActive !== false) {
          const minOrder = Number(foundCoupon.minOrderAmount || 0);
          const isNotExpired = !foundCoupon.expiryDate || new Date(foundCoupon.expiryDate).getTime() >= Date.now() - 86400000;

          if (isNotExpired && calculatedSubtotal >= minOrder) {
            if (foundCoupon.discountType === "percentage") {
              let discount = Math.round((calculatedSubtotal * Number(foundCoupon.discountValue || 0)) / 100);
              if (foundCoupon.maxDiscount && Number(foundCoupon.maxDiscount) > 0) {
                discount = Math.min(discount, Number(foundCoupon.maxDiscount));
              }
              discountAmount = Math.min(discount, calculatedSubtotal);
            } else {
              discountAmount = Math.min(Number(foundCoupon.discountValue || 0), calculatedSubtotal);
            }

            appliedCouponData = {
              code: foundCoupon.code,
              discountAmount,
              discountType: foundCoupon.discountType,
            };
          }
        }
      }

      // 4. Calculate Final Authoritative Totals
      const shippingFee = calculatedSubtotal >= 1999 || calculatedSubtotal === 0 ? 0 : 99;
      const finalTotal = Math.max(0, calculatedSubtotal + shippingFee - discountAmount);
      const amountInPaise = Math.round(finalTotal * 100);

      if (amountInPaise < 100) {
        return res.status(400).json({
          success: false,
          message: "Payable amount must be at least ₹1 (100 paise).",
        });
      }

      // 5. Generate internal order ID
      const orderNumber = `VLZ-${Math.floor(100000 + Math.random() * 900000)}`;

      // 6. Create Razorpay Order via official REST API
      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
      const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: orderNumber,
          notes: {
            orderNumber,
            customerName: cleanName,
            customerEmail: cleanEmail,
            customerPhone: cleanPhone,
          },
        }),
      });

      const rzpData = await rzpResponse.json();

      if (!rzpResponse.ok || !rzpData.id) {
        console.error("[Razorpay API Error]:", rzpData);
        return res.status(rzpResponse.status || 500).json({
          success: false,
          message: rzpData.error?.description || "Failed to create Razorpay payment order.",
          error: rzpData.error,
        });
      }

      // 7. Save Temporary Pending Order in Firestore
      const fullShippingAddress = {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        alternatePhone: customerDetails.alternatePhone?.trim() || "",
        flat: cleanFlat,
        address: cleanAddress,
        fullAddress: `${cleanFlat ? cleanFlat + ", " : ""}${cleanAddress}, ${cleanCity}, ${cleanState} - ${cleanPincode}`,
        city: cleanCity,
        state: cleanState,
        pincode: cleanPincode,
        country: customerDetails.country?.trim() || "India",
        type: customerDetails.type || "Home",
      };

      const newOrderDocRef = doc(collection(db, "orders"));
      const internalOrderId = newOrderDocRef.id;

      const pendingOrderData = {
        id: internalOrderId,
        orderId: internalOrderId,
        orderNumber,
        razorpayOrderId: rzpData.id,
        userId: userId || "guest",
        customerName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        alternatePhone: customerDetails.alternatePhone?.trim() || "",
        shippingAddress: fullShippingAddress,
        items: validatedItems,
        subtotal: calculatedSubtotal,
        shippingFee,
        discountAmount,
        couponDetails: appliedCouponData,
        totalAmount: finalTotal,
        total: finalTotal,
        currency: "INR",
        paymentMethod: "RAZORPAY",
        paymentStatus: "PENDING",
        orderStatus: "PENDING",
        stockDeducted: false,
        createdAt: serverTimestamp(),
        orderDate: new Date().toISOString(),
      };

      try {
        await setDoc(newOrderDocRef, pendingOrderData);
      } catch (firestoreWriteErr) {
        console.error("[Firestore Pending Order Write Error]:", firestoreWriteErr);
        // We still proceed so customer can pay, but log warning
      }

      return res.status(200).json({
        success: true,
        orderId: internalOrderId,
        orderNumber,
        razorpayOrderId: rzpData.id,
        amount: rzpData.amount || amountInPaise,
        currency: rzpData.currency || "INR",
        receipt: rzpData.receipt || orderNumber,
        key_id: keyId,
        keyId,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CASE 2: Raw Amount fallback (for backwards-compatible unit testing or API calls)
    // ─────────────────────────────────────────────────────────────────────────────
    const numericAmount = Number(rawAmount);
    if (!rawAmount || isNaN(numericAmount) || numericAmount < 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid request. Provide items and customerDetails or an amount of at least 100 paise (₹1).",
      });
    }

    const amountInPaise = Math.round(numericAmount);
    const orderReceipt = rawReceipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: rawCurrency.toUpperCase(),
        receipt: orderReceipt,
        notes: rawNotes,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Razorpay Order API Error]:", data);
      return res.status(response.status || 500).json({
        success: false,
        message: data.error?.description || "Failed to create order with Razorpay.",
        error: data.error,
      });
    }

    return res.status(200).json({
      success: true,
      order_id: data.id,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      key_id: keyId,
      keyId,
    });
  } catch (error) {
    console.error("Unexpected error in /api/create-order:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error while creating order.",
    });
  }
}
