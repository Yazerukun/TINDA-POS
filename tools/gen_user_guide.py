#!/usr/bin/env python3
"""TINDA POS — User Guide PDF generator (reportlab)."""
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    HRFlowable, ListFlowable, ListItem, NextPageTemplate, CondPageBreak
)

EMERALD = HexColor("#059669")
EMERALD_DARK = HexColor("#065f46")
INK = HexColor("#0f172a")
SLATE = HexColor("#475569")
GRAY = HexColor("#64748b")
LIGHT = HexColor("#f8fafc")
LINE = HexColor("#e2e8f0")
WHITE = white

OUT = os.environ.get(
    "TINDA_USER_GUIDE_OUT",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "installers", "TindaPOS-User-Guide.pdf")),
)

ss = getSampleStyleSheet()
ST = {
    "h1": ParagraphStyle("h1", parent=ss["Heading1"], textColor=EMERALD_DARK, fontName="Helvetica-Bold", fontSize=19, spaceAfter=6, spaceBefore=2),
    "h2": ParagraphStyle("h2", parent=ss["Heading2"], textColor=INK, fontName="Helvetica-Bold", fontSize=14.5, spaceBefore=15, spaceAfter=6),
    "h3": ParagraphStyle("h3", parent=ss["Heading3"], textColor=SLATE, fontName="Helvetica-Bold", fontSize=11.5, spaceBefore=11, spaceAfter=4),
    "body": ParagraphStyle("body", parent=ss["BodyText"], textColor=INK, fontName="Helvetica", fontSize=10.3, leading=15.5, spaceAfter=7, alignment=TA_JUSTIFY),
    "callout": ParagraphStyle("callout", parent=ss["BodyText"], backColor=LIGHT, borderColor=EMERALD, borderWidth=0.7, borderPadding=8, leftIndent=6, rightIndent=6, textColor=SLATE, fontSize=9.8, leading=14),
    "step": ParagraphStyle("step", parent=ss["BodyText"], fontSize=10.1, leading=14.5, leftIndent=16, firstLineIndent=-14, spaceBefore=2, spaceAfter=2),
    "title": ParagraphStyle("title", parent=ss["Heading1"], fontSize=30, textColor=WHITE, alignment=TA_CENTER),
    "sub": ParagraphStyle("sub", parent=ss["BodyText"], textColor=EMERALD, fontSize=13, alignment=TA_CENTER),
    "small": ParagraphStyle("small", parent=ss["BodyText"], fontSize=9, textColor=GRAY, alignment=TA_CENTER),
    "toc": ParagraphStyle("toc", parent=ss["BodyText"], fontSize=11, leading=20, textColor=SLATE),
}

def H1(t): return Paragraph(f"<font color='#059669'><b>{num[0]}</b></font> &nbsp; {t}", ST["h1"])
def H2(t): return Paragraph(t, ST["h2"])
def H3(t): return Paragraph(t, ST["h3"])
def P(t, s="body"): return Paragraph(t, ST[s])
def el(): return HRFlowable(width="100%", thickness=1, color=EMERALD, spaceAfter=10)
def step(i, t): return Paragraph(f'<font color="#059669"><b>{i}.</b></font>  {t}', ST["step"])
def bullets(items):
    return ListFlowable([ListItem(Paragraph(i, ST["body"]), leftIndent=14, value="\u2022") for i in items],
                        bulletType="bullet", start="\u2022", leftIndent=8, bulletFontSize=8)

num = [0]
story = []
def sec(title):
    if story:
        story.append(CondPageBreak(1.35 * inch))
    num[0] += 1
    story.append(H1(title))
    story.append(el())

