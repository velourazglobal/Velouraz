import React, { useState } from "react";
import { ShoppingBag, Eye, X, Printer, MapPin, Truck, Phone, Mail, User, CreditCard, Box } from "lucide-react";
import { statusBadgeClasses } from "./AdminUtils";
import { motion, AnimatePresence } from "framer-motion";

const OrdersTable = ({ orders }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const orderNum = order.orderNumber || order.orderId || order.id || 'N/A';
    const cName = order.customerName || order.customer || order.shippingAddress?.name || 'Customer';
    const cEmail = order.email || '';
    const cPhone = order.phone || '';

    const sAddr = order.shippingAddress || {};
    const fullAddrSrc = sAddr.fullAddress || sAddr.address || '';

    const dateStr = order.orderDate ? new Date(order.orderDate).toLocaleDateString() :
      (order.createdAt?.toMillis ? new Date(order.createdAt.toMillis()).toLocaleDateString() : 'N/A');

    const items = order.items || order.cartItems || [];
    const sub = order.subtotal || order.totalAmount || 0;
    const ship = order.shippingFee || 0;
    const disc = order.discountAmount || 0;
    const tot = order.totalAmount || order.total || 0;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${orderNum}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 28px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 2px; }
            .info { margin-bottom: 40px; display: flex; justify-content: space-between; font-size: 14px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f8f8; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; color: #666; }
            .totals { width: 300px; float: right; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .totals-row.bold { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 12px; margin-top: 4px; }
            .footer { clear: both; text-align: center; margin-top: 60px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">INVOICE</div>
            <div>Order Reference: <strong>#${orderNum}</strong></div>
          </div>
          <div class="info">
            <div>
              <strong>BILLED TO:</strong><br/>
              ${cName}<br/>
              ${fullAddrSrc}<br/>
              ${sAddr.city ? sAddr.city + ', ' : ''}${sAddr.state || ''} ${sAddr.pincode || ''}<br/>
              ${cEmail ? cEmail + '<br/>' : ''}
              ${cPhone ? cPhone : ''}
            </div>
            <div style="text-align: right">
              <strong>Order Date:</strong> ${dateStr}<br/>
              <strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}<br/>
              <strong>Payment Status:</strong> ${order.paymentStatus || 'Pending'}<br/>
              <strong>Order Status:</strong> ${order.status || order.orderStatus || 'Pending'}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center">Qty</th>
                <th style="text-align: right">Price</th>
                <th style="text-align: right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(i => `
                <tr>
                  <td>${i.name} ${i.size ? `(Size: ${i.size})` : ''} ${i.metal ? `(Metal: ${i.metal})` : ''}</td>
                  <td style="text-align: center">${i.quantity || 1}</td>
                  <td style="text-align: right">₹${Number(i.price || 0).toLocaleString()}</td>
                  <td style="text-align: right">₹${(Number(i.price || 0) * Number(i.quantity || 1)).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
             <div class="totals-row">
               <span>Subtotal:</span>
               <span>₹${Number(sub).toLocaleString()}</span>
             </div>
             ${ship > 0 ? `
             <div class="totals-row">
               <span>Insured Delivery:</span>
               <span>₹${Number(ship).toLocaleString()}</span>
             </div>` : `
             <div class="totals-row">
               <span>Insured Delivery:</span>
               <span>Free</span>
             </div>
             `}
             ${disc > 0 ? `
             <div class="totals-row" style="color: #10b981;">
               <span>Discount:</span>
               <span>-₹${Number(disc).toLocaleString()}</span>
             </div>` : ''}
             <div class="totals-row bold">
               <span>Total:</span>
               <span>₹${Number(tot).toLocaleString()}</span>
             </div>
          </div>
          <div class="footer">
            Thank you for shopping with Velouraz.
          </div>
          <script>
            window.onload = function() { setTimeout(function(){ window.print(); }, 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full">
        {/* Header */}
        <div className="px-6 py-5 sm:px-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 flex items-center gap-2.5">
              <span className="p-1.5 bg-[#811331]/10 rounded-lg">
                <ShoppingBag size={15} className="text-[#811331]" />
              </span>
              Recent Orders
            </h2>
            <p className="text-base text-slate-400 font-medium mt-1 ml-0.5">
              Latest customer transactions
            </p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[16px] font-bold text-emerald-600 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[16px] font-bold text-slate-400 uppercase tracking-[0.12em] border-b border-slate-50 bg-slate-50/60">
                <th className="px-8 py-4">Order ID</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-8 py-4 text-center">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-8 py-4">
                    <span className="text-[16px] font-bold text-slate-900 font-mono">#{row.orderNumber || row.orderId || row.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[16px] font-semibold text-slate-700">{row.customer || row.customerName || row.shippingAddress?.name || "Customer"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[16px] font-bold text-slate-900">₹{Number(row.totalAmount || row.total || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[16px] font-bold uppercase tracking-wide border ${statusBadgeClasses(row.status || row.orderStatus || "Pending")}`}>
                      {row.status || row.orderStatus || "Pending"}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(row)}
                      className="p-2 bg-slate-50 rounded-lg hover:bg-slate-200 transition-colors border border-slate-100 text-slate-600 inline-flex"
                      title="View Order Details & Invoice"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                      <ShoppingBag size={22} className="text-slate-300" />
                    </div>
                    <p className="text-base font-bold text-slate-500 mb-0.5">No orders yet</p>
                    <p className="text-[16px] text-slate-400">Customer purchases will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-slate-100">
          {orders.map((row) => (
            <div key={row.id} className="p-5 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900 font-mono">#{row.orderNumber || row.orderId || row.id.slice(0, 8)}</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[16px] font-bold uppercase tracking-wide border ${statusBadgeClasses(row.status || row.orderStatus)}`}>
                  {row.status || row.orderStatus || "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-base font-medium text-slate-500">{row.customer || row.customerName || row.shippingAddress?.name || "Customer"}</p>
                  <p className="text-sm font-bold text-[#811331]">₹{Number(row.totalAmount || row.total || 0).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(row)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Eye size={14} /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-slate-800">
                    Order Details
                  </h3>
                  <span className="text-sm font-mono font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-md shadow-sm">
                    #{selectedOrder.orderNumber || selectedOrder.orderId || selectedOrder.id}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePrintInvoice(selectedOrder)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                  >
                    <Printer size={16} /> Print Invoice
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="overflow-y-auto p-6 md:p-8 flex-1 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <User size={14} /> Customer Information
                    </h4>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-3">
                      <p className="font-semibold text-slate-800 flex items-center gap-2">
                        {selectedOrder.customerName || selectedOrder.customer || selectedOrder.shippingAddress?.name || "Customer"}
                      </p>
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Mail size={16} className="text-slate-400" />
                        {selectedOrder.email || 'No email provided'}
                      </p>
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Phone size={16} className="text-slate-400" />
                        {selectedOrder.phone || 'No phone provided'}
                      </p>
                    </div>
                  </div>

                  {/* Shipping / Billing */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <MapPin size={14} /> Delivery Address
                    </h4>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-3">
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {selectedOrder.shippingAddress?.fullAddress || selectedOrder.shippingAddress?.address || "Address not provided"}
                      </p>
                      {selectedOrder.shippingAddress?.city && (
                        <p className="text-sm text-slate-600">
                          {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Box size={14} /> Order Status
                    </h4>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 grid grid-cols-2 gap-y-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Status</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${statusBadgeClasses(selectedOrder.status || selectedOrder.orderStatus)}`}>
                          {selectedOrder.status || selectedOrder.orderStatus || "Pending"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Date</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleString() :
                            (selectedOrder.createdAt?.toMillis ? new Date(selectedOrder.createdAt.toMillis()).toLocaleString() : 'N/A')}
                        </p>
                      </div>
                      {selectedOrder.trackingNumber && (
                        <div className="col-span-2 pt-2 border-t border-slate-200">
                          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Truck size={12} /> Tracking</p>
                          <p className="text-sm font-mono font-medium text-slate-700">{selectedOrder.trackingNumber} ({selectedOrder.courierName || 'Shiprocket'})</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <CreditCard size={14} /> Payment Details
                    </h4>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 grid grid-cols-2 gap-y-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Method</p>
                        <p className="text-sm font-bold uppercase text-slate-700">{selectedOrder.paymentMethod || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Status</p>
                        <p className="text-sm font-semibold text-emerald-600">{selectedOrder.paymentStatus || 'Pending'}</p>
                      </div>
                      {selectedOrder.paymentDetails?.razorpayPaymentId && (
                        <div className="col-span-2 pt-2 border-t border-slate-200">
                          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">Transaction ID</p>
                          <p className="text-sm font-mono text-slate-600">{selectedOrder.paymentDetails.razorpayPaymentId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <ShoppingBag size={14} /> Ordered Items
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-xs font-bold text-slate-500 uppercase">
                        <th className="px-5 py-3">Item</th>
                        <th className="px-5 py-3 text-center">Qty</th>
                        <th className="px-5 py-3 text-right">Unit Price</th>
                        <th className="px-5 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedOrder.items || selectedOrder.cartItems || []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {item.image || item.primaryImage ? (
                                <img src={item.image || item.primaryImage} alt={item.name} className="w-10 h-10 object-cover rounded bg-slate-100" />
                              ) : (
                                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center"><Box size={16} className="text-slate-300" /></div>
                              )}
                              <div>
                                <p className="text-sm font-bold text-slate-800">{item.name}</p>
                                {(item.size || item.metal) && (
                                  <p className="text-xs text-slate-500">
                                    {item.size ? `Size: ${item.size} ` : ''}
                                    {item.metal ? `Metal: ${item.metal}` : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="text-sm font-medium text-slate-700">{item.quantity || 1}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-sm text-slate-600">₹{Number(item.price || 0).toLocaleString()}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-sm font-bold text-slate-800">₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotals & Totals */}
                <div className="flex justify-end pt-4">
                  <div className="w-full md:w-80 space-y-3 text-sm">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-semibold">₹{Number(selectedOrder.subtotal || selectedOrder.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    {Number(selectedOrder.shippingFee) > 0 ? (
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Shipping</span>
                        <span className="font-semibold">₹{Number(selectedOrder.shippingFee).toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-emerald-600">
                        <span>Insured Delivery</span>
                        <span className="font-bold uppercase tracking-wider text-xs">Free</span>
                      </div>
                    )}
                    {Number(selectedOrder.discountAmount) > 0 && (
                      <div className="flex justify-between items-center text-emerald-600">
                        <span>Discount</span>
                        <span className="font-semibold">-₹{Number(selectedOrder.discountAmount).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold text-slate-900 border-t border-slate-200 pt-3">
                      <span>Total Paid</span>
                      <span>₹{Number(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OrdersTable;

