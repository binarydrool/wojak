# WOJAK.IO — Deployment Guide

Step-by-step instructions for deploying wojak.io to GitHub + Vercel.

---

## 1. Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `wojak-finance`
3. Description: `The OG WOJAK — Since April 2023. Community dashboard, education hub, and games.`
4. Set to **Public** (required for free Vercel hobby tier)
5. Do NOT initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

---

## 2. Push Code to GitHub

From the project root directory:

```bash
git init
git add -A
git commit -m "Initial commit — wojak.io v1"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/wojak-finance.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

---

## 3. Get a Free Etherscan API Key

1. Go to [etherscan.io/apis](https://etherscan.io/apis)
2. Click **Get API Key** (create a free account if needed)
3. Create a new API key — name it something like `wojak-finance`
4. Copy the key — you'll need it for Vercel in the next step

---

## 4. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click **Add New... → Project**
3. Find and select the `wojak-finance` repository from the list
4. Framework Preset should auto-detect **Next.js** — leave it as-is
5. Build settings should auto-detect — leave defaults:
   - Build Command: `next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

---

## 5. Add Environment Variables

Before clicking Deploy, expand the **Environment Variables** section:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_ETHERSCAN_API_KEY` | Your Etherscan API key from step 3 |

Click **Add** to save the variable.

---

## 6. Deploy

1. Click **Deploy**
2. Vercel will build and deploy the site — this takes 1-2 minutes
3. Once complete, you'll get a live URL like `wojak-finance.vercel.app`
4. Visit the URL and verify:
   - Dashboard loads with price chart and stats
   - Crypto 101 accordion sections expand/collapse
   - Migration Report renders all sections
   - Minesweeper opens from Games dropdown and is playable
   - CoW Swap widget loads in the swap section
   - All links work (Etherscan, DEX Screener, Twitter, etc.)

---

## 7. Add Custom Domain (Later)

When the `wojak.io` domain is acquired:

1. Go to your Vercel project → **Settings → Domains**
2. Enter `wojak.io` and click **Add**
3. Vercel will show DNS records you need to add at your domain registrar:
   - **A Record:** `76.76.21.21` (for root domain)
   - **CNAME:** `cname.vercel-dns.com` (for www subdomain, optional)
4. Add these DNS records at your registrar (Namecheap, GoDaddy, Cloudflare, etc.)
5. Wait for DNS propagation (usually 5-30 minutes, can take up to 48 hours)
6. Vercel will auto-provision a free SSL certificate once DNS is verified
7. The site will be live at `https://wojak.io`

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_ETHERSCAN_API_KEY` | Yes | Free Etherscan API key for token data |

---

## Redeployment

After pushing new commits to `main`, Vercel will automatically rebuild and redeploy. No manual action needed.

To manually trigger a redeploy:
1. Go to your Vercel project dashboard
2. Click **Deployments** → latest deployment → **...** → **Redeploy**