# ============================================================
sec("Installation Guide")
story.append(P(
    "TINDA POS is an offline, desktop point-of-sale application built for Philippine "
    "sari-sari stores. It works without an internet connection, keeps all your data on "
    "your own computer, and supports cash, GCash, Maya, and utang (credit) sales."
))
story.append(H2("System Requirements"))
story.append(bullets([
    "<b>Windows:</b> Windows 10 or 11 (64-bit), 4 GB RAM, about 200 MB free disk space.",
    "<b>Linux:</b> any modern 64-bit distribution (Ubuntu, Arch, Fedora, etc.), 4 GB RAM.",
    "<b>Display:</b> 1366\u00d7768 or higher recommended.",
    "<b>Offline:</b> no internet connection is ever required to run the app.",
]))
story.append(H2("Installing on Windows"))
story.append(P("TINDA POS v1.0.2 will be distributed as a Windows Setup package and a no-install Portable package after final packaging is complete."))
story.append(step("1", "Download the official v1.0.2 Setup or Portable package after it is published on the GitHub release page."))
story.append(step("2", "If Windows SmartScreen warns you, click <b>More info</b> then <b>Run anyway</b>. The app is not code-signed yet, so this notice is expected."))
story.append(step("3", "Choose the <b>Installation directory</b> (the default location is fine)."))
story.append(step("4", "Tick the options to create a <b>Desktop shortcut</b> and a <b>Start Menu</b> shortcut."))
story.append(step("5", "Click <b>Install</b> and wait for it to finish. The app will then offer to <b>Run TINDA POS</b>."))
story.append(P(
    "Your data is saved in <b>%APPDATA%\\TINDA POS</b> (database, backups, receipts). "
    "Uninstalling the app <b>does not delete your data</b>, so you never lose your sales history."
))
story.append(H2("Installing on Linux (AppImage)"))
story.append(step("1", "Right-click <b>TindaPOS-1.0.0.AppImage</b> and choose <b>Properties \u2192 Permissions</b>, then check <b>Allow executing file as program</b>."))
story.append(step("2", "Alternative: open a terminal and run <font face='Courier'>chmod +x TindaPOS-1.0.0.AppImage</font>."))
story.append(step("3", "Double-click the AppImage to launch TINDA POS."))
story.append(step("4", "If FUSE is not installed, install it (e.g. <font face='Courier'>sudo apt install libfuse2</font> on Debian/Ubuntu), or run the app with <font face='Courier'>--appimage-extract-and-run</font>."))
story.append(P("Linux data is stored under <b>~/.config/tinda-pos</b> (or a folder you set)."))

# ============================================================
sec("Quick Start &amp; What's New")
story.append(H2("Start selling in five steps"))
story.append(step("1", "Complete the first-run wizard and keep your admin password and PIN safe."))
story.append(step("2", "Open <b>Inventory</b>, create categories, then add products with their price, cost, unit, and stock."))
story.append(step("3", "Open <b>POS</b>, add products to the cart, choose a payment method, and confirm the sale."))
story.append(step("4", "Add regular customers before allowing <b>Utang</b>, and record every payment in their ledger."))
story.append(step("5", "Open <b>Backup</b> at the end of the day and create a backup."))
story.append(H2("Latest v1.0.2 improvements"))
story.append(bullets([
    "The badge now performs a <b>real internet check</b> instead of trusting the computer's Wi-Fi indicator alone.",
    "<b>ONLINE READY</b> means internet was verified; <b>OFFLINE READY</b> means sales remain available while cloud syncing waits.",
    "Connection changes trigger notifications and are checked automatically about every 15 seconds.",
    "Cloud-folder backup supports OneDrive, Google Drive for desktop, and Dropbox.",
    "Category management, inventory safeguards, customer balances, backups, and accessibility were improved.",
]))
story.append(P("The connection badge only describes internet availability. It never controls checkout, inventory, reports, or other local POS features.", "callout"))

