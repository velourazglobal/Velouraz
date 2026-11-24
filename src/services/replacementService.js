import { db } from "../components/Firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

// ─── Default Configurable Policy ─────────────────────────────────────────────
export const DEFAULT_REPLACEMENT_POLICY = {
  windowDays: 7, // 7 days after delivery
  maxRequestsPerOrder: 1,
  maxPhotos: 5,
  maxPhotoSizeMB: 5,
  allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  photosMandatory: true,
  inspectionRequired: true,
  reasons: [
    "Product received damaged",
    "Jewellery is broken",
    "Product is defective",
    "Wrong product received",
    "Missing component or accessory",
    "Product does not match the order",
    "Other",
  ],
};

// ─── Status Hierarchy & Visual Config ────────────────────────────────────────
export const REPLACEMENT_STATUS_MAP = {
  REQUESTED: {
    label: "Request Submitted",
    color: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    stage: 0,
    desc: "Your replacement request has been received and is queued for verification.",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "bg-blue-50 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
    stage: 1,
    desc: "Our jewellery specialists are inspecting your submitted photographic evidence.",
  },
  APPROVED: {
    label: "Approved",
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    stage: 2,
    desc: "Replacement request approved. Reverse courier pickup is being arranged.",
  },
  REJECTED: {
    label: "Request Rejected",
    color: "bg-rose-50 text-rose-800 border-rose-200",
    dot: "bg-rose-500",
    stage: -1,
    desc: "Request could not be approved. Please review the reason provided.",
  },
  REVERSE_PICKUP_PENDING: {
    label: "Pickup Pending",
    color: "bg-purple-50 text-purple-800 border-purple-200",
    dot: "bg-purple-500",
    stage: 3,
    desc: "Reverse courier pickup is scheduled with our logistics partner.",
  },
  REVERSE_PICKUP_SCHEDULED: {
    label: "Pickup Scheduled",
    color: "bg-indigo-50 text-indigo-800 border-indigo-200",
    dot: "bg-indigo-500",
    stage: 3,
    desc: "Courier executive assigned for pickup. Please keep the piece safely packed.",
  },
  REVERSE_PICKED_UP: {
    label: "Defective Item Collected",
    color: "bg-cyan-50 text-cyan-800 border-cyan-200",
    dot: "bg-cyan-500",
    stage: 4,
    desc: "Defective item has been picked up and is in transit to our fulfillment hub.",
  },
  RETURN_RECEIVED: {
    label: "Returned Item Received",
    color: "bg-teal-50 text-teal-800 border-teal-200",
    dot: "bg-teal-500",
    stage: 5,
    desc: "Defective parcel physically received at Velouraz fulfillment center.",
  },
  INSPECTION_PENDING: {
    label: "Inspection Pending",
    color: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    stage: 5,
    desc: "Item is undergoing gemological & craftsmanship verification.",
  },
  INSPECTION_APPROVED: {
    label: "Inspection Passed",
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    stage: 6,
    desc: "Inspection verified. A brand-new replacement piece is being packed.",
  },
  INSPECTION_REJECTED: {
    label: "Inspection Failed",
    color: "bg-red-50 text-red-800 border-red-200",
    dot: "bg-red-500",
    stage: -1,
    desc: "Returned item did not meet replacement verification criteria.",
  },
  REPLACEMENT_PROCESSING: {
    label: "Replacement Processing",
    color: "bg-violet-50 text-violet-800 border-violet-200",
    dot: "bg-violet-500",
    stage: 6,
    desc: "Brand new handcrafted replacement jewellery piece is being prepared.",
  },
  REPLACEMENT_SHIPPED: {
    label: "Replacement Dispatched",
    color: "bg-blue-50 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
    stage: 7,
    desc: "Replacement parcel dispatched with express courier tracking.",
  },
  REPLACEMENT_DELIVERED: {
    label: "Replacement Delivered",
    color: "bg-emerald-100 text-emerald-900 border-emerald-300",
    dot: "bg-emerald-600",
    stage: 8,
    desc: "Replacement piece successfully delivered. Case resolved.",
  },
  CLOSED: {
    label: "Closed",
    color: "bg-slate-100 text-slate-800 border-slate-300",
    dot: "bg-slate-500",
    stage: 8,
    desc: "Replacement procedure completed and archived.",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    dot: "bg-gray-400",
    stage: -1,
    desc: "Replacement request was cancelled.",
  },
};

