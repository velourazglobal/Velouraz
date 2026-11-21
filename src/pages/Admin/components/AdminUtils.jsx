import React from "react";

export const ORDER_STATUSES = [
  "Order Placed",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Return Requested",
  "Returned",
];

export const statusBadgeClasses = (status) => {
  const s = String(status || "").trim().toLowerCase();
  switch (s) {
    case "order placed":
      return "bg-slate-100 text-slate-800 border-slate-300";
    case "confirmed":
    case "order confirmed":
      return "bg-emerald-50 text-emerald-800 border-emerald-300";
    case "processing":
      return "bg-blue-50 text-blue-800 border-blue-300";
    case "packed":
    case "ready to ship":
      return "bg-purple-50 text-purple-800 border-purple-300";
    case "shipped":
    case "dispatched":
      return "bg-sky-50 text-sky-800 border-sky-300";
    case "in transit":
      return "bg-indigo-50 text-indigo-800 border-indigo-300";
    case "out for delivery":
      return "bg-amber-50 text-amber-900 border-amber-300";
    case "delivered":
      return "bg-teal-50 text-teal-900 border-teal-300 font-bold";
    case "cancelled":
    case "canceled":
      return "bg-rose-50 text-rose-800 border-rose-300";
    case "return requested":
      return "bg-orange-50 text-orange-800 border-orange-300";
    case "returned":
      return "bg-stone-100 text-stone-700 border-stone-300";

    // Payment statuses
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "failed":
      return "bg-rose-50 text-rose-700 border-rose-200";

    // Stock statuses
    case "in stock":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "low stock":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "out of stock":
      return "bg-rose-50 text-rose-700 border-rose-100";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