# ============================================================
sec("Getting Started")
story.append(H2("First Run \u2014 Set Up Your Store (wizard)"))
story.append(P("The first time you open TINDA POS, a 3-step setup wizard appears. Fill it in once and you're done for good."))
story.append(H3("Step 1 \u00b7 Store Details"))
story.append(bullets([
    "<b>Store Name *</b> \u2014 the name shown on your receipts (required).",
    "<b>Owner Name</b>, <b>Address</b>, <b>Phone</b> \u2014 printed on your receipts.",
]))
story.append(H3("Step 2 \u00b7 Admin Account"))
story.append(bullets([
    "<b>Manager Full Name</b> \u2014 the owner/manager name.",
    "<b>Username *</b> \u2014 the login username (default: <font face='Courier'>admin</font>).",
    "<b>Password *</b> \u2014 at least 4 characters.",
    "<b>Quick PIN *</b> \u2014 a 4-digit PIN for fast daily logins.",
    "<b>Important:</b> keep these somewhere safe. You need them to log in every day.",
]))
story.append(H3("Step 3 \u00b7 Receipt &amp; Data"))
story.append(bullets([
    "<b>Receipt Header</b> \u2014 an extra line on top of your receipt (e.g. store address).",
    "<b>Receipt Footer</b> \u2014 a closing line (e.g. \u201CSalamat po!\u201D).",
    "<b>Load sample data</b> \u2014 ticks in ~18 common sari-sari items so you can try the POS immediately.",
]))
story.append(P("Click <b>Finish Setup</b> when done. You will be logged in automatically with your new admin account."))
story.append(H2("Logging In"))
story.append(P("Every time you open the app you will be asked to log in. There are two ways:"))
story.append(bullets([
    "<b>Password</b> tab \u2014 enter your Username and Password.",
    "<b>Quick PIN</b> tab \u2014 type your 4-digit PIN for a fast login.",
]))
story.append(P("A <b>shift (time-in)</b> is opened automatically the first time you ring up a sale, so cashiering starts right away."))
story.append(H2("Using the Sidebar"))
story.append(P(
    "The dark sidebar on the left is your main navigation. It lists every section of the app: "
    "Dashboard, POS, Inventory, Customers, Utang, Expenses, Suppliers, Transactions, Reports, Backup, and Settings."
))

# ============================================================
sec("Point of Sale (POS)")
story.append(P("The POS page is where you ring up sales. It is the heart of the app and is designed for speed."))
story.append(H3("Ringing up a sale"))
story.append(step("1", "<b>Find the product</b> \u2014 use the search box with the product name, SKU, or barcode, browse the product grid, or open <b>All categories</b> to show only products from one category."))
story.append(P("The category menu opens when clicked, marks the active choice with a check, and can be reset to <b>All categories</b>. Search and category filters work together.", "callout"))
story.append(step("2", "<b>Add to cart</b> \u2014 click a product to add one unit. Adjust quantity with the +/- buttons in the cart."))
story.append(step("3", "<b>Checkout</b> \u2014 click <b>Checkout</b>; the total is shown automatically."))
story.append(step("4", "<b>Choose payment</b> in the checkout window:"))
story.append(bullets([
    "<b>Cash</b> \u2014 type the amount received; the change (<b>sukli</b>) is computed and shown automatically.",
    "<b>GCash / Maya</b> \u2014 enter the <b>reference number</b> for tracking.",
    "<b>Utang (credit)</b> \u2014 pick a customer so the amount is added to their balance.",
]))
story.append(step("5", "Confirm the sale. The receipt is generated and your inventory and balances are updated automatically."))
story.append(P("Stock and money are tracked for every single sale, so your inventory, utang balances, and daily sales reports stay accurate with no extra work.", "callout"))
story.append(H3("Split Payment"))
story.append(P(
    "Customers can pay with multiple methods in a single sale. For example, pay part in Cash and "
    "the rest via GCash. Just add each payment method in the checkout window and enter the "
    "amount for each. The total must equal the sale amount."
))
story.append(step("1", "In the checkout window, click <b>Add Payment</b>."))
story.append(step("2", "Choose the first method (e.g. Cash) and enter the amount."))
story.append(step("3", "Choose the second method (e.g. GCash) and enter the remaining amount."))
story.append(step("4", "Confirm — both payments are logged on the receipt and in reports."))
story.append(H3("Hold &amp; Resume Sale"))
story.append(P(
    "If a customer needs to step away (e.g. forgot their wallet), you can <b>hold</b> the current cart "
    "and serve the next customer. The held sale is saved without affecting stock."
))
story.append(step("1", "With products in the cart, click <b>Hold</b> beside Clear and Checkout. The cart receives a reference code, is saved to the database, and is cleared for the next customer."))
story.append(step("2", "Serve other customers normally. The <b>Held</b> button at the top of the cart shows how many saved carts are waiting."))
story.append(step("3", "When the customer returns, click <b>Held</b>, find the reference, and click <b>Resume</b>. If another cart is open, TINDA POS asks before replacing it."))
story.append(step("4", "If the customer changes their mind, click <b>Delete</b> and confirm to discard that held sale."))
story.append(P("Held sales persist after restarting TINDA POS and do NOT reduce stock until checkout. For safety, reselect the customer before an Utang checkout after resuming.", "callout"))
story.append(P("The <b>Clear</b> button only empties the current cart. Use <b>Hold</b> instead when you need to restore it later."))
story.append(H3("Safety Protections"))
story.append(bullets([
    "<b>Insufficient stock</b> — you cannot sell more than what is on hand. The app blocks the checkout if quantity exceeds available stock.",
    "<b>Over-refund</b> — you cannot refund more items than were originally sold in a transaction.",
    "<b>Credit limit</b> — utang checkout is blocked if the customer would exceed their credit limit.",
    "<b>Void permission</b> — only managers/admins can void a sale. Cashiers are blocked from voiding.",
]))

