# TINDA POS v1.0.17 User Manual

**TINDA POS v1.0.17** - Gabay para sa may-ari at cashier.

Ang guide na ito ay para sa release (v1.0.17), na may naiki-click at maaasahang
"Start TINDA POS when I sign in to Windows" setting sa Settings > Store, awtomatikong
pagbukas sa Windows boot/power-on (Setup), pinatibay na kalkulasyon ng Estimated Profit,
at maayos na payment breakdown sa resibo.

Gamitin ang guide na ito sa unang setup, araw-araw na pagbebenta, pagsasara ng
shift, at pag-update. Ang mga naka-bold na pangalan ay buttons o menu sa app.

## Mabilis na gabay sa araw-araw

### Pagpili ng nangutang

1. Sa POS, sa **Select the borrower**, pindutin ang **Select Customer**.
2. Hanapin ang pangalan o phone number. I-click ang customer sa listahan para ma-select.
3. Tingnan ang **Selected: pangalan** at checkmark sa cart. Para magpalit, buksan
   ulit ang parehong listahan; may highlight at checkmark ang kasalukuyang napili.
4. Sa Checkout, piliin ang **Utang** at suriin muli ang pangalan bago **Charge**.
5. Kapag may **Please select the customer for this Utang before checkout.**,
   i-Cancel ang Checkout, pumili ng customer sa cart, saka mag-Checkout ulit.
   Hindi pa na-charge ang sale.

Gamitin ang **Walk-in (no utang)** para alisin ang napiling customer. Ang bagong
sale ay hindi awtomatikong gagamit ng nangutang sa naunang sale. Hindi nagbago
ang credit limit: kapag kulang ito, sundin ang kasalukuyang approval process.

### Awtomatikong pagbukas sa Windows

Sa installed Windows Setup, awtomatikong naka-ON ang pagbukas kasabay ng
Windows sign-in para mas madaling makapagsimula ang tindahan. Sa
**Settings > Store**, makikita na naka-check ang **Start TINDA POS when I sign
in to Windows**. Alisin ang check para i-OFF kung ayaw mo; hindi ito muling
naka-ON para sa mga action mo. Hindi ito available sa Portable edition at hindi
ito pagbukas bago mag-sign in sa Windows.

### Araw-araw na checklist

1. **Bago magbenta:** mag-login sa tamang account, tingnan ang petsa ng computer,
   at tiyaking tama ang starting cash at stock.
2. **Habang nagbebenta:** sa POS, suriin ang item, quantity, total, at payment bago Checkout.
3. **Kapag may ibinalik:** buksan ang original sale sa Transactions at gamitin ang Refund.
4. **Bago magsara:** Cash Count, Save Cash Count, saka Z-Read. Huwag baligtarin.
5. **Pagkatapos ng trabaho:** gumawa ng backup at magtabi ng kopya sa ibang drive.

## Hanapin ang kailangan mo

