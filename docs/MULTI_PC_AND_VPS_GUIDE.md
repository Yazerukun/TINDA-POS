# Multi-PC LAN Hub & Self-Hosted VPS Guide — TINDA POS

**Official Architecture & Deployment Guide for Store Owners, IT Administrators, and Retail Cashiers.**

---

## 📌 Executive Summary

TINDA POS is built from the ground up as an **offline-first retail point-of-sale system**. As retail stores grow from single-counter sari-sari stores into multi-lane grocery markets or mini-marts, store owners frequently require:
1. **Multiple Computers in One Store (Local LAN):** Two or more cashier terminals in the store sharing a single unified database with zero internet dependency.
2. **Remote Store Monitoring (Self-Hosted VPS):** Store owners who want to view daily sales, gross profit, and live stock levels on their smartphone or laptop while away from the store.

This guide provides complete, step-by-step instructions for deploying both solutions safely, securely, and with **zero risk of database corruption or data loss**.

---

## ⚠️ Critical Rule: Why Windows Shared Folders (SMB) are Forbidden

> [!CAUTION]
> **NEVER share the `tindapos.db` file across Windows Network Shares (SMB / Shared Folders / Mapped Drives like `Z:\database\tindapos.db`).**

### Why SMB Sharing Corrupts SQLite:
1. **File Locking Starvation (`SQLITE_BUSY`):** Windows SMB networking does not support low-latency POS byte-range locking. When two cashiers ring up sales simultaneously, the database locks up and transactions fail.
2. **Network Cache Incoherence:** Windows SMB caches file writes locally. If PC 1 updates stock while PC 2 is reading, PC 2 receives stale data, resulting in index corruption and negative inventory.
3. **Sudden Disconnect Corruption:** If Wi-Fi hiccups during a checkout write over SMB, the SQLite journal breaks, corrupting the entire database.

### The Proven Solution: Master-Satellite Network Architecture
Instead of sharing raw files, TINDA POS uses a **Master-Satellite RPC Service**:
- Only **PC 1 (Master Server)** directly opens and writes to the local SQLite database.
- **PC 2 and PC 3 (Satellite Terminals)** communicate with PC 1 via fast, authenticated local network calls (<5ms response time).
- Transactions are serialized with atomic locking (`BEGIN IMMEDIATE`), ensuring **100% database safety and zero corruption**.

---

## 🏪 PART 1: Multi-Computer Setup for One Store (Local LAN Mode)

This setup is ideal for stores with:
- **Two Cashier Lanes** at the front counter.
- **One Cashier at Counter + One Back-Office / Stockroom PC** for encoding products and receiving supplier stock.

### 🔌 Hardware Requirements (Zero Internet Needed)
1. **Two or more Windows Computers** (Windows 10 or 11).
2. **One Standard Wi-Fi Router or Ethernet Network Switch** (Internet is **NOT** required; local Wi-Fi / LAN cable connection is sufficient).

```
                      ┌─────────────────────────────────────────┐
                      │      Local Store Wi-Fi Router           │
                      │     (No Internet Connection Needed)     │
                      └────────────────────┬────────────────────┘
                                           │
                 ┌─────────────────────────┴─────────────────────────┐
                 │                                                   │
                 ▼                                                   ▼
   ┌───────────────────────────┐                       ┌───────────────────────────┐
   │    PC 1: MASTER SERVER    │                       │  PC 2: SATELLITE CLIENT   │
   │  (Cashier 1 / Counter 1)  │                       │  (Cashier 2 / Counter 2)  │
   │                           │                       │                           │
   │  • Hosts SQLite Database  │◄── Authenticated RPC ─┤  • Cashier Terminal Only  │
   │  • LAN IP: 192.168.1.50   │    (Encrypted Token)  │  • Connected to PC 1      │
   │  • Full Admin Controls    │                       │  • Zero File Share Risk   │
   └───────────────────────────┘                       └───────────────────────────┘
```

---

### Step-by-Step LAN Setup