export const REPLACEMENT_TIMELINE_STAGES = [
  "Request Submitted",
  "Under Review",
  "Approved",
  "Reverse Pickup Scheduled",
  "Defective Item Collected",
  "Returned Item Received",
  "Inspection Completed",
  "Replacement Dispatched",
  "Replacement Delivered",
];

/**
 * Checks whether an order is eligible for a customer replacement request
 */
export function checkOrderEligibility(order, existingRequests = [], policy = DEFAULT_REPLACEMENT_POLICY) {
  if (!order) {
    return { eligible: false, reason: "Order data missing." };
  }

  // 1. Payment status check
  const payStatus = String(order.paymentStatus || "").toUpperCase();
  if (payStatus !== "PAID") {
    return { eligible: false, reason: "Only fully paid orders are eligible for replacement." };
  }

  // 2. Delivery check
  const orderStatus = String(order.orderStatus || order.status || "").toLowerCase();
  const shippingStatus = String(order.shipping?.status || "").toLowerCase();
  const isDelivered = orderStatus.includes("delivered") || shippingStatus.includes("delivered");

  if (!isDelivered) {
    return { eligible: false, reason: "Replacements can only be requested once your order has been delivered." };
  }

  // 3. Duplicate check for this order
  const activeExisting = existingRequests.filter((r) => {
    if (r.orderId !== order.id && r.orderNumber !== order.orderNumber) return false;
    const s = String(r.status || "").toUpperCase();
    return s !== "REJECTED" && s !== "CANCELLED" && s !== "INSPECTION_REJECTED";
  });

  if (activeExisting.length >= (policy.maxRequestsPerOrder || 1)) {
    return {
      eligible: false,
      alreadyRequested: true,
      existingRequest: activeExisting[0],
      reason: "An active replacement request already exists for this order.",
    };
  }

  // 4. Replacement Window Check (default 7 days after delivery or order date)
  const deliveryDateVal =
    order.deliveredAt ||
    order.shipping?.deliveredAt ||
    order.updatedAt ||
    order.orderDate ||
    order.createdAt;

  let deliveryTime = 0;
  if (deliveryDateVal?.seconds) {
    deliveryTime = deliveryDateVal.seconds * 1000;
  } else if (deliveryDateVal) {
    deliveryTime = new Date(deliveryDateVal).getTime();
  }

  if (deliveryTime > 0) {
    const elapsedDays = (Date.now() - deliveryTime) / (1000 * 60 * 60 * 24);
    if (elapsedDays > policy.windowDays) {
      return {
        eligible: false,
        reason: `The replacement policy window (${policy.windowDays} days post-delivery) has expired.`,
      };
    }
  }

  return { eligible: true };
}

/**
 * Create a new Replacement Request in Firestore
 */
