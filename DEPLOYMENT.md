# Velouraz — Vercel Deployment Guide

## Setting Up Environment Variables on Vercel

All credentials must be added to Vercel Dashboard — never commit `.env` to Git.

### Steps

1. Go to [vercel.com](https://vercel.com) → Your Project → **Settings** → **Environment Variables**
2. For each variable below:
   - Click **Add New**
   - Enter the **Name** and **Value**
   - Select **All Environments** (Production + Preview + Development)
   - Click **Save**
3. After adding all variables → **Redeploy** the project

---

## Required Environment Variables

### Firebase (Client-side)
| Variable | Where to find |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → General → Your Apps |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same as above |
| `VITE_FIREBASE_PROJECT_ID` | Same as above |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same as above |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same as above |
| `VITE_FIREBASE_APP_ID` | Same as above |
| `VITE_FIREBASE_MEASUREMENT_ID` | Same as above |

### Cloudinary
| Variable | Where to find |
|---|---|
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary Console → Dashboard |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary Console → Settings → Upload Presets |
| `CLOUDINARY_CLOUD_NAME` | Same as VITE_CLOUDINARY_CLOUD_NAME |
| `CLOUDINARY_API_KEY` | Cloudinary Console → Settings → Access Keys |
| `CLOUDINARY_API_SECRET` | Cloudinary Console → Settings → Access Keys |

### Email / SMTP
| Variable | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Gmail App Password (16 chars, get from myaccount.google.com/apppasswords) |
| `SMTP_FROM` | `"Velouraz High Jewellery" <no-reply@velouraz.in>` |

### Admin & Payments
| Variable | Where to find |
|---|---|
| `ADMIN_EMAIL` | Your notification email |
| `VITE_ADMIN_EMAIL` | Same as ADMIN_EMAIL |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_ID` | Same as VITE_RAZORPAY_KEY_ID |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys |

### Security
| Variable | How to generate |
|---|---|
| `OTP_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### Site
| Variable | Value |
|---|---|
| `VITE_SITE_URL` | `https://www.velouraz.in` |

---

## Security Checklist Before Deploying

- [ ] `.env` is in `.gitignore` — confirmed
- [ ] No hardcoded credentials in any source file
- [ ] All `|| "hardcoded_fallback"` patterns removed
- [ ] Firebase security rules deployed via Firebase Console
- [ ] Cloudinary upload preset set to **Unsigned** (for client uploads) but API Secret protected (server-only)
- [ ] Gmail App Password rotated (old one was potentially exposed)
- [ ] OTP_SECRET generated with `crypto.randomBytes(32)`
- [ ] Razorpay using `rzp_live_` keys for production (not test keys)

---

## ⚠️ Immediate Actions Required

1. **Rotate your Gmail App Password** — the old one (`euvkrkztkjwzeopo`) may have been exposed if the repo was ever pushed to GitHub. Generate a new one at: https://myaccount.google.com/apppasswords

2. **Check GitHub for exposed secrets**: Go to your GitHub repo → Security → Secret scanning alerts

3. **Generate and set OTP_SECRET**: Run this command and copy the output as your OTP_SECRET:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

---

## Local Development

```bash
# Copy the example file
cp .env.example .env

# Fill in your credentials in .env
# Then start the dev server
npm run dev
```

The `.env` file is gitignored — it will never be committed to GitHub.