# ============================================================
sec("Inventory &amp; Products")
story.append(P(
    "The Inventory page manages your products, categories, prices, and stock. Products can have "
    "<b>tingi</b> (per-piece) units \u2014 for example one sachet of shampoo, one stick of cigarette, or one can of sardines."
))
story.append(H3("Adding a product"))
story.append(step("1", "Click <b>Add Product</b>."))
story.append(step("2", "Fill in the details: <b>Name</b>, <b>Category</b>, <b>Supplier</b>, <b>SKU/Barcode</b>, <b>Sell Price</b>, and <b>Cost</b>."))
story.append(step("3", "Set the <b>unit</b> (sachet, can, piece, bottle, etc.) and initial <b>stock quantity</b>."))
story.append(step("4", "Optionally set a <b>Low-stock alert level</b> so you get warned before you run out."))
story.append(step("5", "Click <b>Save</b>."))
story.append(P("Products are shown with colored badges \u2014 green when healthy, amber when low, red when out of stock \u2014 so you always know what to reorder.", "callout"))
story.append(H3("Managing product categories"))
story.append(step("1", "Open <b>Inventory</b> and click <b>Categories</b>."))
story.append(step("2", "Enter a category name and click <b>Add</b>. Blank and duplicate names are prevented."))
story.append(step("3", "To remove one, click its trash icon. A category still assigned to a product cannot be deleted; move or uncategorize those products first."))

# ============================================================
sec("Customers &amp; Utang (Credit)")
story.append(H2("Customers"))
story.append(P("The Customers page stores your regular (suki) customers. Add a customer before selling to them on utang."))
story.append(bullets([
    "Click <b>Add Customer</b> and enter <b>Full Name</b> and optional <b>Phone/Address</b>.",
    "Each customer can have a <b>credit limit</b> (optional) to control how much utang they can carry.",
]))
story.append(H2("Utang (Credit Ledger)"))
story.append(P("The Utang page shows every customer's outstanding balance and full credit history."))
story.append(H3("Recording a payment"))
story.append(step("1", "Find the customer with the outstanding balance."))
story.append(step("2", "Click <b>Pay</b> (or <b>Adjust</b> to fix an error)."))
story.append(step("3", "Enter the amount paid. The balance is reduced and the payment is logged to their ledger."))
story.append(H3("Correcting a balance"))
story.append(P("Use <b>Adjust</b> when correcting an encoding mistake. Enter a positive amount to add debt or a negative amount to deduct debt. Add a clear reason so the correction can be audited. The balance and ledger refresh immediately."))
story.append(P("Customers who go over their <b>credit limit</b> are flagged, and full history is kept for every sale-on-credit and payment.", "callout"))

# ============================================================
sec("Expenses")
story.append(P(
    "Record your store expenses here (rent, electricity, water, load, etc.). You can group them by category. "
    "Expenses are combined with sales on your Reports so you can see true profit."
))
story.append(step("1", "Click <b>Add Expense</b>."))
story.append(step("2", "Choose a <b>category</b>, enter the <b>amount</b>, date, and optional note."))
story.append(step("3", "Save. The expense is added to your reports."))

