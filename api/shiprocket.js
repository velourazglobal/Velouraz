import {
  db,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "../server-utils/firebaseServer.js";
import { sendMailWithFallback } from "../server-utils/mailer.js";

// ─── Token In-Memory Cache ───────────────────────────────────────────────────
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Obtain valid Shiprocket JWT token with caching and auto-refresh
 */
async function getShiprocketToken(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedToken && tokenExpiresAt > now + 60 * 60 * 1000) {
    return cachedToken;
  }

  const email = (process.env.SHIPROCKET_EMAIL || "").trim();
  const password = (process.env.SHIPROCKET_PASSWORD || "").trim();

  if (!email || !password) {
    throw new Error(
      "Shiprocket credentials not configured. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in environment variables."
    );
  }

  console.log(`[Shiprocket Auth] Authenticating for account: ${email}`);

  const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok || !data.token) {
    console.error("[Shiprocket Auth Error]:", data);
    throw new Error(data.message || "Failed to authenticate with Shiprocket API.");
  }

  cachedToken = data.token;
  // Shiprocket tokens last ~10 days (864,000,000 ms). We refresh after 7 days
  tokenExpiresAt = now + 7 * 24 * 60 * 60 * 1000;
  console.log("[Shiprocket Auth] Token cached successfully.");
  return cachedToken;
}

/**
 * Helper to call Shiprocket external API with auto-retry on 401 Unauthorized
 */