export async function createReplacementRequest({
  order,
  selectedProducts = [],
  reason = "",
  description = "",
  images = [],
  user = null,
}) {
  if (!order || !order.id) {
    throw new Error("Invalid order information provided.");
  }
  if (!selectedProducts || selectedProducts.length === 0) {
    throw new Error("Please select at least one product for replacement.");
  }
  if (!reason.trim()) {
    throw new Error("Please select a valid reason for replacement.");
  }
  if (!description.trim() || description.trim().length < 10) {
    throw new Error("Please provide a detailed description of the defect or damage (minimum 10 characters).");
  }
  if (!images || images.length === 0) {
    throw new Error("Photographic evidence is mandatory. Please upload at least one photograph of the defect.");
  }

  const timestamp = Date.now();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const requestId = `REP-${timestamp.toString().slice(-6)}-${randomSuffix}`;

  const customerName =
    order.customerName ||
    order.shippingAddress?.name ||
    user?.displayName ||
    "Valued Client";

  const customerEmail =
    order.email ||
    order.shippingAddress?.email ||
    user?.email ||
    "";

  const customerPhone =
    order.phone ||
    order.shippingAddress?.phone ||
    "";

  const fullShippingAddress = {
    name: customerName,
    email: customerEmail,
    phone: customerPhone,
    address: order.shippingAddress?.address || "",
    flat: order.shippingAddress?.flat || "",
    city: order.shippingAddress?.city || "",
    state: order.shippingAddress?.state || "",
    pincode: order.shippingAddress?.pincode || "",
    country: order.shippingAddress?.country || "India",
  };

  const formattedProducts = selectedProducts.map((p) => ({
    productId: p.id || p.productId || "PROD",
    productName: p.name || p.title || "Jewellery Piece",
    sku: p.sku || `SKU-${p.id || "JWL"}`,
    quantity: Number(p.quantity || 1),
    orderedQuantity: Number(p.orderedQuantity || p.quantity || 1),
    price: Number(p.price || 0),
    image: p.image || p.thumbnail || "/img/jewellery/j.png",
    reason: reason,
  }));

  const initialTimeline = [
    {
      status: "REQUESTED",
      title: "Replacement Requested",
      description: `Customer submitted replacement request for ${formattedProducts.map((p) => p.productName).join(", ")}. Reason: ${reason}.`,
      actor: "Customer",
      timestamp: new Date().toISOString(),
    },
  ];

  const replacementData = {
    id: requestId,
    requestId,
    orderId: order.id,
    orderNumber: order.orderNumber || order.id.slice(0, 8).toUpperCase(),
    customerId: user?.uid || order.userId || "GUEST",
    customerEmail,
    customerPhone,
    customerName,
    products: formattedProducts,
    reason,
    description: description.trim(),
    customerImages: images,
    status: "REQUESTED",
    statusDetails: REPLACEMENT_STATUS_MAP.REQUESTED,
    admin: {
      reviewedBy: null,
      reviewedAt: null,
      remarks: null,
      rejectionReason: null,
      inspectionStatus: null,
      inspectionRemarks: null,
    },
    reversePickup: {
      provider: "SHIPROCKET",
      orderId: null,
      shipmentId: null,
      awb: null,
      courierName: null,
      courierId: null,
      trackingUrl: null,
      labelUrl: null,
      status: "NOT_CREATED",
      pickupAddress: fullShippingAddress,
      package: {
        weight: 0.5,
        length: 10,
        breadth: 10,
        height: 5,
      },
      pickupScheduledAt: null,
      pickedUpAt: null,
      receivedAt: null,
    },
    replacementShipment: {
      provider: "SHIPROCKET",
      orderId: null,
      shipmentId: null,
      awb: null,
      courierName: null,
      courierId: null,
      trackingUrl: null,
      labelUrl: null,
      status: "NOT_CREATED",
      deliveryAddress: fullShippingAddress,
      package: {
        weight: 0.5,
        length: 10,
        breadth: 10,
        height: 5,
      },
      createdAt: null,
      shippedAt: null,
      deliveredAt: null,
    },
    timeline: initialTimeline,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // 1. Save in replacementRequests collection
  await setDoc(doc(db, "replacementRequests", requestId), replacementData);

  // 2. Add lightweight pointer on the original order
  try {
    const orderDocRef = doc(db, "orders", order.id);
    await updateDoc(orderDocRef, {
      hasReplacementRequest: true,
      replacementRequestId: requestId,
      replacementStatus: "REQUESTED",
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Could not set replacement flag on order doc:", err);
  }

  // 3. Send notification email to customer
  try {
    fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "replacement",
        subType: "SUBMITTED",
        customerEmail,
        customerName,
        orderId: order.orderNumber || order.id,
        requestId,
        reason,
        productName: formattedProducts[0]?.productName || "Jewellery Piece",
      }),
    }).catch(() => {});
  } catch (e) {
    // ignore async notification failures
  }

  return { success: true, requestId, replacementData };
}

/**
 * Real-time listener for customer's replacement requests
 */
