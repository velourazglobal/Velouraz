export const generateInvoicePDF = (order) => {
  if (!order) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download or print the invoice PDF.");
    return;
  }

  // Extract date
  let orderDate = "N/A";
  if (order.createdAt?.seconds) {
    orderDate = new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  } else if (order.orderDate) {
    const d = new Date(order.orderDate);
    orderDate = !isNaN(d.getTime())
      ? d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
      : order.orderDate;
  } else if (order.date) {
    orderDate = order.date;
  } else {
    orderDate = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  // Extract Customer Details
  const customerName =
    order.customerName ||
    order.shippingAddress?.name ||
    order.shippingDetails?.name ||
    order.name ||
    "Valued Customer";

  const email =
    order.email ||
    order.shippingAddress?.email ||
    order.shippingDetails?.email ||
    order.userEmail ||
    "N/A";

  const phone =
    order.phone ||
    order.shippingAddress?.phone ||
    order.shippingDetails?.phone ||
    order.contactNo ||
    "N/A";

  // Build Address Lines
  let addressLines = [];
  if (typeof order.shippingAddress === "object" && order.shippingAddress !== null) {
    const addr = order.shippingAddress;
    if (addr.fullAddress) {
      addressLines.push(addr.fullAddress);
    } else {
      const line1 = [addr.flat, addr.address].filter(Boolean).join(", ");
      if (line1) addressLines.push(line1);
      const line2 = [addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");
      if (line2) addressLines.push(line2);
      if (addr.country) addressLines.push(addr.country);
    }
  } else if (typeof order.shippingAddress === "string" && order.shippingAddress.trim()) {
    addressLines.push(order.shippingAddress);
  } else if (order.shippingDetails) {
    const det = order.shippingDetails;
    if (typeof det === "string") {
      addressLines.push(det);
    } else if (typeof det === "object") {
      if (det.address) addressLines.push(det.address);
      const line2 = [det.city, det.state, det.pincode].filter(Boolean).join(", ");
      if (line2) addressLines.push(line2);
    }
  }

  if (addressLines.length === 0) {
    addressLines.push("Address not provided");
  }

  // Format Order items
  const itemsHTML = (order.items || [])
    .map((item, index) => {
      const qty = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const itemTotal = price * qty;
      const variantSpecs = [
        item.size ? `Size: ${item.size}` : "",
        item.metal ? `Metal: ${item.metal}` : ""
      ]
        .filter(Boolean)
        .join(" | ");

      return `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 12px 14px; color: #6B7280; text-align: center; font-size: 13px;">${index + 1}</td>
        <td style="padding: 12px 14px;">
          <div style="font-weight: 600; color: #1F2937; font-size: 14px;">${item.name || "Jewellery Item"}</div>
          ${variantSpecs ? `<div style="font-size: 12px; color: #6B7280; margin-top: 2px;">${variantSpecs}</div>` : ""}
        </td>
        <td style="padding: 12px 14px; text-align: center; font-size: 14px; color: #374151;">${qty}</td>
        <td style="padding: 12px 14px; text-align: right; font-size: 14px; color: #374151;">₹${price.toLocaleString("en-IN")}</td>
        <td style="padding: 12px 14px; text-align: right; font-weight: 700; color: #2e0e43; font-size: 14px;">₹${itemTotal.toLocaleString("en-IN")}</td>
      </tr>
    `;
    })
    .join("");

  // Calculate Subtotal & Totals
  const itemsTotal = (order.items || []).reduce(
    (acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );
  const subtotal = Number(order.subtotal || itemsTotal || order.total || 0);
  const discountAmount = Number(order.discountAmount || 0);
  const totalAmount = Number(order.total || order.totalAmount || subtotal - discountAmount);

  const displayOrderNum = (order.orderNumber || order.id || "N/A").toUpperCase();

  const paymentMethodText = (() => {
    const m = String(order.paymentMethod || "online").toLowerCase();
    if (m === "cod" || m.includes("cash")) return "Cash on Delivery (COD)";
    if (m === "razorpay") return "Razorpay Online Payment";
    return order.paymentMethod || "Online Payment";
  })();

  const paymentStatusText = order.paymentStatus || (order.paymentMethod === "cod" ? "Pending" : "Paid");

  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Tax Invoice - ${displayOrderNum}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937; margin: 0; padding: 24px; background: #ffffff; }
          
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2e0e43; padding-bottom: 20px; margin-bottom: 24px; }
          .brand-title { font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 800; color: #2e0e43; letter-spacing: 0.12em; text-transform: uppercase; margin: 0; }
          .brand-subtitle { font-size: 12px; text-transform: uppercase; letter-spacing: 0.25em; color: #C8A97A; font-weight: 700; margin-top: 4px; }
          
          .inv-meta { text-align: right; }
          .inv-badge { font-size: 18px; font-weight: 800; color: #2e0e43; letter-spacing: 0.05em; margin-bottom: 6px; }
          .inv-detail { font-size: 13px; color: #4B5563; margin-top: 2px; }
          
          .grid { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
          .card { flex: 1; background: #FAF8F5; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; }
          .card-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #7B6D63; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 10px; }
          
          .info-row { margin-bottom: 4px; font-size: 13.5px; line-height: 1.5; color: #374151; }
          .info-row strong { color: #111827; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #2e0e43; color: #ffffff; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em; padding: 12px 14px; text-align: left; }
          th.right { text-align: right; }
          th.center { text-align: center; }
          
          .totals-container { display: flex; justify-content: flex-end; margin-bottom: 30px; }
          .totals { width: 320px; font-size: 14px; }
          .totals .row { display: flex; justify-content: space-between; padding: 6px 0; color: #4B5563; }
          .totals .grand-total { font-size: 16px; font-weight: 800; color: #2e0e43; border-top: 2px solid #2e0e43; padding-top: 12px; margin-top: 8px; }
          
          .footer { margin-top: 40px; text-align: center; font-size: 12.5px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 16px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">Velouraz</h1>
            <div class="brand-subtitle">Official Luxury Tax Invoice</div>
          </div>
          <div class="inv-meta">
            <div class="inv-badge">INVOICE</div>
            <div class="inv-detail"><strong>Invoice #:</strong> ${displayOrderNum}</div>
            <div class="inv-detail"><strong>Date:</strong> ${orderDate}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Billed To (Customer Details)</div>
            <div class="info-row"><strong>Customer Name:</strong> ${customerName}</div>
            <div class="info-row"><strong>Email ID:</strong> ${email}</div>
            <div class="info-row"><strong>Contact No:</strong> ${phone}</div>
            <div class="info-row" style="margin-top: 8px;"><strong>Shipping Address:</strong></div>
            ${addressLines.map((line) => `<div class="info-row" style="color: #4B5563;">${line}</div>`).join("")}
          </div>
          
          <div class="card">
            <div class="card-title">Merchant Details</div>
            <div class="info-row"><strong>Merchant:</strong> House of Velouraz</div>
            <div class="info-row"><strong>Support Email:</strong> contact@velouraz.in</div>
            <div class="info-row"><strong>Website:</strong> www.velouraz.in</div>
            <div class="info-row" style="margin-top: 8px;"><strong>Payment Method:</strong> ${paymentMethodText}</div>
            <div class="info-row"><strong>Payment Status:</strong> <span style="font-weight: 700; color: ${paymentStatusText.toLowerCase() === "paid" ? "#059669" : "#D97706"};">${paymentStatusText}</span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;" class="center">#</th>
              <th>Item Description</th>
              <th class="center" style="width: 70px;">Qty</th>
              <th class="right" style="width: 120px;">Unit Price</th>
              <th class="right" style="width: 130px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML || `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #9CA3AF;">No items recorded</td></tr>`}
          </tbody>
        </table>

        <div class="totals-container">
          <div class="totals">
            <div class="row">
              <span>Subtotal:</span>
              <span>₹${subtotal.toLocaleString("en-IN")}</span>
            </div>
            ${
              discountAmount > 0
                ? `<div class="row" style="color: #059669;">
                    <span>Discount Applied:</span>
                    <span>- ₹${discountAmount.toLocaleString("en-IN")}</span>
                  </div>`
                : ""
            }
            <div class="row grand-total">
              <span>Total Amount Paid:</span>
              <span>₹${totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for shopping with House of Velouraz. For support or queries regarding your order, please email <strong>contact@velouraz.in</strong>.</p>
          <p>© ${new Date().getFullYear()} VELOURAZ. All rights reserved.</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
};