# ============================================================
sec("Suppliers &amp; Purchases")
story.append(P(
    "Keep your list of suppliers (where you buy stock). Each supplier shows their past <b>purchases</b> "
    "and the <b>products</b> they supply, so reordering is fast."
))
story.append(bullets([
    "Add a supplier with <b>Name</b>, <b>Contact</b>, and <b>Address</b>.",
    "Click a supplier to see everything you buy from them and the items they provide.",
]))

# ============================================================
sec("Transactions, Refunds &amp; Voids")
story.append(P("The Transactions page lists every sale. You can view a full receipt, refund items, or void a mistaken sale."))
story.append(H3("Refunding a sale (returns)"))
story.append(step("1", "Open the sale in Transactions."))
story.append(step("2", "Click <b>Refund</b> and pick which items the customer returned."))
story.append(step("3", "The items are <b>returned to stock</b> and refunds are tracked on your reports."))
story.append(H3("Voiding a sale"))
story.append(step("1", "Open the sale and click <b>Void</b>."))
story.append(step("2", "Confirm the void. The sale is cancelled, <b>stock is restored</b>, and any utang entry is removed."))
story.append(P("Refunds and voids both put products back on your shelf and correct your totals, so your day-end numbers always reconcile.", "callout"))

# ============================================================
sec("Dashboard &amp; Reports")
story.append(H2("Dashboard"))
story.append(P("The first screen after logging in. It shows today's big picture at a glance:"))
story.append(bullets([
    "<b>Sales</b>, <b>Profit</b>, <b>Utang (receivables)</b>, and <b>Expenses</b> totals.",
    "<b>Low/out-of-stock</b> products that need reordering.",
    "<b>Recent transactions</b> and any <b>overdue/near-limit</b> customers.",
]))
story.append(H2("Reports"))
story.append(P("The Reports page gives you money and stock insight across sales, inventory, and utang."))
story.append(bullets([
    "<b>Sales</b> \u2014 total sales, profit, items, transactions, discounts, refunds, and expenses; grouped daily, weekly, or monthly.",
    "<b>Inventory</b> \u2014 stock levels and low-stock items.",
    "<b>Utang</b> \u2014 customer balances and outstanding receivables.",
    "<b>CSV Export</b> \u2014 download any report as a CSV file you can open in Excel.",
]))

# ============================================================
sec("Backup &amp; Restore")
story.append(P("Your data is the most valuable thing in the app \u2014 back it up regularly."))
story.append(H3("Creating a local backup"))
story.append(step("1", "Open the <b>Backup</b> page."))
story.append(step("2", "Click <b>Back Up Now</b>. A small timestamped SQLite backup file is saved locally."))
story.append(H3("Optional automatic online backup (Windows)"))
story.append(step("1", "Install and sign in to <b>OneDrive</b>, <b>Google Drive for desktop</b>, or <b>Dropbox</b> on the Windows PC."))
story.append(step("2", "On the Backup page, click <b>Choose Folder</b> and select a folder inside that cloud drive."))
story.append(step("3", "Enable <b>synced backups</b>, then choose <b>Daily on app start</b> and/or <b>On app exit</b>. Click <b>Save Backup Settings</b>."))
story.append(step("4", "TINDA POS creates the local backup first, then copies it to the selected synced folder. If internet is offline, the Windows sync client uploads it when the connection returns."))
story.append(P("The uploaded backup can be viewed or downloaded using the matching cloud app on a phone or tablet. Restoring the database is still performed in the Windows TINDA POS app.", "callout"))
story.append(H3("Online / offline status"))
story.append(P("The login screen and sidebar show <b>ONLINE READY</b> only after TINDA POS successfully reaches an internet connectivity service. It shows <b>OFFLINE READY</b> when the check fails. The app checks again after network changes and approximately every 15 seconds."))
story.append(bullets([
    "<b>ONLINE READY:</b> internet is reachable and configured cloud-drive software can upload pending backup copies.",
    "<b>OFFLINE READY:</b> checkout and local records continue normally; cloud upload waits until the connection returns.",
    "A notification appears when the verified state changes. A short delay after turning Wi-Fi on or off is normal.",
]))
story.append(H3("Restoring a backup"))
story.append(step("1", "On the Backup page, choose a previous backup from the list."))
story.append(step("2", "Click <b>Restore</b> and confirm. Your data is restored to that point in time."))
story.append(P("Before replacement, TINDA POS validates the backup, checks SQLite integrity, and creates a safety backup of the current database. A successful restore restarts the app. If replacement fails, rollback protection recovers the original database."))
story.append(H3("Settings → Data and Database Reset"))
story.append(P("Open <b>Settings → Data</b> to view the active database and backup locations, create a backup, restore a backup, or open the protected reset workflow."))
story.append(step("1", "Sign in with an account that has Settings permission (ADMIN by default)."))
story.append(step("2", "Choose <b>Reset Database</b>, read the warning, and type <b>RESET</b> exactly."))
story.append(step("3", "TINDA POS creates and verifies a safety backup before removing the active database, preserves existing backups, and restarts into first-run setup."))
story.append(P("Windows Setup and Portable intentionally share <b>%APPDATA%\\TINDA POS\\database\\tindapos.db</b>. Moving the EXE does not create a fresh database. Never delete the AppData database just to update the application.", "callout"))
story.append(P("Back up at least once a week (or every day if the store is busy). Keep copies off the machine so you're safe even if the computer breaks.", "callout"))