async function callShiprocketApi(endpoint, options = {}) {
  let token = await getShiprocketToken();
  const url = `https://apiv2.shiprocket.in/v1/external/${endpoint.replace(/^\//, "")}`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  let res = await fetch(url, { ...options, headers });

  // If token expired on server, re-authenticate once and retry
  if (res.status === 401) {
    console.warn("[Shiprocket API] Token expired (401). Refreshing token and retrying...");
    token = await getShiprocketToken(true);
    headers.Authorization = `Bearer ${token}`;
    res = await fetch(url, { ...options, headers });
  }

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * Send customer email when shipment is packed & assigned AWB
 */
async function sendShipmentNotificationEmail(order, shipping) {
  try {
    const customerEmail =
      order.email ||
      order.shippingAddress?.email ||
      order.customerEmail ||
      order.billing_email;

    if (!customerEmail) return;

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpUser || !smtpPass) {
      console.warn(`[DEV MODE] Simulated shipping email for AWB: ${shipping.awbCode}`);
      return;
    }

    const orderId = order.orderNumber || order.id || "N/A";
    const customerName = order.customerName || order.shippingAddress?.name || "Valued Collector";
    const courierName = shipping.courierName || "Shiprocket Express Air";
    const awbCode = shipping.awbCode || "N/A";
    const estDelivery = shipping.estimatedDeliveryDate || "3-5 Business Days";
    const trackingUrl = shipping.trackingUrl || `https://shiprocket.co/tracking/${awbCode}`;

    const fromAddress =
      process.env.SMTP_FROM ||
      (smtpUser ? `"Velouraz Logistics" <${smtpUser}>` : '"Velouraz Dispatch" <dispatch@velouraz.in>');

    await sendMailWithFallback({
      from: fromAddress,
      to: customerEmail,
      subject: `Your Velouraz Order #${orderId} Has Been Packed & Dispatched! (AWB: ${awbCode})`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d0b0e; color: #ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" maxWidth="580" style="max-width: 580px; background-color: #161217; border: 1px solid #2e2633; border-radius: 14px; overflow: hidden; padding: 40px 30px;">
                  <tr>
                    <td align="center" style="padding-bottom: 20px;">
                      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; color: #d4af37; letter-spacing: 4px;">VELOURAZ</h1>
                      <p style="margin: 5px 0 0 0; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #8a8292;">Insured Express Logistics</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top: 1px solid #2e2633; padding-top: 25px;">
                      <h2 style="font-size: 18px; color: #ffffff; margin-bottom: 12px;">Your Order is Packed & Handed to Courier</h2>
                      <p style="font-size: 14px; color: #b5adc0; line-height: 1.6; margin: 0 0 24px 0;">
                        Dear <strong>${customerName}</strong>,<br><br>
                        Your handcrafted jewellery order has been safely packed in tamper-proof insured casing and registered with <strong>${courierName}</strong>.
                      </p>

                      <div style="background: #1e1921; border-radius: 10px; border: 1px solid #2e2633; padding: 20px; margin-bottom: 25px;">
                        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px; color: #ffffff;">
                          <tr>
                            <td width="40%" style="color: #8a8292;">Order Reference:</td>
                            <td style="color: #ffffff; font-weight: bold;">#${orderId}</td>
                          </tr>
                          <tr>
                            <td style="color: #8a8292;">Courier Partner:</td>
                            <td style="color: #d4af37; font-weight: bold;">${courierName}</td>
                          </tr>
                          <tr>
                            <td style="color: #8a8292;">AWB Tracking No:</td>
                            <td style="font-family: monospace; font-size: 15px; color: #22c55e; font-weight: bold;">${awbCode}</td>
                          </tr>
                          <tr>
                            <td style="color: #8a8292;">Expected Delivery:</td>
                            <td style="color: #ffffff;">${estDelivery}</td>
                          </tr>
                        </table>
                      </div>

                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #811331; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 14px; letter-spacing: 1px;">
                          TRACK SHIPMENT LIVE
                        </a>
                      </div>

                      <p style="font-size: 13px; color: #8a8292; line-height: 1.5; margin: 0;">
                        Live tracking is also integrated into your Velouraz Account dashboard.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="border-top: 1px solid #2e2633; margin-top: 30px; padding-top: 25px;">
                      <p style="font-size: 12px; color: #6b6374; margin: 0;">
                        © ${new Date().getFullYear()} VELOURAZ. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log(`[Shiprocket] Shipping email sent to ${customerEmail} for Order #${orderId}`);
  } catch (err) {
    console.warn("[Shiprocket Email Notice]:", err?.message || err);
  }
}

export default async function handler(req, res) {
  // CORS Headers
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

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      // fallback
    }
  }

  const action = req.query?.action || body?.action;

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: get-pickups (Retrieve registered pickup locations)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "get-pickups" || (req.method === "GET" && action === "pickups")) {
      const response = await callShiprocketApi("settings/company/pickup", { method: "GET" });
      if (!response.ok) {
        // Fallback to registered default pickup
        return res.status(200).json({
          success: true,
          defaultLocation: process.env.SHIPROCKET_PICKUP_LOCATION || "work",
          pickupLocations: [
            {
              pickup_location: "work",
              name: "Zahabiya Kalabhai",
              phone: "8349445352",
              address: "783, Raj gold Residency, flat no. 104",
              city: "Indore",
              state: "Madhya Pradesh",
              pin_code: "452014",
              country: "India",
            },
          ],
        });
      }

      const shippingAddresses = response.data?.data?.shipping_address || [];
      const primary = shippingAddresses.find((a) => a.is_primary_location === 1) || shippingAddresses[0];

      return res.status(200).json({
        success: true,
        defaultLocation: primary?.pickup_location || process.env.SHIPROCKET_PICKUP_LOCATION || "work",
        pickupLocations: shippingAddresses,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: check-serviceability (Check couriers & shipping rates)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "check-serviceability") {
      const pickup_postcode = String(
        req.query?.pickup_postcode || body?.pickup_postcode || "452014"
      ).trim();
      const delivery_postcode = String(
        req.query?.delivery_postcode || body?.delivery_postcode || ""
      ).replace(/\D/g, "").trim();
      const weight = String(req.query?.weight || body?.weight || "0.35").trim();
      const cod = "0"; // Prepaid orders only

      if (!delivery_postcode || delivery_postcode.length !== 6) {
        return res.status(400).json({
          success: false,
          serviceable: false,
          message: "Please provide a valid 6-digit delivery pincode.",
        });
      }

      const srEmail = (process.env.SHIPROCKET_EMAIL || "").trim();
      const srPass = (process.env.SHIPROCKET_PASSWORD || "").trim();

      // In local dev without Shiprocket credentials, provide realistic simulation
      if (!srEmail || !srPass) {
        console.warn("[Shiprocket Serviceability] Credentials not configured in environment. Using simulated serviceability.");
        const isCommonPin = /^[1-8][0-9]{5}$/.test(delivery_postcode);
        if (!isCommonPin) {
          return res.status(200).json({
            success: true,
            serviceable: false,
            simulated: true,
            pickup_postcode,
            delivery_postcode,
            couriersCount: 0,
            couriers: [],
            message: `Delivery is currently not available for pincode ${delivery_postcode}.`,
          });
        }

        const estDays = delivery_postcode.startsWith("45") ? 1 : delivery_postcode.startsWith("4") ? 2 : 3;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + estDays);
        const etdDateStr = targetDate.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });

        const simulatedCouriers = [
          {
            courier_company_id: 10,
            courier_name: "Xpressbees Air",
            rate: 35,
            etd: targetDate.toISOString().split("T")[0],
            estimated_delivery_days: estDays,
            rating: 4.5,
            call_type: "air",
          },
          {
            courier_company_id: 1,
            courier_name: "Blue Dart Air",
            rate: 45,
            etd: targetDate.toISOString().split("T")[0],
            estimated_delivery_days: estDays + 1,
            rating: 4.8,
            call_type: "air",
          },
        ];

        return res.status(200).json({
          success: true,
          serviceable: true,
          simulated: true,
          pickup_postcode,
          delivery_postcode,
          couriersCount: simulatedCouriers.length,
          couriers: simulatedCouriers,
          fastestCourier: simulatedCouriers[0],
          estimatedDeliveryDays: estDays,
          etd: targetDate.toISOString().split("T")[0],
          formattedEtd: etdDateStr,
        });
      }

      // Live Shiprocket API call
      const params = new URLSearchParams({
        pickup_postcode,
        delivery_postcode,
        weight,
        cod,
      });

      const response = await callShiprocketApi(`courier/serviceability/?${params.toString()}`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorMsg = response.data?.message || "";
        const isNotServiceable =
          response.status === 404 ||
          response.status === 422 ||
          /not serviceable|no courier|unserviceable|service not available/i.test(errorMsg);

        if (isNotServiceable) {
          return res.status(200).json({
            success: true,
            serviceable: false,
            pickup_postcode,
            delivery_postcode,
            couriersCount: 0,
            couriers: [],
            message: errorMsg || `Delivery is currently not available for pincode ${delivery_postcode}.`,
          });
        }

        return res.status(response.status || 400).json({
          success: false,
          serviceable: false,
          message: errorMsg || "Delivery location serviceability check failed.",
          error: response.data,
        });
      }

      const couriers = response.data?.data?.available_courier_companies || [];
      const formattedCouriers = couriers.map((c) => ({
        courier_company_id: c.courier_company_id,
        courier_name: c.courier_name,
        rate: Number(c.rate || 0),
        etd: c.etd,
        estimated_delivery_days: c.estimated_delivery_days,
        rating: c.rating,
        min_weight: c.min_weight,
        call_type: c.call_type,
        city: c.city || response.data?.data?.delivery_city || "",
        state: c.state || response.data?.data?.delivery_state || "",
      }));

      // Sort by fastest delivery first (lowest estimated_delivery_days), then lowest rate
      formattedCouriers.sort((a, b) => {
        const daysA = Number(a.estimated_delivery_days) || 999;
        const daysB = Number(b.estimated_delivery_days) || 999;
        if (daysA !== daysB) return daysA - daysB;
        return a.rate - b.rate;
      });

      const fastestCourier = formattedCouriers[0] || null;
      const minDays = fastestCourier ? Number(fastestCourier.estimated_delivery_days) : null;
      const etd = fastestCourier?.etd || null;

      return res.status(200).json({
        success: true,
        serviceable: formattedCouriers.length > 0,
        pickup_postcode,
        delivery_postcode,
        couriersCount: formattedCouriers.length,
        couriers: formattedCouriers,
        fastestCourier,
        estimatedDeliveryDays: !isNaN(minDays) ? minDays : null,
        etd,
        city: fastestCourier?.city || response.data?.data?.delivery_city || null,
        state: fastestCourier?.state || response.data?.data?.delivery_state || null,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: create-shipment (Create adhoc order, assign AWB, generate label)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "create-shipment" && req.method === "POST") {
      const {
        orderId,
        customerDetails = {},
        pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || "work",
        packageDetails = {},
        courierId = null,
      } = body;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order ID is required to create a shipment.",
        });
      }

      // 1. Fetch current order from Firestore
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        return res.status(404).json({
          success: false,
          message: `Order #${orderId} does not exist in the database.`,
        });
      }

      const orderData = orderSnap.data();

      // Idempotency: Prevent duplicate shipment creation if already created
      if (orderData.shipping?.shiprocketOrderId && orderData.shipping?.awbCode) {
        return res.status(200).json({
          success: true,
          alreadyCreated: true,
          message: "Shipment already exists for this order.",
          shipping: orderData.shipping,
        });
      }

      // 2. Validate Package Details (strictly positive numbers)
      const length = Number(packageDetails.length);
      const breadth = Number(packageDetails.breadth);
      const height = Number(packageDetails.height);
      const weight = Number(packageDetails.weight);

      if (
        isNaN(length) || length <= 0 ||
        isNaN(breadth) || breadth <= 0 ||
        isNaN(height) || height <= 0 ||
        isNaN(weight) || weight <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Please enter valid, positive dimensions (length, breadth, height in cm) and weight (in kg).",
        });
      }

      // 3. Resolve Customer & Address
      const cName = (customerDetails.name || orderData.customerName || orderData.shippingAddress?.name || "Customer").trim();
      const cEmail = (customerDetails.email || orderData.email || orderData.shippingAddress?.email || "").trim();
      const cPhone = (customerDetails.phone || orderData.phone || orderData.shippingAddress?.phone || "").replace(/\D/g, "");
      const cAddress = (customerDetails.address || orderData.shippingAddress?.address || "").trim();
      const cFlat = (customerDetails.flat || orderData.shippingAddress?.flat || "").trim();
      const cCity = (customerDetails.city || orderData.shippingAddress?.city || "").trim();
      const cState = (customerDetails.state || orderData.shippingAddress?.state || "").trim();
      const cPincode = (customerDetails.pincode || orderData.shippingAddress?.pincode || "").replace(/\D/g, "");
      const cCountry = (customerDetails.country || orderData.shippingAddress?.country || "India").trim();

      if (!cName || !cPhone || !cAddress || !cCity || !cState || cPincode.length !== 6) {
        return res.status(400).json({
          success: false,
          message: "Customer delivery details are incomplete. Name, phone, street address, city, state, and 6-digit pincode are required.",
        });
      }

      // 4. Check delivery pincode serviceability
      const servCheck = await callShiprocketApi(
        `courier/serviceability/?pickup_postcode=452014&delivery_postcode=${cPincode}&weight=${weight}&cod=0`,
        { method: "GET" }
      );

      const availableCouriers = servCheck.data?.data?.available_courier_companies || [];
      if (availableCouriers.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Delivery pincode ${cPincode} is currently unserviceable by Shiprocket couriers.`,
        });
      }

      // Pick chosen courier or highest rated/cheapest available
      let selectedCourier = null;
      if (courierId) {
        selectedCourier = availableCouriers.find((c) => Number(c.courier_company_id) === Number(courierId));
      }
      if (!selectedCourier) {
        selectedCourier = availableCouriers[0];
      }

      // 5. Format Order Items
      const rawItems = orderData.items || [];
      const orderItems = rawItems.map((item, idx) => ({
        name: String(item.name || `Jewellery Piece #${idx + 1}`).slice(0, 100),
        sku: String(item.sku || item.id || `VEL-SKU-${idx + 1}`).slice(0, 50),
        units: Math.max(1, Number(item.quantity || 1)),
        selling_price: Math.max(1, Number(item.price || 0)),
        discount: 0,
        tax: 0,
        hsn: 711319, // Gold/silver artificial jewellery HSN
      }));

      // Authoritative pricing breakdown for Shiprocket:
      // Shiprocket calculates Total Invoice Value as: (sub_total + shipping_charges + giftwrap + transaction - total_discount).
      // orderData.totalAmount is the final total amount paid by the customer.
      const finalPaidAmount = Math.max(1, Number(orderData.totalAmount || orderData.total || 0));
      const shippingCharges = Number(orderData.shippingFee || 0);
      const discount = Number(orderData.discountAmount || 0);

      // Subtotal is the items' cost BEFORE shipping and discounts
      let subTotal = orderData.subtotal !== undefined
        ? Number(orderData.subtotal)
        : Math.max(1, finalPaidAmount - shippingCharges + discount);

      // Ensure that (subTotal + shippingCharges - discount) equals exactly finalPaidAmount
      if (Math.abs((subTotal + shippingCharges - discount) - finalPaidAmount) > 0.01) {
        subTotal = Math.max(1, finalPaidAmount - shippingCharges + discount);
      }

      if (orderItems.length === 0) {
        orderItems.push({
          name: "VELOURAZ Item",
          sku: `VEL-${orderId.slice(0, 8)}`,
          units: 1,
          selling_price: subTotal,
          discount: 0,
          tax: 0,
          hsn: 711319,
        });
      }

      // Format Date in YYYY-MM-DD HH:mm format for Shiprocket
      const d = orderData.orderDate ? new Date(orderData.orderDate) : new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const orderDateFormatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

      // 6. Call Shiprocket Create Adhoc Order API
      const adhocPayload = {
        order_id: String(orderData.orderNumber || orderId).slice(0, 50),
        order_date: orderDateFormatted,
        pickup_location: pickupLocation,
        channel_id: "",
        comment: "VELOURAZ Express Delivery",
        billing_customer_name: cName,
        billing_last_name: "",
        billing_address: cFlat ? `${cFlat}, ${cAddress}` : cAddress,
        billing_address_2: "",
        billing_city: cCity,
        billing_pincode: cPincode,
        billing_state: cState,
        billing_country: cCountry,
        billing_email: cEmail || "customer@velouraz.in",
        billing_phone: cPhone,
        shipping_is_billing: true,
        order_items: orderItems,
        payment_method: "Prepaid",
        shipping_charges: shippingCharges,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: discount,
        sub_total: subTotal,
        length,
        breadth,
        height,
        weight,
      };

      console.log(`[Shiprocket] Creating order for #${orderId} with pickup "${pickupLocation}"...`);
      const createOrderRes = await callShiprocketApi("orders/create/adhoc", {
        method: "POST",
        body: JSON.stringify(adhocPayload),
      });

      if (!createOrderRes.ok || !createOrderRes.data?.order_id) {
        console.error("[Shiprocket Order Creation Failed]:", createOrderRes.data);
        return res.status(createOrderRes.status || 400).json({
          success: false,
          message: createOrderRes.data?.message || "Failed to create shipment order in Shiprocket.",
          errors: createOrderRes.data?.errors || createOrderRes.data,
        });
      }

      const srOrderId = createOrderRes.data.order_id;
      const srShipmentId = createOrderRes.data.shipment_id;
      let awbCode = createOrderRes.data.awb_code || null;
      let courierName = createOrderRes.data.courier_name || selectedCourier?.courier_name || "Shiprocket Express";
      let courierCompanyId = selectedCourier?.courier_company_id || createOrderRes.data.courier_company_id || null;

      // 7. Assign AWB if not assigned during order creation
      if (!awbCode && srShipmentId) {
        console.log(`[Shiprocket] Assigning AWB for shipment #${srShipmentId}...`);
        const assignAwbRes = await callShiprocketApi("courier/assign/awb", {
          method: "POST",
          body: JSON.stringify({
            shipment_id: srShipmentId,
            courier_id: courierCompanyId,
          }),
        });

        if (assignAwbRes.ok && assignAwbRes.data?.response?.data?.awb_code) {
          awbCode = assignAwbRes.data.response.data.awb_code;
          courierName = assignAwbRes.data.response.data.courier_name || courierName;
          courierCompanyId = assignAwbRes.data.response.data.courier_company_id || courierCompanyId;
        } else {
          console.warn("[Shiprocket AWB Assignment Notice]:", assignAwbRes.data);
        }
      }

      // 8. Generate Shipping Label PDF URL
      let labelUrl = null;
      if (srShipmentId) {
        try {
          const labelRes = await callShiprocketApi("courier/generate/label", {
            method: "POST",
            body: JSON.stringify({ shipment_id: [srShipmentId] }),
          });
          if (labelRes.ok && labelRes.data?.label_url) {
            labelUrl = labelRes.data.label_url;
          }
        } catch (labelErr) {
          console.warn("[Shiprocket Label Notice]:", labelErr?.message);
        }
      }

      // 9. Request Courier Pickup
      let pickupScheduled = false;
      if (srShipmentId) {
        try {
          const pickupRes = await callShiprocketApi("courier/generate/pickup", {
            method: "POST",
            body: JSON.stringify({ shipment_id: [srShipmentId] }),
          });
          if (pickupRes.ok && pickupRes.data?.pickup_status === 1) {
            pickupScheduled = true;
          }
        } catch (pickupErr) {
          console.warn("[Shiprocket Pickup Request Notice]:", pickupErr?.message);
        }
      }

      const trackingUrl = awbCode
        ? `https://shiprocket.co/tracking/${awbCode}`
        : `https://shiprocket.co/tracking/${srShipmentId}`;

      const nowIso = new Date().toISOString();
      const shippingRecord = {
        provider: "SHIPROCKET",
        status: awbCode ? "AWB Assigned" : "Shipment Created",
        shiprocketOrderId: srOrderId,
        shipmentId: srShipmentId,
        awbCode: awbCode || `SR-PENDING-${srShipmentId}`,
        courierName,
        courierId: courierCompanyId,
        pickupLocation,
        pickupAddress: "783, Raj Gold Residency, Flat No. 104, Khatiwala Tank, Indore, Madhya Pradesh - 452014",
        deliveryAddress: {
          name: cName,
          email: cEmail,
          phone: cPhone,
          address: cFlat ? `${cFlat}, ${cAddress}` : cAddress,
          city: cCity,
          state: cState,
          pincode: cPincode,
          country: cCountry,
        },
        packageWeight: weight,
        packageLength: length,
        packageBreadth: breadth,
        packageHeight: height,
        labelUrl: labelUrl || "",
        manifestUrl: "",
        trackingUrl,
        pickupStatus: pickupScheduled ? "Scheduled" : "Requested",
        estimatedDeliveryDate: selectedCourier?.etd || "",
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const trackingEvent = {
        status: "Packed",
        activity: `Shipment order created with Shiprocket and assigned to ${courierName}. AWB: ${awbCode || "Pending"}`,
        location: "Indore Fulfillment Hub",
        timestamp: nowIso,
      };

      // 10. Update Firestore Order Atomically
      const existingHistory = Array.isArray(orderData.trackingHistory) ? orderData.trackingHistory : [];
      await updateDoc(orderRef, {
        orderStatus: "Packed",
        shipping: shippingRecord,
        trackingHistory: [...existingHistory, trackingEvent],
        trackingNumber: awbCode || `SR-${srShipmentId}`,
        courierName,
        updatedAt: serverTimestamp(),
      });

      console.log(`[Shiprocket] Order #${orderId} successfully packed & assigned AWB ${awbCode}`);

      // 11. Send notification email asynchronously
      sendShipmentNotificationEmail(
        { id: orderId, ...orderData, customerName: cName, email: cEmail },
        shippingRecord
      ).catch((err) => console.warn("[Shipment Email Async Notice]:", err));

      return res.status(200).json({
        success: true,
        message: "Shipment successfully created in Shiprocket.",
        orderId,
        shipping: shippingRecord,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: generate-label
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "generate-label") {
      const shipmentId = req.query?.shipmentId || body?.shipmentId;
      const orderId = req.query?.orderId || body?.orderId;

      if (!shipmentId) {
        return res.status(400).json({ success: false, message: "shipmentId is required." });
      }

      const labelRes = await callShiprocketApi("courier/generate/label", {
        method: "POST",
        body: JSON.stringify({ shipment_id: [Number(shipmentId)] }),
      });

      if (!labelRes.ok || !labelRes.data?.label_url) {
        return res.status(400).json({
          success: false,
          message: labelRes.data?.response || labelRes.data?.message || "Failed to generate label.",
        });
      }

      if (orderId) {
        try {
          const orderRef = doc(db, "orders", orderId);
          await updateDoc(orderRef, {
            "shipping.labelUrl": labelRes.data.label_url,
            updatedAt: serverTimestamp(),
          });
        } catch (e) {
          // ignore
        }
      }

      return res.status(200).json({
        success: true,
        labelUrl: labelRes.data.label_url,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: generate-manifest
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "generate-manifest") {
      const shipmentId = req.query?.shipmentId || body?.shipmentId;
      const orderId = req.query?.orderId || body?.orderId;

      if (!shipmentId) {
        return res.status(400).json({ success: false, message: "shipmentId is required." });
      }

      const manifestRes = await callShiprocketApi("manifests/generate", {
        method: "POST",
        body: JSON.stringify({ shipment_id: [Number(shipmentId)] }),
      });

      const manifestUrl = manifestRes.data?.manifest_url || manifestRes.data?.response?.manifest_url;

      if (!manifestRes.ok || !manifestUrl) {
        return res.status(400).json({
          success: false,
          message: manifestRes.data?.message || "Failed to generate manifest.",
        });
      }

      if (orderId) {
        try {
          const orderRef = doc(db, "orders", orderId);
          await updateDoc(orderRef, {
            "shipping.manifestUrl": manifestUrl,
            updatedAt: serverTimestamp(),
          });
        } catch (e) {
          // ignore
        }
      }

      return res.status(200).json({
        success: true,
        manifestUrl,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: track / sync-tracking (Live tracking via Shiprocket API)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "track" || action === "sync-tracking") {
      const awb = String(req.query?.awb || body?.awb || "").trim();
      const shipmentId = String(req.query?.shipmentId || body?.shipmentId || "").trim();
      const orderId = String(req.query?.orderId || body?.orderId || "").trim();

      if (!awb && !shipmentId && !orderId) {
        return res.status(400).json({
          success: false,
          message: "Please provide an AWB code, shipment ID, or Order ID.",
        });
      }

      let targetAwb = awb;
      let targetOrderDoc = null;

      // If orderId is provided, retrieve AWB from Firestore order
      if (orderId) {
        try {
          const snap = await getDoc(doc(db, "orders", orderId));
          if (snap.exists()) {
            targetOrderDoc = snap;
            const data = snap.data();
            if (!targetAwb) {
              targetAwb = data.shipping?.awbCode || data.trackingNumber || "";
            }
          }
        } catch (e) {
          // ignore
        }
      }

      let trackingData = null;
      let endpoint = targetAwb
        ? `courier/track/awb/${targetAwb}`
        : `courier/track/shipment/${shipmentId}`;

      const trackRes = await callShiprocketApi(endpoint, { method: "GET" });

      if (trackRes.ok && trackRes.data?.tracking_data) {
        trackingData = trackRes.data.tracking_data;
      }

      // If real Shiprocket returned tracking events
      const rawActivities = trackingData?.shipment_track_activities || [];
      const currentStatus =
        trackingData?.current_status ||
        trackingData?.shipment_track?.[0]?.current_status ||
        "In Transit";

      const formattedActivities = rawActivities.map((act) => ({
        status: act.activity || act.status || "Update",
        activity: act["sr-status-label"] || act.activity || act.location || "",
        location: act.location || "Logistics Hub",
        timestamp: act.date || new Date().toISOString(),
      }));

      // Synchronize with Firestore if order document was found
      if (targetOrderDoc && action === "sync-tracking" && trackingData) {
        try {
          const orderData = targetOrderDoc.data();
          const existingHistory = Array.isArray(orderData.trackingHistory) ? orderData.trackingHistory : [];

          // Map Shiprocket courier status to Ecommerce Order Status
          let updatedOrderStatus = orderData.orderStatus;
          const statusLower = currentStatus.toLowerCase();

          if (statusLower.includes("delivered")) {
            updatedOrderStatus = "Delivered";
          } else if (statusLower.includes("out for delivery")) {
            updatedOrderStatus = "Out for Delivery";
          } else if (statusLower.includes("in transit") || statusLower.includes("reached")) {
            updatedOrderStatus = "In Transit";
          } else if (statusLower.includes("picked up") || statusLower.includes("shipped")) {
            updatedOrderStatus = "Shipped";
          }

          const combinedHistory = [...existingHistory];
          formattedActivities.forEach((act) => {
            const exists = combinedHistory.some((h) => h.timestamp === act.timestamp && h.activity === act.activity);
            if (!exists) combinedHistory.push(act);
          });

          await updateDoc(targetOrderDoc.ref, {
            orderStatus: updatedOrderStatus,
            "shipping.status": currentStatus,
            "shipping.trackingUrl": trackingData.track_url || orderData.shipping?.trackingUrl || "",
            trackingHistory: combinedHistory,
            updatedAt: serverTimestamp(),
          });
        } catch (syncErr) {
          console.warn("[Shiprocket Sync Error]:", syncErr);
        }
      }

      return res.status(200).json({
        success: true,
        awb: targetAwb,
        currentStatus,
        trackUrl: trackingData?.track_url || `https://shiprocket.co/tracking/${targetAwb}`,
        etd: trackingData?.etd || "",
        activities: formattedActivities,
        raw: trackingData,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: book-reverse-pickup (Book Shiprocket Return Pickup for Defective Jewellery)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "book-reverse-pickup" && req.method === "POST") {
      const {
        requestId,
        pickupAddress = {},
        packageDetails = {},
        courierId = null,
        adminIdentifier = "Admin",
      } = body;

      if (!requestId) {
        return res.status(400).json({ success: false, message: "requestId is required." });
      }

      // 1. Fetch Replacement Request from Firestore
      const reqDocRef = doc(db, "replacementRequests", requestId);
      const reqSnap = await getDoc(reqDocRef);

      if (!reqSnap.exists()) {
        return res.status(404).json({
          success: false,
          message: `Replacement request #${requestId} not found.`,
        });
      }

      const reqData = reqSnap.data();

      // Idempotency: Prevent duplicate reverse pickup booking
      if (reqData.reversePickup?.awb && reqData.reversePickup?.shipmentId) {
        return res.status(200).json({
          success: true,
          alreadyBooked: true,
          message: "Reverse pickup already booked for this request.",
          reversePickup: reqData.reversePickup,
        });
      }

      // 2. Validate Package Details
      const weight = Number(packageDetails.weight || reqData.reversePickup?.package?.weight || 0.5);
      const length = Number(packageDetails.length || reqData.reversePickup?.package?.length || 10);
      const breadth = Number(packageDetails.breadth || reqData.reversePickup?.package?.breadth || 10);
      const height = Number(packageDetails.height || reqData.reversePickup?.package?.height || 5);

      if (weight <= 0 || length <= 0 || breadth <= 0 || height <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid positive dimensions (cm) and weight (kg) are required.",
        });
      }

      // 3. Resolve Customer Pickup Address
      const cName = (pickupAddress.name || reqData.customerName || "Customer").trim();
      const cPhone = (pickupAddress.phone || reqData.customerPhone || "").replace(/\D/g, "");
      const cEmail = (pickupAddress.email || reqData.customerEmail || "customer@velouraz.in").trim();
      const cAddress = (pickupAddress.address || pickupAddress.fullAddress || "").trim();
      const cCity = (pickupAddress.city || "").trim();
      const cState = (pickupAddress.state || "").trim();
      const cPincode = (pickupAddress.pincode || "").replace(/\D/g, "");

      if (!cName || !cPhone || !cAddress || !cCity || !cState || cPincode.length !== 6) {
        return res.status(400).json({
          success: false,
          message: "Complete customer pickup address (name, phone, street address, city, state, 6-digit pincode) is required.",
        });
      }

      // 4. Format Return Items
      const rawProducts = reqData.products || [];
      const orderItems = rawProducts.map((p, idx) => ({
        name: String(p.productName || `Defective Jewellery Piece #${idx + 1}`).slice(0, 100),
        sku: String(p.sku || `DEF-SKU-${idx + 1}`).slice(0, 50),
        units: Math.max(1, Number(p.quantity || 1)),
        selling_price: Math.max(1, Number(p.price || 999)),
        discount: 0,
        qc_enable: false,
        hsn: 711319,
      }));

      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const returnDateFormatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const returnOrderId = `${String(reqData.orderNumber || reqData.orderId).slice(0, 30)}-REV-${requestId.slice(-5)}`;

      // 5. Build Return Order Payload
      const returnPayload = {
        order_id: returnOrderId,
        order_date: returnDateFormatted,
        channel_id: "",
        pickup_customer_name: cName,
        pickup_last_name: "",
        pickup_address: cAddress,
        pickup_address_2: "",
        pickup_city: cCity,
        pickup_state: cState,
        pickup_country: "India",
        pickup_pincode: cPincode,
        pickup_email: cEmail,
        pickup_phone: cPhone,
        pickup_isd_code: "91",
        shipping_customer_name: "Velouraz Logistics Hub",
        shipping_last_name: "",
        shipping_address: "783, Raj Gold Residency, Flat No. 104, Khatiwala Tank",
        shipping_address_2: "",
        shipping_city: "Indore",
        shipping_country: "India",
        shipping_pincode: "452014",
        shipping_state: "Madhya Pradesh",
        shipping_email: "zahabiyak@gmail.com",
        shipping_phone: "8349445352",
        shipping_isd_code: "91",
        order_items: orderItems,
        payment_method: "PREPAID",
        total_discount: 0,
        sub_total: orderItems.reduce((acc, item) => acc + item.selling_price * item.units, 0),
        length,
        breadth,
        height,
        weight,
      };

      console.log(`[Shiprocket] Creating Reverse Pickup for Request #${requestId}...`);
      const returnOrderRes = await callShiprocketApi("orders/create/return", {
        method: "POST",
        body: JSON.stringify(returnPayload),
      });

      if (!returnOrderRes.ok || (!returnOrderRes.data?.order_id && !returnOrderRes.data?.shipment_id)) {
        console.error("[Shiprocket Reverse Pickup Failed]:", returnOrderRes.data);
        return res.status(returnOrderRes.status || 400).json({
          success: false,
          message: returnOrderRes.data?.message || "Failed to create return order with Shiprocket.",
          errors: returnOrderRes.data?.errors || returnOrderRes.data,
        });
      }

      const reverseOrderId = returnOrderRes.data.order_id || returnOrderId;
      const reverseShipmentId = returnOrderRes.data.shipment_id;
      let reverseAwb = returnOrderRes.data.awb_code || null;
      let courierName = returnOrderRes.data.courier_name || "Shiprocket Reverse Express";
      let courierCompanyId = courierId || returnOrderRes.data.courier_company_id || null;

      // 6. Assign AWB for reverse shipment if not assigned
      if (!reverseAwb && reverseShipmentId) {
        try {
          const assignRes = await callShiprocketApi("courier/assign/awb", {
            method: "POST",
            body: JSON.stringify({
              shipment_id: reverseShipmentId,
              courier_id: courierCompanyId,
              is_return: 1,
            }),
          });
          if (assignRes.ok && assignRes.data?.response?.data?.awb_code) {
            reverseAwb = assignRes.data.response.data.awb_code;
            courierName = assignRes.data.response.data.courier_name || courierName;
            courierCompanyId = assignRes.data.response.data.courier_company_id || courierCompanyId;
          }
        } catch (awbErr) {
          console.warn("[Shiprocket Reverse AWB Notice]:", awbErr);
        }
      }

      // 7. Request pickup
      let pickupScheduled = false;
      if (reverseShipmentId) {
        try {
          const pickupRes = await callShiprocketApi("courier/generate/pickup", {
            method: "POST",
            body: JSON.stringify({ shipment_id: [reverseShipmentId] }),
          });
          if (pickupRes.ok && pickupRes.data?.pickup_status === 1) {
            pickupScheduled = true;
          }
        } catch (pickupErr) {
          console.warn("[Shiprocket Reverse Pickup Notice]:", pickupErr);
        }
      }

      // 8. Generate Label
      let labelUrl = "";
      if (reverseShipmentId) {
        try {
          const labelRes = await callShiprocketApi("courier/generate/label", {
            method: "POST",
            body: JSON.stringify({ shipment_id: [reverseShipmentId] }),
          });
          if (labelRes.ok && labelRes.data?.label_url) {
            labelUrl = labelRes.data.label_url;
          }
        } catch (labelErr) {
          console.warn("[Shiprocket Reverse Label Notice]:", labelErr);
        }
      }

      const reverseTrackingUrl = reverseAwb
        ? `https://shiprocket.co/tracking/${reverseAwb}`
        : `https://shiprocket.co/tracking/${reverseShipmentId}`;

      const nowIso = new Date().toISOString();
      const reverseRecord = {
        provider: "SHIPROCKET",
        orderId: reverseOrderId,
        shipmentId: reverseShipmentId,
        awb: reverseAwb || `REV-PENDING-${reverseShipmentId}`,
        courierName,
        courierId: courierCompanyId,
        trackingUrl: reverseTrackingUrl,
        labelUrl,
        status: reverseAwb ? "AWB Assigned" : "Pickup Scheduled",
        pickupAddress: {
          name: cName,
          phone: cPhone,
          email: cEmail,
          address: cAddress,
          city: cCity,
          state: cState,
          pincode: cPincode,
          country: "India",
        },
        package: { weight, length, breadth, height },
        pickupScheduledAt: nowIso,
        pickedUpAt: null,
        receivedAt: null,
      };

      const timelineEvent = {
        status: "REVERSE_PICKUP_SCHEDULED",
        title: "Reverse Pickup Scheduled",
        description: `Reverse courier pickup booked with ${courierName}. Reverse AWB: ${reverseAwb || "Pending"}.`,
        actor: adminIdentifier,
        timestamp: nowIso,
      };

      const existingTimeline = Array.isArray(reqData.timeline) ? reqData.timeline : [];

      // 9. Update Firestore Replacement Request
      await updateDoc(reqDocRef, {
        status: "REVERSE_PICKUP_SCHEDULED",
        reversePickup: reverseRecord,
        timeline: [...existingTimeline, timelineEvent],
        updatedAt: serverTimestamp(),
      });

      // Update original order pointer
      if (reqData.orderId) {
        try {
          await updateDoc(doc(db, "orders", reqData.orderId), {
            replacementStatus: "REVERSE_PICKUP_SCHEDULED",
            updatedAt: serverTimestamp(),
          });
        } catch (e) {}
      }

      // 10. Send customer email
      try {
        fetch(`${process.env.APP_URL || "http://localhost:3000"}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "replacement",
            subType: "REVERSE_SCHEDULED",
            customerEmail: cEmail,
            customerName: cName,
            orderId: reqData.orderNumber || reqData.orderId,
            requestId,
            courierName,
            awbCode: reverseAwb,
            trackingUrl: reverseTrackingUrl,
            pickupAddress: `${cAddress}, ${cCity} - ${cPincode}`,
          }),
        }).catch(() => {});
      } catch (emailErr) {}

      return res.status(200).json({
        success: true,
        message: "Reverse pickup successfully scheduled.",
        reversePickup: reverseRecord,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: create-replacement-delivery (Ship Brand-New Replacement Piece)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "create-replacement-delivery" && req.method === "POST") {
      const {
        requestId,
        deliveryAddress = {},
        packageDetails = {},
        courierId = null,
        pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || "work",
        adminIdentifier = "Admin",
      } = body;

      if (!requestId) {
        return res.status(400).json({ success: false, message: "requestId is required." });
      }

      const reqDocRef = doc(db, "replacementRequests", requestId);
      const reqSnap = await getDoc(reqDocRef);

      if (!reqSnap.exists()) {
        return res.status(404).json({
          success: false,
          message: `Replacement request #${requestId} not found.`,
        });
      }

      const reqData = reqSnap.data();

      // Idempotency: Prevent duplicate replacement shipment
      if (reqData.replacementShipment?.awb && reqData.replacementShipment?.shipmentId) {
        return res.status(200).json({
          success: true,
          alreadyCreated: true,
          message: "Replacement shipment already exists for this request.",
          replacementShipment: reqData.replacementShipment,
        });
      }

      // Validate package dimensions
      const weight = Number(packageDetails.weight || 0.5);
      const length = Number(packageDetails.length || 10);
      const breadth = Number(packageDetails.breadth || 10);
      const height = Number(packageDetails.height || 5);

      if (weight <= 0 || length <= 0 || breadth <= 0 || height <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid positive dimensions (cm) and weight (kg) are required.",
        });
      }

      // Customer delivery info
      const cName = (deliveryAddress.name || reqData.customerName || "Customer").trim();
      const cPhone = (deliveryAddress.phone || reqData.customerPhone || "").replace(/\D/g, "");
      const cEmail = (deliveryAddress.email || reqData.customerEmail || "customer@velouraz.in").trim();
      const cAddress = (deliveryAddress.address || deliveryAddress.fullAddress || "").trim();
      const cCity = (deliveryAddress.city || "").trim();
      const cState = (deliveryAddress.state || "").trim();
      const cPincode = (deliveryAddress.pincode || "").replace(/\D/g, "");

      if (!cName || !cPhone || !cAddress || !cCity || !cState || cPincode.length !== 6) {
        return res.status(400).json({
          success: false,
          message: "Customer delivery address is incomplete (name, phone, address, city, state, 6-digit pincode required).",
        });
      }

      // Format replacement items
      const rawProducts = reqData.products || [];
      const orderItems = rawProducts.map((p, idx) => ({
        name: String(p.productName || `Replacement Jewellery Piece #${idx + 1}`).slice(0, 100),
        sku: String(p.sku || `REP-SKU-${idx + 1}`).slice(0, 50),
        units: Math.max(1, Number(p.quantity || 1)),
        selling_price: Math.max(1, Number(p.price || 999)),
        discount: 0,
        tax: 0,
        hsn: 711319,
      }));

      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const orderDateFormatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const replacementOrderId = `${String(reqData.orderNumber || reqData.orderId).slice(0, 30)}-REP-${requestId.slice(-5)}`;

      const adhocPayload = {
        order_id: replacementOrderId,
        order_date: orderDateFormatted,
        pickup_location: pickupLocation,
        channel_id: "",
        comment: `Velouraz Replacement Piece for Request #${requestId} (Warranty Exchange)`,
        billing_customer_name: cName,
        billing_last_name: "",
        billing_address: cAddress,
        billing_address_2: "",
        billing_city: cCity,
        billing_pincode: cPincode,
        billing_state: cState,
        billing_country: "India",
        billing_email: cEmail,
        billing_phone: cPhone,
        shipping_is_billing: true,
        order_items: orderItems,
        payment_method: "Prepaid",
        shipping_charges: 0,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: 0,
        sub_total: orderItems.reduce((acc, item) => acc + item.selling_price * item.units, 0),
        length,
        breadth,
        height,
        weight,
      };

      console.log(`[Shiprocket] Creating Replacement Delivery Shipment for #${requestId}...`);
      const createOrderRes = await callShiprocketApi("orders/create/adhoc", {
        method: "POST",
        body: JSON.stringify(adhocPayload),
      });

      if (!createOrderRes.ok || !createOrderRes.data?.order_id) {
        console.error("[Shiprocket Replacement Order Failed]:", createOrderRes.data);
        return res.status(createOrderRes.status || 400).json({
          success: false,
          message: createOrderRes.data?.message || "Failed to create replacement shipment in Shiprocket.",
          errors: createOrderRes.data?.errors || createOrderRes.data,
        });
      }

      const srOrderId = createOrderRes.data.order_id;
      const srShipmentId = createOrderRes.data.shipment_id;
      let awbCode = createOrderRes.data.awb_code || null;
      let courierName = createOrderRes.data.courier_name || "Shiprocket Express";
      let courierCompanyId = courierId || createOrderRes.data.courier_company_id || null;

      // Assign AWB
      if (!awbCode && srShipmentId) {
        try {
          const assignRes = await callShiprocketApi("courier/assign/awb", {
            method: "POST",
            body: JSON.stringify({
              shipment_id: srShipmentId,
              courier_id: courierCompanyId,
            }),
          });
          if (assignRes.ok && assignRes.data?.response?.data?.awb_code) {
            awbCode = assignRes.data.response.data.awb_code;
            courierName = assignRes.data.response.data.courier_name || courierName;
            courierCompanyId = assignRes.data.response.data.courier_company_id || courierCompanyId;
          }
        } catch (awbErr) {
          console.warn("[Shiprocket Replacement AWB Notice]:", awbErr);
        }
      }

      // Generate Label
      let labelUrl = "";
      if (srShipmentId) {
        try {
          const labelRes = await callShiprocketApi("courier/generate/label", {
            method: "POST",
            body: JSON.stringify({ shipment_id: [srShipmentId] }),
          });
          if (labelRes.ok && labelRes.data?.label_url) {
            labelUrl = labelRes.data.label_url;
          }
        } catch (labelErr) {
          console.warn("[Shiprocket Replacement Label Notice]:", labelErr);
        }
      }

      // Generate Pickup
      if (srShipmentId) {
        try {
          await callShiprocketApi("courier/generate/pickup", {
            method: "POST",
            body: JSON.stringify({ shipment_id: [srShipmentId] }),
          });
        } catch (e) {}
      }

      const trackingUrl = awbCode
        ? `https://shiprocket.co/tracking/${awbCode}`
        : `https://shiprocket.co/tracking/${srShipmentId}`;

      const nowIso = new Date().toISOString();
      const replacementRecord = {
        provider: "SHIPROCKET",
        orderId: srOrderId,
        shipmentId: srShipmentId,
        awb: awbCode || `REP-PENDING-${srShipmentId}`,
        courierName,
        courierId: courierCompanyId,
        trackingUrl,
        labelUrl,
        status: awbCode ? "AWB Assigned" : "Dispatched",
        deliveryAddress: {
          name: cName,
          phone: cPhone,
          email: cEmail,
          address: cAddress,
          city: cCity,
          state: cState,
          pincode: cPincode,
          country: "India",
        },
        package: { weight, length, breadth, height },
        createdAt: nowIso,
        shippedAt: nowIso,
        deliveredAt: null,
      };

      const timelineEvent = {
        status: "REPLACEMENT_SHIPPED",
        title: "Replacement Dispatched",
        description: `Handcrafted replacement piece packed & dispatched via ${courierName}. AWB: ${awbCode || "Pending"}.`,
        actor: adminIdentifier,
        timestamp: nowIso,
      };

      const existingTimeline = Array.isArray(reqData.timeline) ? reqData.timeline : [];

      await updateDoc(reqDocRef, {
        status: "REPLACEMENT_SHIPPED",
        replacementShipment: replacementRecord,
        timeline: [...existingTimeline, timelineEvent],
        updatedAt: serverTimestamp(),
      });

      if (reqData.orderId) {
        try {
          await updateDoc(doc(db, "orders", reqData.orderId), {
            replacementStatus: "REPLACEMENT_SHIPPED",
            updatedAt: serverTimestamp(),
          });
        } catch (e) {}
      }

      // Send dispatch notification email
      try {
        fetch(`${process.env.APP_URL || "http://localhost:3000"}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "replacement",
            subType: "REPLACEMENT_DISPATCHED",
            customerEmail: cEmail,
            customerName: cName,
            orderId: reqData.orderNumber || reqData.orderId,
            requestId,
            courierName,
            awbCode,
            trackingUrl,
            productName: rawProducts[0]?.productName || "Jewellery Piece",
          }),
        }).catch(() => {});
      } catch (e) {}

      return res.status(200).json({
        success: true,
        message: "Replacement shipment successfully created in Shiprocket.",
        replacementShipment: replacementRecord,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: webhook (Handle Shiprocket Webhook Tracking Callbacks)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "webhook" || req.method === "POST" && req.query?.webhook === "true") {
      const eventData = body;
      const awbCode = eventData.awb || eventData.awb_code;
      const srOrderId = eventData.order_id;
      const currentStatus = eventData.current_status || eventData.status;

      console.log(`[Shiprocket Webhook Received] AWB: ${awbCode}, Status: ${currentStatus}`);

      if (!awbCode && !srOrderId) {
        return res.status(200).json({ status: "ignored_missing_identifiers" });
      }

      // Check if this AWB belongs to a replacement request (reverse pickup or replacement delivery)
      if (awbCode) {
        try {
          // Check reverse pickup AWBs
          const revQ = query(collection(db, "replacementRequests"), where("reversePickup.awb", "==", awbCode));
          const revSnap = await getDocs(revQ);
          if (!revSnap.empty) {
            const reqDoc = revSnap.docs[0];
            const data = reqDoc.data();
            const statusLower = String(currentStatus || "").toLowerCase();

            let newReqStatus = data.status;
            if (statusLower.includes("delivered") || statusLower.includes("return delivered")) {
              newReqStatus = "RETURN_RECEIVED";
            } else if (statusLower.includes("picked up") || statusLower.includes("in transit")) {
              newReqStatus = "REVERSE_PICKED_UP";
            }

            const existingTimeline = Array.isArray(data.timeline) ? data.timeline : [];
            const newEvent = {
              status: newReqStatus,
              title: `Reverse Logistics: ${currentStatus}`,
              description: eventData.activity || `Courier reverse update: ${currentStatus}`,
              actor: "Shiprocket Courier",
              timestamp: new Date().toISOString(),
            };

            await updateDoc(reqDoc.ref, {
              status: newReqStatus,
              "reversePickup.status": currentStatus,
              timeline: [...existingTimeline, newEvent],
              updatedAt: serverTimestamp(),
            });

            console.log(`[Shiprocket Webhook] Updated Reverse Pickup for Request #${reqDoc.id} to ${newReqStatus}`);
          }

          // Check replacement shipment AWBs
          const repQ = query(collection(db, "replacementRequests"), where("replacementShipment.awb", "==", awbCode));
          const repSnap = await getDocs(repQ);
          if (!repSnap.empty) {
            const reqDoc = repSnap.docs[0];
            const data = reqDoc.data();
            const statusLower = String(currentStatus || "").toLowerCase();

            let newReqStatus = data.status;
            if (statusLower.includes("delivered")) {
              newReqStatus = "REPLACEMENT_DELIVERED";
            } else if (statusLower.includes("out for delivery")) {
              newReqStatus = "REPLACEMENT_PROCESSING";
            }

            const existingTimeline = Array.isArray(data.timeline) ? data.timeline : [];
            const newEvent = {
              status: newReqStatus,
              title: `Replacement Delivery: ${currentStatus}`,
              description: eventData.activity || `Courier delivery update: ${currentStatus}`,
              actor: "Shiprocket Courier",
              timestamp: new Date().toISOString(),
            };

            await updateDoc(reqDoc.ref, {
              status: newReqStatus,
              "replacementShipment.status": currentStatus,
              timeline: [...existingTimeline, newEvent],
              updatedAt: serverTimestamp(),
            });

            console.log(`[Shiprocket Webhook] Updated Replacement Delivery for Request #${reqDoc.id} to ${newReqStatus}`);
          }
        } catch (repErr) {
          console.warn("[Shiprocket Webhook Replacement Check Error]:", repErr);
        }
      }

      // Query order in Firestore (Standard forward order)
      let targetDoc = null;
      if (awbCode) {
        const q = query(collection(db, "orders"), where("shipping.awbCode", "==", awbCode));
        const snap = await getDocs(q);
        if (!snap.empty) targetDoc = snap.docs[0];
      }

      if (!targetDoc && srOrderId) {
        const q = query(collection(db, "orders"), where("shipping.shiprocketOrderId", "==", Number(srOrderId)));
        const snap = await getDocs(q);
        if (!snap.empty) targetDoc = snap.docs[0];
      }

      if (targetDoc) {
        const orderData = targetDoc.data();
        let newOrderStatus = orderData.orderStatus;
        const statusLower = String(currentStatus || "").toLowerCase();

        if (statusLower.includes("delivered")) {
          newOrderStatus = "Delivered";
        } else if (statusLower.includes("out for delivery")) {
          newOrderStatus = "Out for Delivery";
        } else if (statusLower.includes("in transit") || statusLower.includes("reached")) {
          newOrderStatus = "In Transit";
        } else if (statusLower.includes("picked up") || statusLower.includes("shipped")) {
          newOrderStatus = "Shipped";
        } else if (statusLower.includes("cancelled") || statusLower.includes("rto")) {
          newOrderStatus = "Cancelled";
        }

        const newEvent = {
          status: currentStatus,
          activity: eventData.activity || eventData.scans || `Courier update: ${currentStatus}`,
          location: eventData.location || "Transit Hub",
          timestamp: new Date().toISOString(),
        };

        const existingHistory = Array.isArray(orderData.trackingHistory) ? orderData.trackingHistory : [];

        await updateDoc(targetDoc.ref, {
          orderStatus: newOrderStatus,
          "shipping.status": currentStatus,
          trackingHistory: [...existingHistory, newEvent],
          updatedAt: serverTimestamp(),
        });

        console.log(`[Shiprocket Webhook] Updated Order #${targetDoc.id} status to ${newOrderStatus}`);
      }

      return res.status(200).json({ status: "success", received: true });
    }

    return res.status(400).json({
      success: false,
      message: `Unsupported Shiprocket action: ${action || "none"}. Valid actions: get-pickups, check-serviceability, create-shipment, generate-label, generate-manifest, track, sync-tracking.`,
    });
  } catch (error) {
    console.error("[Shiprocket API Handler Exception]:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error processing Shiprocket request.",
    });
  }
}