#### Step 1: Configure PC 1 as the Master Server
1. Launch **TINDA POS** on PC 1 (your primary checkout computer).
2. Go to **Settings** &rarr; **Terminal Network**.
3. Select **"Master Server Mode (Host)"**.
4. The screen will display:
   - **Local IP Address:** e.g., `192.168.1.50`
   - **LAN Service Port:** `3111`
   - **Status:** `🟢 Master Server Active (Listening for Satellite Terminals)`
5. Click **"Generate Security Pairing PIN"**. A 6-digit PIN (e.g., `749201`) will appear on the screen.

#### Step 2: Connect PC 2 (and PC 3) as Satellite Terminals
1. Launch **TINDA POS** on PC 2.
2. Go to **Settings** &rarr; **Terminal Network**.
3. Select **"Satellite Terminal Mode"**.
4. Enter the Master Server details:
   - **Master IP Address:** `192.168.1.50` (the IP shown on PC 1).
   - **Security PIN:** Enter the 6-digit PIN displayed on PC 1.
5. Click **"Connect to Master"**.
6. Within 2 seconds, the connection status badge in the header will turn green:  
   `🟢 Connected to Master Server (192.168.1.50)`.

---

### 🛡️ Safety & Security Guarantees in Local LAN Mode

| Security Feature | How It Protects Your Store |
| :--- | :--- |
| **6-Digit Pairing PIN & HMAC Token** | Prevents unauthorized devices or customers connected to store Wi-Fi from querying sales or accessing product data. |
| **Atomic Inventory Lock (`BEGIN IMMEDIATE`)** | If Cashier 1 and Cashier 2 sell the last remaining unit of an item at the exact same millisecond, the first checkout commits cleanly and the second cashier immediately receives an *"Insufficient Stock"* alert. |
| **Role-Based Satellite Lockdown** | Satellite terminals are restricted to cashier functions (Scanning, Cart, Cash / GCash / Maya Checkout, Utang Recording, and Product Search). Destructive administrative options (**Reset Database**, **Restore Backup**, and **Raw File Exports**) are strictly locked to the physical Master PC. |
| **Instant WebSocket Stock Broadcast** | The moment a sale completes on Terminal 1, an `inventory:changed` event immediately updates the stock count on Terminal 2's screen without needing a manual page refresh. |

---

## ☁️ PART 2: Self-Hosted VPS Setup (Cloud Hub & Remote Owner Monitoring)

This setup is ideal for store owners who want to:
- Monitor daily sales, drawer cash count, and profit reports from their **smartphone or home computer**.
- Centralize reports across multiple retail branches without paying expensive monthly SaaS software fees.

> [!NOTE]
> **Store Owner Hosting Responsibility:** TINDA POS is 100% free software for store operations. Cloud VPS servers are rented and managed directly by the store owner through their cloud provider of choice (DigitalOcean, Linode, AWS Lightsail, or Hetzner). The monthly server fee (typically $4 to $6 / ~₱250 to ₱350 per month) is paid directly by the store owner to the provider.

---

### Step-by-Step VPS Cloud Setup