# ============================================================
sec("Shifts")
story.append(P(
    "A <b>shift</b> tracks your cash drawer during a work period. Shifts open automatically when "
    "you ring up your first sale of the day, or you can open one manually."
))
story.append(H3("Opening a shift"))
story.append(step("1", "A shift opens automatically on the first sale after login."))
story.append(step("2", "Or, open one manually from the Shifts section."))
story.append(step("3", "Enter the <b>starting cash</b> (the amount in your drawer before selling)."))
story.append(H3("Closing a shift"))
story.append(step("1", "When done for the day, click <b>Close Shift</b>."))
story.append(step("2", "Enter the <b>actual cash</b> you counted in the drawer."))
story.append(step("3", "The app computes the <b>expected cash</b> (starting cash + cash sales – expenses) and shows the <b>difference</b>."))
story.append(step("4", "A difference of 0 means your cash is exact. Any discrepancy is shown so you can investigate."))
story.append(P(
    "Shifts give you a daily cash reconciliation. If the numbers don't add up, "
    "check your expenses and recent transactions."
))

# ============================================================
sec("Settings")
story.append(P("The Settings page has three tabs:"))
story.append(bullets([
    "<b>Store</b> \u2014 edit store name, owner, address, phone, TIN, currency, and low-stock default level.",
    "<b>Receipt</b> \u2014 customize the receipt header and footer, and receipt format.",
    "<b>Users</b> \u2014 add cashiers/staff, set their role, and reset a password or PIN.",
]))

# ============================================================
sec("Data, Storage &amp; Safety")
story.append(H3("Where is my data? (Offline-first)"))
story.append(P(
    "TINDA POS stores everything in a local SQLite database on your computer. "
    "Internet is not required for sales. Cloud backup is optional and only uses the folder selected by the owner."
))
story.append(bullets([
    "<b>Windows:</b> <font face='Courier'>%APPDATA%\\TINDA POS</font>",
    "<b>Linux:</b> <font face='Courier'>~/.config/tinda-pos</font>",
    "Subfolders: <font face='Courier'>database</font>, <font face='Courier'>backups</font>, <font face='Courier'>receipts</font>, <font face='Courier'>exports</font>, <font face='Courier'>logs</font>.",
]))
story.append(H3("Troubleshooting"))
story.append(bullets([
    "<b>Forgot the admin password?</b> \u2014 Restore a backup made before you changed it, or contact support.",
    "<b>App will not open on Windows?</b> \u2014 Right-click the setup and choose <b>Run as administrator</b>, or check that your antivirus is not blocking it.",
    "<b>SmartScreen warning</b> \u2014 expected since the installer is unsigned; click <b>More info \u2192 Run anyway</b>.",
    "<b>Status still says OFFLINE READY?</b> \u2014 confirm a website opens, wait up to 15 seconds, then restart TINDA POS. A login portal, firewall, DNS problem, or blocked connectivity service can keep the verified status offline.",
    "<b>No connection notification?</b> \u2014 notifications appear only when the verified state changes while the app is open; the badge always shows the detected state.",
    "<b>Linux AppImage won't launch</b> \u2014 install <font face='Courier'>libfuse2</font>, or run <font face='Courier'>--appimage-extract-and-run</font>.",
]))
story.append(H3("Support"))
story.append(P("TINDA POS was created and is maintained by <b>Dev Francis</b>. For questions and feedback, or to report a problem, reach out via the PHCorner thread where you downloaded TINDA POS."))
story.append(P("If TINDA POS helps your store and you would like to buy the developer a coffee, optional donations may be sent through <b>Maya: 0991 225 5156</b>. Donations are never required and do not unlock any features.", "callout"))