export function listenToCustomerReplacements(customerEmail, customerId, onData, onError) {
  const collectionRef = collection(db, "replacementRequests");
  let queries = [];

  const cleanEmail = String(customerEmail || "").trim().toLowerCase();
  if (cleanEmail) {
    queries.push(query(collectionRef, where("customerEmail", "==", cleanEmail)));
  }
  if (customerId && customerId !== "GUEST") {
    queries.push(query(collectionRef, where("customerId", "==", customerId)));
  }

  if (queries.length === 0) {
    onData([]);
    return () => {};
  }

  const resultMap = new Map();

  const unsubs = queries.map((q) =>
    onSnapshot(
      q,
      (snapshot) => {
        snapshot.docs.forEach((d) => {
          resultMap.set(d.id, { id: d.id, ...d.data() });
        });
        const list = Array.from(resultMap.values());
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
        onData(list);
      },
      (err) => {
        console.warn("Error listening to customer replacements:", err);
        if (onError) onError(err);
      }
    )
  );

  return () => unsubs.forEach((u) => u());
}

/**
 * Real-time listener for all replacement requests (Admin Panel)
 */
export function listenToAllReplacements(onData, onError) {
  const collectionRef = collection(db, "replacementRequests");
  const q = query(collectionRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(list);
    },
    (err) => {
      console.warn("Error in listenToAllReplacements:", err);
      // Fallback without orderBy if index is still indexing
      onSnapshot(
        collectionRef,
        (fallbackSnap) => {
          const list = fallbackSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          list.sort((a, b) => {
            const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
            const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
            return tB - tA;
          });
          onData(list);
        },
        onError
      );
    }
  );
}

/**
 * Admin: Approve or Reject a Replacement Request
 */
export async function reviewReplacementRequest({
  requestId,
  decision, // "APPROVE" | "REJECT"
  remarks = "",
  rejectionReason = "",
  adminUser = null,
}) {
  if (!requestId) throw new Error("Request ID is required.");
  const docRef = doc(db, "replacementRequests", requestId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error(`Replacement request #${requestId} not found.`);

  const currentData = snap.data();
  const isApproval = decision === "APPROVE";
  const newStatus = isApproval ? "APPROVED" : "REJECTED";
  const adminIdentifier = adminUser?.displayName || adminUser?.email || "Admin";

  const newTimelineEvent = {
    status: newStatus,
    title: isApproval ? "Request Approved" : "Request Rejected",
    description: isApproval
      ? `Approved by ${adminIdentifier}. Ready for reverse pickup booking. Remarks: ${remarks || "None"}.`
      : `Rejected by ${adminIdentifier}. Reason: ${rejectionReason}. Remarks: ${remarks || "None"}.`,
    actor: adminIdentifier,
    timestamp: new Date().toISOString(),
  };

  const existingTimeline = Array.isArray(currentData.timeline) ? currentData.timeline : [];

  const updatePayload = {
    status: newStatus,
    statusDetails: REPLACEMENT_STATUS_MAP[newStatus],
    "admin.reviewedBy": adminIdentifier,
    "admin.reviewedAt": serverTimestamp(),
    "admin.remarks": remarks || "",
    "admin.rejectionReason": rejectionReason || "",
    timeline: [...existingTimeline, newTimelineEvent],
    updatedAt: serverTimestamp(),
  };

  await updateDoc(docRef, updatePayload);

  // Update original order's replacement status pointer
  if (currentData.orderId) {
    try {
      await updateDoc(doc(db, "orders", currentData.orderId), {
        replacementStatus: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {}
  }

  // Trigger email notification
  try {
    fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "replacement",
        subType: isApproval ? "APPROVED" : "REJECTED",
        customerEmail: currentData.customerEmail,
        customerName: currentData.customerName,
        orderId: currentData.orderNumber || currentData.orderId,
        requestId,
        remarks,
        rejectionReason,
      }),
    }).catch(() => {});
  } catch (e) {}

  return { success: true, status: newStatus };
}

/**
 * Admin: Book Reverse Pickup through Shiprocket API via Backend
 */
