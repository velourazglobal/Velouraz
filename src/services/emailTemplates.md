# Velouraz EmailJS Templates Setup Guide

Use these pre-designed luxury HTML templates in your EmailJS dashboard (https://dashboard.emailjs.com/admin/templates).

---

## Template 1: Customer Order Confirmation (User Template)

**Subject Line:** `Order Confirmed - {{order_id}} | Velouraz Haute Joaillerie`

**HTML Template Content:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Georgia', serif; background-color: #FAF8F5; color: #14111E; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5D7C5; border-radius: 16px; padding: 40px; }
    .header { text-align: center; border-bottom: 1px solid #E5D7C5; padding-bottom: 24px; margin-bottom: 24px; }
    .brand { font-size: 22px; letter-spacing: 0.25em; text-transform: uppercase; color: #14111E; font-weight: bold; }
    .subbrand { font-size: 14px; letter-spacing: 0.3em; text-transform: uppercase; color: #C8A46A; margin-top: 4px; }
    .title { font-size: 24px; margin-top: 20px; color: #14111E; font-weight: normal; }
    .details { font-family: 'Helvetica', sans-serif; font-size: 14px; line-height: 1.6; color: #786C60; margin-bottom: 24px; }
    .box { background: #F6F2EC; border-radius: 14px; padding: 20px; margin: 20px 0; font-family: 'Helvetica', sans-serif; font-size: 14px; }
    .item-list { white-space: pre-line; font-family: monospace; color: #14111E; font-size: 14px; }
    .total { font-size: 18px; font-weight: bold; color: #14111E; text-align: right; margin-top: 16px; border-top: 1px solid #E5D7C5; padding-top: 14px; }
    .btn { display: inline-block; background: #14111E; color: #FBF9F5; text-decoration: none; padding: 14px 28px; border-radius: 14px; font-family: 'Helvetica', sans-serif; font-size: 14px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; font-size: 14px; color: #9E9082; margin-top: 30px; border-top: 1px solid #E5D7C5; padding-top: 20px; font-family: 'Helvetica', sans-serif; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Velouraz</div>
      <div class="subbrand">Haute Joaillerie</div>
      <h1 class="title">Thank You For Your Order</h1>
    </div>

    <div class="details">
      Dear <strong>{{customer_name}}</strong>,<br><br>
      We are delighted to confirm that your order <strong>#{{order_id}}</strong> has been received and is currently being hand-packed by our master artisans.
    </div>

    <div class="box">
      <strong>Order Summary:</strong>
      <div class="item-list">{{item_list}}</div>
      <div class="total">Total: {{order_total}}</div>
    </div>

    <div class="details">
      <strong>Shipping Address:</strong><br>
      {{shipping_address}}<br><br>
      <strong>Payment Method:</strong> {{payment_method}} ({{payment_status}})<br>
      <strong>Shiprocket Tracking AWB:</strong> {{tracking_number}}
    </div>

    <div style="text-align: center;">
      <a href="{{tracking_link}}" class="btn">Track Shipment Live</a>
    </div>

    <div class="footer">
      Velouraz Haute Joaillerie — Handcrafted Masterpieces.<br>
      If you have questions, contact our concierge at support@velouraz.com
    </div>
  </div>
</body>
</html>
```

---

## Template 2: Admin New Order Alert (Admin Template)

**Subject Line:** `🚨 New Order Alert #{{order_id}} — {{order_total}}`

**HTML Template Content:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica', sans-serif; background-color: #F8F5F0; color: #14111E; margin: 0; padding: 30px 15px; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 2px solid #14111E; border-radius: 16px; padding: 30px; }
    .header { background: #14111E; color: #FBF9F5; padding: 16px 20px; border-radius: 14px; margin-bottom: 20px; text-align: center; }
    .title { font-size: 16px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: bold; margin: 0; }
    .row { padding: 8px 0; border-bottom: 1px solid #E5D7C5; font-size: 14px; }
    .label { font-weight: bold; color: #786C60; text-transform: uppercase; font-size: 14px; }
    .items { background: #F6F2EC; padding: 15px; border-radius: 14px; margin: 15px 0; white-space: pre-line; font-family: monospace; font-size: 14px; }
    .total-badge { background: #C8A46A; color: #14111E; font-weight: bold; font-size: 18px; padding: 14px 15px; border-radius: 8px; text-align: center; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 class="title">New Velouraz Order Received</h2>
    </div>

    <div class="row"><span class="label">Order ID:</span> <strong>#{{order_id}}</strong></div>
    <div class="row"><span class="label">Order Date:</span> {{order_date}}</div>
    <div class="row"><span class="label">Customer Name:</span> {{customer_name}}</div>
    <div class="row"><span class="label">Customer Email:</span> {{customer_email}}</div>
    <div class="row"><span class="label">Customer Phone:</span> {{customer_phone}}</div>
    <div class="row"><span class="label">Payment Method:</span> {{payment_method}} ({{payment_status}})</div>
    <div class="row"><span class="label">Shiprocket Tracking AWB:</span> {{tracking_number}}</div>

    <div style="margin-top: 15px;"><span class="label">Shipping Address:</span><br><strong>{{shipping_address}}</strong></div>

    <div class="items">
      <strong>Ordered Products:</strong><br>
      {{item_list}}
    </div>

    <div class="total-badge">
      Total Order Value: {{order_total}}
    </div>
  </div>
</body>
</html>
```