# ---- Table of contents ----
story_titles = {
    1: "Installation Guide",
    2: "Quick Start &amp; What's New",
    3: "Getting Started",
    4: "Point of Sale (POS)",
    5: "Inventory &amp; Products",
    6: "Customers &amp; Utang (Credit)",
    7: "Expenses",
    8: "Suppliers &amp; Purchases",
    9: "Transactions, Refunds &amp; Voids",
    10: "Dashboard &amp; Reports",
    11: "Backup &amp; Restore",
    12: "Shifts",
    13: "Settings",
    14: "Data, Storage &amp; Safety",
}
toc = [Paragraph("Contents", ParagraphStyle("toch", parent=ST["h1"], fontSize=18, textColor=EMERALD_DARK, spaceAfter=10))]
for i in range(1, num[0] + 1):
    toc.append(Paragraph(f"<font color='#059669'><b>{i}</b></font> &nbsp; {story_titles[i]}", ST["toc"]))

# ---- document ----
doc = BaseDocTemplate(OUT, pagesize=letter, leftMargin=0.75 * inch, rightMargin=0.75 * inch,
                      topMargin=0.85 * inch, bottomMargin=0.85 * inch,
                      title="TINDA POS User Guide", author="TINDA POS")

def page_footer(canv, _doc):
    canv.saveState()
    canv.setStrokeColor(LINE); canv.setLineWidth(0.6)
    canv.line(0.75 * inch, 0.6 * inch, letter[0] - 0.75 * inch, 0.6 * inch)
    canv.setFont("Helvetica", 8); canv.setFillColor(GRAY)
    canv.drawCentredString(letter[0] / 2, 0.45 * inch, f"TINDA POS User Guide  \u00b7  Page {_doc.page}")
    canv.setFillColor(EMERALD)
    canv.drawRightString(letter[0] - 0.75 * inch, 0.45 * inch, "TINDA POS")
    canv.restoreState()

def cover_bg(canv, _doc):
    canv.saveState()
    canv.setFillColor(EMERALD_DARK); canv.rect(0, 0, letter[0], letter[1], stroke=0, fill=1)
    canv.setFillColor(EMERALD); canv.rect(0, letter[1] - 1.5 * inch, letter[0], 1.5 * inch, stroke=0, fill=1)
    canv.restoreState()

cover_frame = Frame(0, 0, letter[0], letter[1], leftPadding=0.75 * inch, rightPadding=0.75 * inch, topPadding=0.5 * inch, bottomPadding=0.5 * inch, id="cover")
content_frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="content")
doc.addPageTemplates([
    PageTemplate(id="Cover", frames=[cover_frame], onPage=cover_bg),
    PageTemplate(id="Content", frames=[content_frame], onPage=page_footer),
])

out = []
out.append(NextPageTemplate("Content"))
out.append(Spacer(1, 1.7 * inch))
out.append(Paragraph("TINDA POS", ST["title"]))
out.append(Spacer(1, 0.12 * inch))
out.append(Paragraph("Offline Point-of-Sale for Sari-Sari Stores", ParagraphStyle("subw", parent=ST["sub"], textColor=HexColor("#a7f3d0"))))
out.append(Spacer(1, 2.1 * inch))
out.append(Paragraph("User Guide &amp; Installation Manual", ParagraphStyle("csub", parent=ST["sub"], fontSize=16, textColor=WHITE)))
out.append(Spacer(1, 0.08 * inch))
out.append(Paragraph("Windows \u00b7 Version 1.0.2", ST["small"]))
out.append(PageBreak())
out += toc
out.append(PageBreak())
out += story

doc.build(out)
print("WROTE", OUT)