export async function bookReversePickup({
  requestId,
  pickupAddress,
  packageDetails,
  courierId = null,
  adminUser = null,
}) {
  if (!requestId) throw new Error("Request ID is required.");

  const res = await fetch("/api/shiprocket?action=book-reverse-pickup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "book-reverse-pickup",
      requestId,
      pickupAddress,
      packageDetails,
      courierId,
      adminIdentifier: adminUser?.displayName || adminUser?.email || "Admin",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to book reverse pickup.");
  }

  return data;
}

/**
 * Admin: Confirm Return Received & Inspection Outcome
 */
export async function confirmReturnReceived({
  requestId,
  inspectionStatus = "PASSED", // "PENDING" | "PASSED" | "FAILED"
  inspectionRemarks = "",
  adminUser = null,
}) {
  if (!requestId) throw new Error("Request ID is required.");

  const docRef = doc(db, "replacementRequests", requestId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error(`Replacement request #${requestId} not found.`);

  const currentData = snap.data();
  const adminIdentifier = adminUser?.displayName || adminUser?.email || "Admin";

  let newStatus = "RETURN_RECEIVED";
  let title = "Returned Item Received";
  let description = `Defective piece received at fulfillment hub by ${adminIdentifier}.`;

  if (inspectionStatus === "PASSED") {
    newStatus = "INSPECTION_APPROVED";
    title = "Inspection Passed";
    description = `Craftsmanship verification passed by ${adminIdentifier}. Approved for replacement dispatch. Remarks: ${inspectionRemarks || "None"}.`;
  } else if (inspectionStatus === "FAILED") {
    newStatus = "INSPECTION_REJECTED";
    title = "Inspection Failed";
    description = `Returned item failed inspection by ${adminIdentifier}. Reason: ${inspectionRemarks || "Defect criteria not met"}.`;
  }

  const existingTimeline = Array.isArray(currentData.timeline) ? currentData.timeline : [];
  const newTimelineEvent = {
    status: newStatus,
    title,
    description,
    actor: adminIdentifier,
    timestamp: new Date().toISOString(),
  };

  const updatePayload = {
    status: newStatus,
    statusDetails: REPLACEMENT_STATUS_MAP[newStatus],
    "reversePickup.status": "DELIVERED_TO_SELLER",
    "reversePickup.receivedAt": new Date().toISOString(),
    "admin.inspectionStatus": inspectionStatus,
    "admin.inspectionRemarks": inspectionRemarks || "",
    timeline: [...existingTimeline, newTimelineEvent],
    updatedAt: serverTimestamp(),
  };

  await updateDoc(docRef, updatePayload);

  // Send email if inspection passed or return received
  try {
    fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "replacement",
        subType: inspectionStatus === "PASSED" ? "INSPECTION_PASSED" : "RETURN_RECEIVED",
        customerEmail: currentData.customerEmail,
        customerName: currentData.customerName,
        orderId: currentData.orderNumber || currentData.orderId,
        requestId,
        inspectionRemarks,
      }),
    }).catch(() => {});
  } catch (e) {}

  return { success: true, status: newStatus };
}

/**
 * Admin: Create Forward Replacement Delivery Shipment in Shiprocket via Backend
 */
export async function createReplacementShipment({
  requestId,
  deliveryAddress,
  packageDetails,
  courierId = null,
  pickupLocation = "work",
  adminUser = null,
}) {
  if (!requestId) throw new Error("Request ID is required.");

  const res = await fetch("/api/shiprocket?action=create-replacement-delivery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create-replacement-delivery",
      requestId,
      deliveryAddress,
      packageDetails,
      courierId,
      pickupLocation,
      adminIdentifier: adminUser?.displayName || adminUser?.email || "Admin",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to create replacement shipment.");
  }

  return data;
}

/**
 * Track Reverse or Replacement AWB
 */
export async function trackShipmentAwb(awb) {
  if (!awb) throw new Error("AWB code is required.");
  const res = await fetch(`/api/shiprocket?action=track&awb=${encodeURIComponent(awb)}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Tracking lookup failed.");
  }
  return data;
}