- [Unang setup](#quick-start-and-first-time-setup)
- [Dashboard](#login-and-dashboard)
- [Pagbebenta at bayad](#pos-and-checkout)
- [Products at categories](#products-sku-barcode-and-categories)
- [Expiration dates](#expiration-per-item-o-per-batch)
- [Cash Count](#cash-count)
- [Z-Read](#z-read-and-z-read-history)
- [Printer setup](#receipt-printer-setup)
- [Backup and Restore](#backup-and-restore)
- [Software Update](#software-update)

Ang guide ay para sa Windows desktop release. Hindi kailangan ng internet para
sa normal na pagbebenta. Panatilihing tama ang petsa at oras ng computer.

### Dashboard at mga resibo sa v1.0.11

Ang **Today's Net Sales** ay benta pagkatapos ibawas ang refund. Halimbawa,
PHP 500 na benta at PHP 100 na refund = PHP 400 na net sales. Kapag na-refund
ang buong benta, magiging zero ang net sales para sa bentang iyon.

Kusang nagre-refresh ang dashboard pagkatapos ng sale, refund, o void.
Nagre-refresh din kapag bumalik ka sa window at bawat 15 segundo bilang fallback.
Kabuuan ito ng araw ayon sa petsa ng computer, kaya hindi ito bumabalik sa zero
sa bawat Z-Read. Mananatili ang transaction history.

Mas malinaw na ang resibo, X-Read, Z-Read, at Cash Count sa 58mm at 80mm paper.
Ang X-Read ay kasalukuyang shift na hindi pa final. Ang Z-Read ay final report
na may actual cash, sobra/kulang, at oras ng pagsara. Sa Cash Count, naka-align
ang bilang ng bills/coins at mga halaga para madaling suriin.

## Bago magsara: Cash Count muna, saka Z-Read

### Mas madaling basahin ang POS

Mas malaki na ang pangalan at presyo ng produkto, quantity sa cart, at total.
Gamitin ang **+** at **-** sa cart para baguhin ang dami, o pindutin ang quantity
para mag-type. Nasa ibaba ng cart ang mas malapad na **CHECKOUT** button.
Kapag pumili ng category na kaunti lang ang produkto, mananatiling pareho
ang taas ng product boxes; hindi na nito pupunuin ang buong screen.

### Tamang pagkakasunod sa pagtatapos ng shift

1. Gamit ang account na may bukas na shift, pumunta sa **Reports → Cash Count**.
2. Bilangin ang pera sa kaha. Ilagay ang dami ng bawat bill at coin.
3. Pindutin ang **Save Cash Count**. Hintayin ang mensaheng **Cash Count saved**.
4. Pumunta sa **Reports → Z-Read**, suriin ang halaga, saka pindutin ang **Finalize Z-Read**.

Kung wala pang naka-save na Cash Count sa shift na iyon, may lalabas na paalala:
**Wala pang naka-save na Cash Count para sa shift na ito. I-save muna ang Cash Count bago mag-Z-Read at isara ang shift.**

- **Pumunta sa Cash Count**: bumalik sa pagbibilang at mag-save muna. Bukas pa rin ang shift.
- Hindi maaaring magpatuloy sa Z-Read hangga't walang naka-save na Cash Count para sa kasalukuyang shift.
- **X** o **Escape**: isara ang paalala. Hindi nito isinasara ang shift.

Kung may naka-save nang Cash Count para sa kasalukuyang shift, hindi na lalabas ang paalala.
Ang **No open shift** ay nangangahulugang walang bukas na shift sa account na ginagamit.
Hindi na maaaring mag-save ng Cash Count para sa shift na naisara na. Kaya **Cash Count muna, saka Z-Read**.

Sa Z-Read, ang **Cash** ay perang dapat naiwan sa drawer pagkatapos ibalik ang sukli.
Ang **Expected Cash** ay kasama ang starting cash, cash sales, Cash In, Cash Out,
refunds, at expenses. Ang GCash, Maya, at Utang ay hiwalay sa cash drawer.

TINDA POS is an offline POS system for sari-sari stores. The core POS, inventory, customer, utang, expense, and reporting workflows remain usable offline.

This friendly guide is for sari-sari store owners, managers, and cashiers. TINDA POS works offline for everyday selling, inventory, utang, expenses, and reports.

> Guide version: TINDA POS v1.0.17. Installed v1.0.3–v1.0.5 require a one-time manual Setup upgrade to the approved stable release.

## Quick start and first-time setup

**WHERE TO GO:** Open TINDA POS → First-time Setup.

1. Enter the store name and optional address, owner, phone, and TIN.
2. Create the Admin username, password, and PIN. Isulat ito sa ligtas na lugar.
3. Choose basic receipt settings, then finish setup and log in.
4. Open **Inventory → New Product** to add your first item.

Roles are simple: **Admin** controls users, settings, data, and all workflows; **Manager** manages store operations and may finalize Z-Reads; **Cashier** sells, handles their shift, and sees permitted reports. Never share an Admin password with every cashier.

## Login and Dashboard

Mag-login gamit ang username/password o assigned PIN. Suriin ang pangalan ng
cashier bago magsimula. Makikita sa Dashboard ang Today's Net Sales, transactions,
estimated profit, expenses, outstanding utang, recent sales, at low/out-of-stock items.

**Paano basahin ang Today's Net Sales:**

- PHP 500 sales, walang refund: PHP 500 net sales.
- PHP 500 sales, PHP 100 refund: PHP 400 net sales.
- PHP 500 sales, buong PHP 500 na-refund: PHP 0 net sales.

Kusang nagre-refresh pagkatapos ng sale, refund, o void. Nagre-refresh din kapag
bumalik sa app window at bawat 15 segundo bilang fallback. Ang daily figure ay
para sa petsa ng original sales; gamitin ang original transaction at shift reports
kapag sinusuri ang refund ng benta mula sa ibang araw.

**Hindi reset button ang Z-Read.** Daily total ang dashboard, kaya magpapatuloy
ang total kapag may panibagong shift sa parehong araw. Naka-save pa rin ang lahat
ng transaction at historical report.

## Products, SKU, barcode, and categories

**WHERE TO GO:** Inventory → New Product.

Enter a product name, optional unique SKU/barcode, category, base unit, cost, selling price, low-stock level, and opening stock. Click **Save**. The **Low Stock Alert** field is pre-filled from the store's **Default Low Stock Alert** setting (Settings → Store); change it for this product or leave it to inherit the store default. Use the pencil button to edit a product. SKU is your own product code; barcode is the code scanned at POS. Duplicate SKU or barcode values are rejected. Use **Inventory → Categories** to add or organize categories.

### Add Product and the empty Inventory workflow

A new store starts with an empty Inventory. The **Add Product** flow is the fastest way to create the first item. If you need speed or bulk lists, use **CSV Product Import** (see its own section). An empty Inventory does not block checkouts, X-Read, or reports — the Dashboard simply shows zero products until you add some. Opening stock is saved with an inventory-history entry. Editing ordinary details does not silently rewrite stock.

### Edit Product (multi-unit editor)

**WHERE TO GO:** Inventory → open a product card → pencil → Edit Product.

The Edit Product modal is a full multi-unit editor with a **Selling Units (Tingi / Multi-unit)** area. In v1.0.7:

- **"Unit name required" issue fixed** — editing a product no longer falsely demands a selling-unit name. Saving a product keep its existing selling units intact without unexpected prompts.
- **Selling units are preserved** — units you added earlier (for example `can`, `sachet`, `box`) stay exactly as saved when you edit any other product detail, add a new unit, or remove a unit.
- **Add a selling unit** — enter a unit name, the conversion to the base unit, and an optional per-unit barcode, then add it. The product card and POS immediately use the new unit at its conversion.
- **Remove a selling unit** — delete an unwanted unit; the rest of the unit list and the product itself are unaffected.
- **Friendly validation** — if you leave the unit name blank and save, TINDA POS shows a friendly message: **"Please enter a name for the selling unit."** The product is not lost, nothing is corrupted, and you can correct the name and save again.

Each product keeps one base unit plus any number of selling units; stock is always protected and recorded in whole base units.

## Restock (Paano mag restock?)

**WHERE TO GO:** Inventory → **Restock**, or click the Restock button on a product card.

**WHAT TO ENTER:**

1. Piliin ang product.
2. Enter **Quantity to Add**.
3. Choose the unit, such as sachet or box.
4. Optionally choose supplier and enter cost, reference, and notes.
5. Check the conversion and **New Stock** preview.
6. Click **Save Restock**.

**EXAMPLE:** Current Stock: 24 sachets. Restock: 2 boxes. If 1 box = 24 sachets, the preview shows `2 × 24 = 48 sachets`; New Stock: 72 sachets.

Quantity must be greater than zero and cost cannot be negative. Restock creates a PURCHASE/receiving movement with user and timestamp; it never silently overwrites stock.

## Stock Receiving (Ano ang mga stock na dumating?)

**WHERE TO GO:** Inventory → **Stock Receiving**.

Kung gusto ninyong makita kung anong stocks ang dumating ngayong araw, pumunta sa **Inventory → Stock Receiving**. Makikita rito ang received product, quantity at unit, previous/new stock, supplier, date/time, cost, reference, notes, source, at kung sino ang nag-receive.

Gamitin ang Search Product, Date From/To, Supplier, at Source filters para mabilis makita ang kailangan. Click ang row para sa complete read-only details. Ang Restock at legitimate Purchase Receiving ay automatic na lalabas agad—hindi kailangan ng manual Refresh. Ang CSV opening stock ay malinaw na naka-label bilang opening/import stock, at hindi delivery. Damage, loss, sale, at ibang negative movements ay hindi ipinapakitang received stock.

## Stock adjustment and low stock

Use the authorized **Adjust Stock** workflow (also called inventory adjustment/count) for damage, loss, expiration, return, or a physical-count correction. Enter the real reason. Adjust Stock never silently overwrites quantity — it creates an AUDIT-visible stock history entry with the reason, user, timestamp, and previous/new stock. Low Stock means the quantity reached its configured alert; Out of Stock means zero. Restock is for deliveries, while Adjustment is for corrections.

### Low Stock Alert default (v1.0.8)

The store-wide default lives in **Settings → Store → Default Low Stock Alert**. It is the single source of truth for new products:

- **New Product** pre-fills the product's Low Stock Alert from the store default, so you can save it as-is: the product quietly inherits the store default.
- Products imported by **CSV** with the low-stock column left empty inherit the store default automatically — they are never saddled with a hard-coded value.
- Updating a product via CSV never overwrites an existing threshold when the column is left empty.
- A product with its own threshold keeps using that product-specific value.

## Withdraw Stock (withdrawal / transfer)

**WHERE TO GO:** Inventory → **Withdraw**.

Use **Withdraw** to remove stock for Taken (e.g. for use/transfer out), Damaged, Expired, or Forward reasons — any stock that must leave the shelf without being sold. Select the product, enter the quantity and unit, choose the reason (**Taken / Damaged / Expired / Forward**), and add an optional note. Confirm the **New Stock** preview; you cannot withdraw more than the current stock.

A withdrawal is an inventory movement only: it changes stock, records Stock History, and never creates a sale, never changes payment/sales totals, and never affects X-Read, Z-Read, or Cash Count money totals. Withdrawals show in **Stock History** under the Withdrawal type.

## Stock History

**WHERE TO GO:** Inventory → product card → Stock History.

Every stock movement is recorded and visible per product: opening/import, Restock (purchase/receiving), Adjust Stock, Withdrawal, sale, refund, and expense-related movement. Each history entry shows the previous stock, new stock, unit, quantity change, user, date/time, and reference/notes. Use Stock History to confirm why a quantity changed and who changed it. Like Restock and Stock Receiving, history appears immediately — no manual refresh needed.

## CSV Product Import

**WHERE TO GO:** Inventory → **Import CSV**.

1. Click **Download Template**.
2. Fill in `product_name` and `selling_price`. SKU, barcode, category, cost, stock, low-stock level, supplier, and base unit are optional. A blank low-stock level imports with the store's **Default Low Stock Alert** (Settings → Store); updating an existing product with a blank low-stock level never overwrites its current threshold.
3. Save as CSV and click **Select CSV**.
4. Review Total, Valid, Invalid, and Duplicate counts.
5. Fix every invalid row using the exact row number/reason shown.
6. For existing SKU/barcode values, choose **Skip Existing** or **Update Existing**.
7. Click **Import Products**.

Nothing is saved during Preview. The final import is all-or-nothing: if a fatal database error occurs, all changes roll back. Opening stock creates inventory history. Successful imports appear automatically in Inventory and POS.

## Tingi and multi-unit products

The base unit is the smallest stock unit, such as sachet, piece, or bottle. A larger selling/restock unit uses the existing conversion—for example, 1 box = 24 sachets. Stock is always protected and recorded in whole base units.

## Sales chart

Sa **Reports > Sales**, piliin ang From/To at Daily, Weekly, o Monthly, saka
pindutin ang **Run**. Makikita sa **Sales by Period** ang sales amount sa bawat
period. Itapat ang mouse sa bar para makita ang eksaktong halaga. Automatic
ang pagitan ng date labels para hindi magsapawan sa maliit na screen.
Chart display lang ito; hindi nito binabago ang transactions o report totals.

## X-Read

**WHERE TO GO:** Reports → X-Read.

X-Read shows the current open shift: sales, discounts, refunds, voids, net sales, Cash/GCash/Maya/Utang, split payments, expenses, expected cash, and transaction count. The header shows **Shift #&lt;number&gt;** — each cashier's shifts are numbered sequentially (Shift #1, #2, #3, …). Click **Print X-Read** for a paper copy. X-Read is read-only: it does not close the shift, reset totals, change stock, or finalize anything. You may generate it many times.

## Z-Read and Z-Read History

**WHERE TO GO:** Reports → Z-Read.

1. Review the final summary.
2. Enter actual cash for reconciliation.
3. Save **Reports → Cash Count** first, while the shift is still open. **Finalize Z-Read** is blocked until this shift has a saved Cash Count. **Pumunta sa Cash Count** returns to the tally without closing the shift. Closing the reminder leaves the shift open.
4. Confirm only when the reporting period is finished.

Z-Read closes/finalizes that shift and saves an immutable snapshot. It never deletes transactions, payments, expenses, inventory history, or customer ledger entries. The same shift cannot be finalized twice. Only Admin/Manager may finalize.

Open **Reports → Z-Read History** to inspect and print an old saved snapshot. Old Z-Reads do not change when later database activity occurs.

## Realtime stock

After a successful sale, refund, void, restock, adjustment, CSV import, or purchase receiving, Inventory, POS, and Dashboard stock views refresh automatically. Hindi kailangang paulit-ulit pindutin ang Refresh. TINDA POS uses committed events, not aggressive internet polling; a failed/rolled-back transaction sends no success event.

### Realtime cart stock sa POS

Kapag nag-add ng product sa cart, bababa agad ang **Available Stock** sa POS. Kapag binawasan, tinanggal, o ni-clear ang item sa cart, babalik agad ang available quantity.

Ang permanenteng stock deduction ay mangyayari lamang pagkatapos ng successful checkout. Walang database stock movement habang nag-aayos pa lamang ng cart, kaya walang double deduction at walang nawawalang stock kapag kinansela o nag-fail ang checkout.

Hindi puwedeng lumampas ang cart sa current database stock. Kung nagbago ang stock habang may item sa cart o habang naka-Hold ang sale, magpapakita ang POS ng stock warning at iba-block ang checkout hanggang ma-adjust ang quantity. Ang multi-unit products ay gumagamit ng existing base-unit conversion; halimbawa, ang 1 box na 24 sachets ay nagre-reserve ng 24 base units.

## Suppliers, purchases, receiving, and expenses

Use **Suppliers** to maintain supplier contact details and review linked products/purchases. Purchase receiving adds stock using the same inventory movement history. Record operating expenses under **Expenses**, choosing the category, amount, date, description/reference, and notes. These expenses are included in shift reports.

## Refund, Void, Shifts, and cash reconciliation

Open **Transactions**, select the saved sale, and choose Refund for returned quantities or Void for an eligible mistaken sale. A reason is required. Stock and related utang records are reversed through their histories. Never create a fake negative sale.

Open a shift with starting cash before selling. At closing/Z-Read, compare expected cash with actual drawer cash and record a useful note for any difference. Cash-in and cash-out movements belong to the open shift. Each cashier's shifts are numbered sequentially (**Shift #1, Shift #2, …**) in open order and that number is printed on X-Read, Z-Read, and Cash Count records, so it is easy to point to "shift number three" when reconciling the day.

## Users, roles, audit logs, and Settings

Admin can manage users under **Settings → Users**. Give each person only the role needed. Authorized Admin users can review audit logs where exposed by the application. Under Settings, configure store details, receipt/printer, data modes, users, and About/software updates.

## Common Questions / Madalas Itanong

**Q: Paano mag restock?**

A: Inventory → Restock, choose product/unit, enter the delivered quantity, verify New Stock, then Save Restock.

**Q: Paano tanggalin ang “TINDA POS” sa receipt?**

A: Settings → Receipt → turn OFF **Show TINDA POS App Name**. Leave Receipt Title blank for no heading, or enter your store title.

**Q: Paano mag-import ng CSV products?**

A: Inventory → Import CSV → Download Template → fill it in → Select CSV → fix invalid rows → choose duplicate handling → Import.

**Q: Ano ang X-Read?**

A: Current shift report only. It does not finalize or change data.

**Q: Ano ang Z-Read?**

A: Final, saved snapshot of the shift/reporting period.

**Q: Mawawala ba ang transactions pagkatapos ng Z-Read?**

A: Hindi. Transactions and all histories remain saved.

**Q: Kailangan ba i-refresh ang inventory pagkatapos ng sale/restock?**

A: Hindi normally; relevant screens update automatically after success.

**Q: Gagana ba offline?**

A: Yes. Core POS functions use the local database. Internet is needed only for update checking or third-party folder syncing.

**Q: Saan naka-save ang database?**

A: Settings → Data shows the exact active database. Shared Windows mode normally uses `%APPDATA%\TINDA POS\database\tindapos.db`; Portable Data Mode uses `TindaPOS-Data` beside the Portable app.

**Q: Paano gumawa ng backup?**

A: Settings → Data → Backup Now. Keep another copy on a separate drive or synced folder.

## Software Update overview

- **In-app Software Update** — check for updates, see What's New, download, and update directly from Settings → About → Software Update, without visiting a website.
- **Automatic update check** — on startup, TINDA POS quietly checks the official GitHub release page (at most once per day). If an update is available, a non-intrusive notification appears.
- **What's New** — released updates show their change notes as plain text inside the update prompt. Nothing from the internet is ever executed.
- **One-click Restart & Install** — installed (Setup) builds download the update and offer **Restart & Install**; the app never restarts on its own.
- **Portable-friendly updates** — the Portable edition never overwrites itself. It downloads the new Portable EXE into the `Downloads\TINDA-POS-Updates` folder, and you run the new version from there.
- **Safety first** — before an update installs, TINDA POS creates and validates a safety backup of your store database. Updates are held if that backup cannot be made, and you are never interrupted in the middle of a checkout, refund, backup, restore, or store reset.
- **Stable-only updates** — only released stable versions are offered; drafts, prereleases, and invalid versions are ignored.
- **Offline-friendly** — with no internet, checks fail quietly and TINDA POS keeps working fully offline.

## Install and first setup

1. Download the latest stable **TINDA POS** package (see the Download section at the end of this guide).
2. Complete the first-run wizard: store details, administrator account, and receipt settings.
3. Log in, then add products from **Inventory**.

Windows may show SmartScreen because the release is not code-signed. Choose **More info → Run anyway** only after verifying the published SHA-256 values.

## POS and Checkout

1. Open **POS** and find a product by name, SKU, barcode, or category.
2. Add products and adjust quantities or discounts.
3. Select **Checkout**, choose a payment method, and confirm the sale.

### Cash and Sukli

Enter the cash received in pesos — type `50` for ₱50, `100` for ₱100 (never raw centavos). TINDA POS calculates and displays the sukli automatically.

### GCash and Maya recording

GCash and Maya are recording methods, not direct payment-provider API integrations. Enter the payment reference so the method, amount, and reference are stored with the transaction.

### Utang

Select an existing customer for an Utang sale. The amount is added to the customer ledger, subject to the configured credit limit.

### Split Payment

Use multiple payment rows to divide one checkout between supported methods. The recorded payment total must cover the sale total.

Inventory changes only after successful checkout or another completed inventory transaction.

## Hold Sale and Held Sales

1. Add items and any discount, then choose **Hold**. TINDA POS assigns a reference and clears the working cart.
2. Select **Held** to see the current cashier's held sales.
3. Choose **Resume** to resume a held sale. Confirm before replacing a non-empty cart.
4. Choose **Delete** and confirm to delete a held sale the customer no longer needs.

Held sales survive app restart. Holding, resuming, or deleting a held sale does not deduct stock; stock is deducted only after successful checkout. Each cashier can see and manage only their own held sales.

## Expiration: Per Item o Per Batch

### Piliin ang tracking para sa produkto

Sa **Inventory**, pindutin ang **New Product** o pencil ng existing product.
Sa **Expiration Tracking**, pumili:

- **None:** walang expiration tracking. Ito ang default ng existing products pagkatapos ng update.
- **Per Item:** iisang expiration date para sa lahat ng stock ng produktong iyon.
- **Per Batch:** magkakahiwalay na expiration date at quantity sa bawat delivery.

Sa **Per Item**, ilagay ang **Expiration Date**, saka **Save**. Kung magkaiba ang
expiry ng mga delivery, piliin ang Per Batch bago maglagay ng stock. Huwag
palitan ang petsa para lang maibenta ang expired na produkto.

Kung may stock na at ngayon lang ie-enable ang **Per Batch**, ilagay muna ang
expiration ng existing stock. Kung halo-halo ang petsa, huwag hulaan o ituring
na pare-pareho: suriin ang physical stock bago mag-enable. Kapag may tracked
stock pa, hindi puwedeng magpalit ng mode; kailangan munang maubos o ma-withdraw
nang tama ang stock upang hindi mawala ang batch records.

### Kapag may bagong delivery

1. Pumunta sa **Inventory > Restock** at piliin ang produkto.
2. Ilagay ang quantity at tamang unit. Halimbawa, 2 boxes na may 24 pieces bawat box = 48 pieces.
3. Sa batch-tracked item, ilagay ang **Batch expiration**. Optional ang **Batch label**, tulad ng delivery reference.
4. Suriin ang **New Stock**, saka **Save Restock**.

May sariling batch number ang bawat delivery, kahit pareho ang expiry.
Sa Per Item, ang bagong stock ay sakop ng expiration date na nasa product.
Hindi ini-import ang batch dates mula sa CSV; gamitin ang Restock para sa
bagong batch at Withdraw para sa batch-specific na bawas.

### Mga kulay at paalala

- **Pula / Expired:** lumampas na sa expiration date. Blocked sa POS ang apektadong stock.
- **Orange / Expiring within 7 days:** kasama ang mismong expiration day.
- **Yellow / Expiring within 30 days:** 8 hanggang 30 araw na lang.
- **Date review required:** walang verified date. Blocked muna sa POS ang undated batch.

Ang petsa ay ayon sa local date ng computer. Sa kasalukuyang rule, puwedeng
ibenta hanggang sa expiration date; magiging expired sa susunod na araw.
Sundin pa rin ang label at aktuwal na kondisyon ng produkto.

May Tagalog reminder sa pag-login kapag may kailangang tingnan. Pindutin ang
**Tingnan ang Items**, o buksan ang **Expiration Dates** sa itaas ng app.
Makikita ang product, batch, expiry, at quantity. Puwedeng mag-search o
mag-filter ng expired, near-expiry, undated, o lahat ng tracked stock.
Automatic ang refresh pagkatapos ng stock changes, sa pagbalik sa app window,
at bawat 15 segundo bilang fallback.

### Pagbebenta, returns, at expired stock

Unang ibinabawas ng system ang valid batch na pinakamalapit ma-expire.
**Iyon din ang dapat kunin sa shelf.** Ang expired na batch ay hindi kasama sa
sellable quantity, pero puwede pa rin ang valid na batch ng parehong produkto.

Sa Refund o Void, ibinabalik ang quantity sa original batch at nananatili ang
expiry nito. Kung luma ang sale at walang batch record, mapupunta ang return sa
**Date review required**. Suriin muna ang item; ang manager/admin ay maaaring
gumamit ng pencil sa Expiration Dates para ilagay o itama ang verified date.
Naka-record sa audit log ang date correction.

Hindi kusang nawawala sa inventory ang expired stock. Para alisin:

1. **Inventory > Withdraw**, piliin ang produkto.
2. Kung Per Batch, piliin ang tamang **Batch**, gamit ang batch number/date/quantity.
3. Ilagay ang quantity, piliin ang reason na **Expired**, saka **Save Withdrawal**.

Nananatili ang stock history. Huwag gumawa ng pekeng sale para lang ibawas ang expired stock.

### Manual na category

Sa New/Edit Product, pindutin ang **Add Category**, ilagay ang pangalan, at
pindutin ang check icon. Awtomatikong mapipili ang category sa product form.
Kung mayroon nang kaparehong pangalan, gagamitin ang existing category.
Puwede pa rin ang **Inventory > Categories** para sa hiwalay na category list.

## Inventory and Tingi Units

Inventory supports products, categories, suppliers, SKU/barcode values, low-stock alerts, and stock adjustments. A product can have multiple selling units for tingi handling, such as a stick, piece, sachet, pack, tray, or other conversion to its base unit. Adding and editing products is covered in the **Products** section above; keeping stock accurate is covered by **Stock History**, **Withdraw Stock**, **Adjust Stock**, and realtime POS stock (below).

## Customers and Utang

Create customers, configure credit limits, review the full utang ledger, and record payments or authorized adjustments. Refund and void workflows reconcile the related stock and credit records.

## Settings → Data

Open **Settings → Data** to see where the database and backups live and to access Data Mode, Start New Store, Backup, Restore, and Reset Database.

### Shared AppData (default)

The default database location on Windows is:

```text
%APPDATA%\TINDA POS\database\tindapos.db
```

The Installer and Portable editions intentionally share the same AppData database. Moving or renaming the EXE does not create a fresh database; the app simply keeps using the same `%APPDATA%\TINDA POS` data profile. **Moving the Setup or Portable EXE to another folder or drive does NOT automatically move or reset the database.** Installing an update should continue using the existing data profile; do not manually delete the AppData database to update the application.

### Portable Data Mode

To keep a separate database beside the Portable EXE, open **Settings → Data → Use Portable Data**:

- **Start Fresh** — create a new empty portable store in `TindaPOS-Data\` beside the EXE.
- **Copy Current Store** — copy the current store into the portable data folder so the Portable EXE uses its own copy of your data.
- **Use Shared AppData** — switch the app back to the default `%APPDATA%\TINDA POS` database.

While Portable Data Mode is active, the store lives in the `TindaPOS-Data` folder next to the Portable EXE, so moving that folder moves the data with it.

### Start New Store

**Start New Store** creates a brand-new empty store. Requirements:

- You must be signed in with **Admin/settings permission**.
- Type the exact confirmation **NEW STORE**.
- A verified safety backup of the current database is created first.
- Existing backup files remain preserved.
- A fresh database is created and the app restarts automatically into the first-run setup wizard.

> **Warning:** Do not manually delete `tindapos.db` unless instructed for troubleshooting. Use the built-in Data-management actions instead.

## Reset Database

Reset also creates a fresh active store database, but it is a separately guarded action used for troubleshooting; it is not needed for an ordinary application update, and it is not the same as Start New Store. Reset requires:

- **Admin/settings permission**.
- The exact `RESET` confirmation.
- A safety backup created and verified before the active database is removed.
- Existing backup files remain preserved.
- The app restarts automatically and shows the first-run setup wizard.

1. Sign in with an account that has ADMIN/settings permission.
2. Open **Settings → Data → Reset Database**.
3. Read the warning and type `RESET` exactly.
4. TINDA POS creates and verifies a safety backup before removing the active database.
5. Existing backup files remain preserved.
6. The app restarts automatically and shows the first-run wizard.

If the safety backup fails, Reset Database is cancelled without deleting the active database.

## Backup and Restore

- Use **Backup Now** regularly. Existing backups are stored separately from the active database.
- Restore validates the selected backup's SQLite header, expected TINDA POS tables, and database integrity before replacement (backup validation + integrity check).
- TINDA POS creates and validates a safety backup of the current database before restore.
- Restore uses rollback protection if replacement fails, so the active database is not left half-replaced.
- Temporary `.restore-*` sidecar files are cleaned up after a successful restore.
- After a successful Restore, TINDA POS restarts automatically (auto-relaunch) and opens the restored data.
- Restoring an older backup intentionally removes active changes made after that backup.
- All existing backups are preserved; a restore never deletes your backup history.

## ONLINE READY and OFFLINE READY

- **ONLINE READY** means a real connectivity check succeeded and configured cloud-sync software can upload mirrored backup copies.
- **OFFLINE READY** means internet verification failed, but the core local POS remains usable offline.
- TINDA POS does not upload directly to a cloud API. Optional backup mirroring targets a folder managed by OneDrive, Google Drive for desktop, or Dropbox.

## Transactions and Receipt Generation

Transactions lets authorized users view receipt details, generate/reconstruct receipt lines, refund eligible items, or void eligible sales. Windows receipt-printer support is implemented, including printer discovery, Test Print, Auto Print, and manual Print Receipt. Native Windows/thermal-printer validation is still pending for physical printer hardware; native Windows application and packaging QA passed, and no printer model is claimed certified.

## Receipt Printer Setup

Windows receipt-printer support is built through the Windows printer subsystem using the exact device name Windows reports (Electron printer discovery). No vendor-specific driver logic is used, so any Windows-installed thermal receipt printer works.

Settings → **Receipt / Printer** provides these options:

- **Printer** — the saved receipt printer (selected from the detected list).
- **Refresh Printers** — re-discover installed printers.
- **Auto Print After Sale** — print automatically after each completed sale.
- **Paper Width** — 80mm (default) or 58mm.
- **Copies** — 1 to 3 copies per print job.
- **Test Print** — prints a test slip without creating a sale.
- **Custom Receipt Header / Custom Receipt Footer** — store-specific text printed at the top and bottom.

### Recommended printer

- **80mm USB Thermal Receipt Printer**.
- Windows-compatible printer driver installed.
- ESC/POS-compatible preferred.
- Auto-cutter recommended.
- No specific printer model is claimed certified until it is physically validated; 58mm printers are also supported.

### Printer Setup Guide (step by step)

1. Connect the receipt printer to the Windows PC.
2. Install the printer manufacturer's Windows driver.
3. Confirm the printer appears in **Windows Settings → Printers**.
4. Open TINDA POS.
5. Go to **Settings → Receipt / Printer**.
6. Click **Refresh Printers**.
7. Select your printer from the list.
8. Select the paper width:
   - **80mm** (recommended), or
   - **58mm**.
9. Set **Copies** (1–3).
10. Click **Save**.
11. Run **Test Print** to confirm the printer, width, and layout.
12. Enable **Auto Print After Sale** if you want automatic printing.

The printer **Status** shown in Settings is honest: **Ready** only when the saved printer is actually installed; **Unavailable** when a previously selected printer disappears (the sale still completes — you are prompted to refresh the list or choose again; TINDA POS never silently routes receipts to another printer); **Not configured** when nothing is selected.

Automatic cutting is performed by the printer driver: enable **Auto Cut** in the thermal printer's Windows driver/preferences if the printer does not cut automatically.

## Auto Print After Sale

- **ON:** a receipt is submitted automatically after the sale is successfully saved (one silent print job; no Windows print dialog).
- **OFF:** the sale completes normally, and the receipt can be printed manually later.

**Important:** A printer failure never cancels or rolls back a completed sale. If printing fails:

1. Open the sale in **Transactions**.
2. Use **View Receipt** to see the receipt.
3. Use **Retry Print** after choosing/configuring a printer in Settings → Receipt / Printer.

Retrying to print does **NOT** duplicate the transaction — the same sale is simply printed again.

## Manual Print

Transactions → **Print Receipt** prints an existing sale only. It does not:

- create another sale,
- deduct stock again, or
- recreate a payment.

**View Receipt** is a separate action: it reconstructs and shows the existing sale's receipt on screen (same 80mm/58mm layout that will be printed) without printing.

Receipt printing never happens before a sale is committed, and a printer failure never blocks, rolls back, duplicates, or double-charges a sale. Copies are clamped to 1–3 per job, and each Auto Print job is sent exactly once per completed sale.

## Receipt Format

A printed receipt includes, in order:

- Custom **Header** text
- **Store Name** and store details
- **Transaction number**
- **Date/time**
- **Cashier**
- **Customer**, if the sale is for a customer
- **Items** with:
  - Quantity
  - Unit price
  - Line total
- **Subtotal**
- **Discount**
- **Total**
- **Payment method** and details:
  - Cash received and **SUKLI** (change)
  - GCash/Maya **reference** number
  - Utang/customer info for credit sales
- Custom **Footer** text

## 80mm and 58mm

- **80mm** — recommended. Clearer receipts with a more readable item/price layout (`~72mm` printable width).
- **58mm** — supported for compact printers (`~48mm` printable width).

Long product names wrap automatically instead of being clipped, on both paper widths. The on-screen **View Receipt** preview always matches the printed layout.

## Refund Status

- **COMPLETED** — no refund has been recorded for the sale.
- **PARTIALLY_REFUNDED** — part of the sale has been refunded.
- **REFUNDED** — all refundable quantities have been refunded.

Stock is restored based on the refunded quantities, and any related utang/credit records are reconciled. A partial refund can be continued until the sale reaches **REFUNDED** (the final refund no longer leaves the sale stuck at PARTIALLY_REFUNDED).

## Other workflows

- **Expenses and Shifts:** record expenses and reconcile expected versus actual cash.
- **Reports:** review sales, inventory, and utang, then export CSV.
- **Suppliers:** maintain supplier details and product relationships.

## Cash Count

Use **Reports → Cash Count** to compare the money in the drawer with the cash TINDA POS expects for your open shift. This records a reconciliation only: it never changes a sale, inventory, expense, payment, or closes the shift.

1. Check **Expected Cash**. It uses the same cash calculation as X-Read: starting cash, cash payments only (including only the cash part of split payments), cash refunds, expenses, and cash movements. GCash, Maya, and Utang do not go into drawer cash.
2. Enter the quantity for every bill and coin. Philippine denominations include ₱1,000, ₱500, ₱200, ₱100, ₱50, ₱20 bills; and ₱20, ₱10, ₱5, ₱1, ₱0.25 coins.
3. TINDA POS immediately updates each subtotal, **Actual Cash**, **Difference**, and status.
4. Add an optional note, then choose **Save Cash Count**.
5. View saved records in **Cash Count History**. Each record keeps its date, cashier, expected amount, actual amount, and status.

**Example:** Expected Cash ₱5,000.00; counted bills and coins total ₱4,900.00. Difference is -₱100.00 and the status is **SHORT**. A zero difference is **BALANCED**; a positive difference is **OVER**.

### Save Cash Count

**Save Cash Count** stores the reconciliation as a permanent record in Cash Count History. Saving never changes sales, inventory, expenses, payments, or the open shift, and it does not require a printer.

### Print Preview

**Print Preview** shows exactly the receipt the printer will receive — nothing more, nothing less. It renders the store header, date, business date, shift, cashier, the denomination breakdown (each bill/coin count × value), Expected 500.00 / Actual / Difference, and Status. Use it to check the layout before printing.

### Print Cash Count

**Print** prints the last saved Cash Count using the configured receipt printer. If no receipt printer is configured, TINDA POS still keeps your record safe and shows a friendly message: **"Unable to print Cash Count. The Cash Count was saved successfully. You can try printing it again from Cash Count History."** and **"No receipt printer is configured."** — the saved record is never lost or changed by a failed print.

### Reprint from History

Open **Cash Count History**, select the saved record, and use **Print** (or History Reprint) to print that saved record again at any time. Reprinting reads the authoritative saved record — it shows the amounts that were actually saved when you counted, so a later reprint always matches the original reconciliation.

## Safety and troubleshooting

- Keep regular backup copies on another drive or in a synced folder.
- Do not shut down Windows during Restore or Reset Database.
- Seeing the same store data after moving the Portable EXE is expected because data follows `%APPDATA%\TINDA POS`, not the EXE directory. Use **Settings → Data → Use Portable Data** if you want the database beside the Portable EXE.
- A rejected restore usually means the file is missing, corrupted, or not a compatible TINDA POS SQLite backup.
- If a receipt does not print, check the printer is powered on, installed in Windows, and selected in Settings → Receipt / Printer, then use **Refresh Printers** and **Test Print**.

## Software Update

The Software Update workflow is accessed through Settings → About → **Software Update**.

**Existing v1.0.3–v1.0.5 Setup installations:** detection can work while Download Update fails. A new GitHub release cannot repair the old updater inside your installed app. When the fixed Setup release is approved, first use Backup → Back Up Now, close TINDA POS, and install the new Setup over the existing installation using the same Windows account and data location. Do not uninstall, reset the store, or delete AppData. Reopen and confirm the version, products, sales, and balances.

- **Installed version** — the version you are running is always shown here.
- **Check for Updates** — checks the official GitHub release page now. Use this any time, including after choosing Later; the automatic check runs at most once per day.
- Update states shown include **Checking**, **Up to date**, **Update available**, **Downloading**, **Downloaded**, **Ready to install**, **Offline**, and **Unable to check**.
- When an update is available you will also see a notification in the corner of the screen — it never blocks or interrupts checkout.
- **What's New** — shows the plain-text change notes for the update. TINDA POS never runs or renders remote content.
- **Download Update** — downloads the updates. For installed (Setup) editions, TINDA POS first makes and validates a **safety backup** of your store database. If that backup cannot be created, the update stops and tells you.
- **Restart & Install** — applies the downloaded update by restarting the app. A fresh, validated backup is taken immediately before installation; if it fails, installation stays paused. This only happens when you choose it; closing the app does not silently install the download. Use **Install Later** to keep working if a customer is at the counter.
- During checkout, payment, refund, void, backup, restore, **Start New Store**, or **Reset Database**, the install button is blocked with the message "Please finish the current operation before installing the update."

### Portable edition updates

The Portable EXE cannot replace itself while running:

1. Choose **Download Update** — the new `TindaPOS-Portable-*.exe` is saved to `Downloads\TINDA-POS-Updates`.
2. **Show in folder** — opens the Downloads folder for you.
3. Close the old TINDA POS, then run the downloaded EXE from its own folder.

Your store data is never in the program folder — it stays in your data location (Shared AppData, or `TindaPOS-Data\` beside a portable data folder), so moving to the new version does not touch your data.

### Offline behavior

If TINDA POS cannot reach the internet, the automatic check fails quietly. A manual **Check for Updates** reports "No internet connection. TINDA POS will continue working offline." — the store keeps working normally.

### Manual upgrade para sa lumang versions

Ang versions bago v1.0.3 ay walang in-app update. May updater defects naman ang
installed v1.0.3-v1.0.5. Para sa mga ito: gumawa ng backup, isara ang app, at
i-install ang approved current Setup sa existing installation gamit ang parehong
Windows account. Huwag mag-uninstall, mag-Reset Database, o mag-delete ng AppData.
Pagbukas, i-check ang version, products, sales, utang, at saved reports.

## Download

**TINDA POS v1.0.17** - Official release page: <https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.17>

Files for this release:

- `TindaPOS-Setup-1.0.17.exe` — Windows installer
- `TindaPOS-Portable-1.0.17.exe` — no-install portable edition
- `TindaPOS-User-Guide.pdf` — this guide
- `SHA256SUMS.txt` — checksums for the files above (verify with `sha256sum -c SHA256SUMS.txt`)

The supported target is Windows 10/11 64-bit. Native Windows/thermal-printer validation is still pending for physical printer hardware; native Windows application and packaging QA passed, and no printer model is claimed certified.