#### Step 1: Deploy a Linux VPS Instance
1. Create an account with any cloud VPS provider (e.g., [DigitalOcean](https://digitalocean.com), [Linode](https://linode.com), or [Hetzner](https://hetzner.com)).
2. Deploy a basic virtual server:
   - **OS:** Ubuntu 22.04 LTS or 24.04 LTS x64
   - **Plan:** Basic Shared CPU (1 GB RAM, 1 vCPU, 25 GB SSD is more than sufficient)
   - **Cost:** ~$4 to $5 USD / month.
3. Note your VPS **Public IP Address** (e.g. `143.198.50.12`). Optional: Point a domain name to it (e.g., `pos.mystore.com`).

#### Step 2: Install the TINDA Cloud Hub Daemon
On your VPS terminal, execute the automated setup script:
```bash
# Update server and install Node.js runtime
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx

# Download and initialize TINDA Cloud Hub daemon
git clone https://github.com/Yazerukun/TINDA-POS-Cloud-Hub.git /opt/tinda-cloud
cd /opt/tinda-cloud && npm install --production

# Generate secure API Secret Token
openssl rand -hex 32 > /opt/tinda-cloud/.secret_token
```

#### Step 3: Enable Free Automated SSL Certificate (HTTPS)
```bash
# Secure the server with Let's Encrypt SSL
sudo certbot --nginx -d pos.mystore.com
```

#### Step 4: Link Your Store's Master PC to the VPS
1. On your physical store's Master PC, open **TINDA POS**.
2. Go to **Settings** &rarr; **Cloud Sync & VPS**.
3. Fill in your VPS configuration:
   - **VPS Endpoint URL:** `https://pos.mystore.com` (or `https://143.198.50.12:8443`)
   - **API Secret Token:** Paste the secret token generated in Step 2.
   - **Sync Frequency:** Every 5 minutes (default).
4. Click **"Test Connection & Enable Sync"**.
5. Once verified, the badge will confirm: `🟢 Cloud Sync Armed (Last sync: Just now)`.

#### Step 5: Access the Remote Owner Dashboard
1. Open your smartphone or laptop browser.
2. Navigate to your VPS URL: `https://pos.mystore.com`.
3. Log in with your **Owner Master PIN** or admin credentials.
4. View live, real-time store metrics:
   - Today's Gross Sales & Net Profit
   - Active Cash in Drawer (Cash Count)
   - Real-time Low Stock & Critical Replenishment Alerts
   - Customer Utang Balances & Repayment Histories

---

### 🛡️ Safety & Offline-First Guarantees for VPS Cloud Setup

1. **Zero Cashier Downtime (Offline-First Store Invariant):**
   - The cashier checkout counter **NEVER** depends on active internet.
   - If your store's PLDT, Globe, or Wi-Fi connection drops, cashiers continue scanning and checking out with sub-5ms local SQLite speed.
   - All completed sales are queued safely in a local outbox. When the internet connection returns, the Master PC automatically syncs the queued receipts to your VPS without cashier intervention.
2. **End-to-End TLS 1.3 Encryption:**
   - All data traveling over the public internet between your store PC and your VPS is encrypted using bank-grade HTTPS/TLS 1.3 encryption.
3. **Read-Only Owner Safeguard:**
   - The remote web dashboard operates in read-only audit mode by default, preventing accidental cart interruptions or unintended stock adjustments while cashiers are actively ringing up sales.

---

## ❓ Frequently Asked Questions (FAQ)

### Q: Can two cashiers sell the same product at the exact same time in Local LAN mode?
**A:** Yes! Both cashiers can scan and ring up products concurrently. If 5 bottles of cooking oil are in stock, Cashier 1 can sell 2 and Cashier 2 can sell 3. Both checkouts will deduct cleanly, and the remaining stock will immediately show `0` on both screens. If a cashier attempts to sell more than the remaining quantity, the atomic transaction guard prevents the sale and alerts the cashier.

### Q: What happens if the store's Wi-Fi router gets turned off or loses power?
**A:** 
- **On PC 1 (Master):** Checkout continues uninterrupted because the database is stored directly on PC 1.
- **On PC 2 (Satellite):** A yellow notification banner appears: `⚠️ Reconnecting to Master Server...`. The cashier can wait for the router to restart, or ring up sales directly on PC 1 until the network connection is restored.

### Q: Does the store need internet for the Multi-Computer LAN setup?
**A:** **No.** The local Multi-Computer setup operates 100% offline. You only need a standard home/office router or an inexpensive unmanaged network switch to link the computers together via Wi-Fi or Ethernet cables.

### Q: Who pays for the VPS server?
**A:** The store owner rents the VPS directly from their preferred cloud provider (DigitalOcean, Linode, AWS, Hetzner, etc.). TINDA POS does not charge any recurring monthly software subscriptions or licensing fees.
