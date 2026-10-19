# 🏪 TINDA POS (DESKTOP MASTER EDITION)
## 🎓 OPISYAL NA DOKTORAL NA GABAY AT KOMPREHENSIBONG MANUAL SA PAGGAMIT
**Bersyon:** v2.2.9 (Official Stable Release)  
**Wika:** Tagalog (Filipino) — Ganap at Malinaw na Gabay para sa Tagapamahala, Kahera, at May-ari ng Tindahan  
**Arkitektura:** 100% Offline-First Engine · Better-SQLite3 · React 19 · Electron · Tailwind CSS

---

## 📑 TALAAN NG MGA NILALAMAN

1. [Kabanata 1: Pangkalahatang Panimula at Disenyong Offline-First](#kabanata-1-pangkalahatang-panimula-at-disenyong-offline-first)
2. [Kabanata 2: Pag-install at Unang Pag-Setup (First-Run Wizard)](#kabanata-2-pag-install-at-unang-pag-setup-first-run-wizard)
3. [Kabanata 3: POS Cashiering at Mabilisang Pagbenta (F1 - POS)](#kabanata-3-pos-cashiering-at-mabilisang-pagbenta-f1---pos)
4. [Kabanata 4: Pamamahala ng Imbentaryo at Multi-Packaging (F2 - Products)](#kabanata-4-pamamahala-ng-imbentaryo-at-multi-packaging-f2---products)
5. [Kabanata 5: Wholesale Purchases at Pagtanggap ng Delivery](#kabanata-5-wholesale-purchases-at-pagtanggap-ng-delivery)
6. [Kabanata 6: Suki Utang Ledger at Paniningil (F4 - Customers)](#kabanata-6-suki-utang-ledger-at-paniningil-f4---customers)
7. [Kabanata 7: Store Use at Operating Expense Voucher (Bago sa v2.2.9)](#kabanata-7-store-use-at-operating-expense-voucher-bago-sa-v229)
8. [Kabanata 8: E-Wallet Hub at Pang-araw-araw na Cash Drawer Reconciliation](#kabanata-8-e-wallet-hub-at-pang-araw-araw-na-cash-drawer-reconciliation)
9. [Kabanata 9: Hardware, Barcode Labels at Thermal Receipt Printers](#kabanata-9-hardware-barcode-labels-at-thermal-receipt-printers)
10. [Kabanata 10: 1-Tap QR Mobile Pairing at Cloud Owner Dashboard](#kabanata-10-1-tap-qr-mobile-pairing-at-cloud-owner-dashboard)
11. [Kabanata 11: Talaan ng mga Keyboard Shortcuts](#kabanata-11-talaan-ng-mga-keyboard-shortcuts)
12. [Kabanata 12: Pag-iwas sa Error, Pag-backup, at Troubleshooting](#kabanata-12-pag-iwas-sa-error-pag-backup-at-troubleshooting)

---

## KABANATA 1: Pangkalahatang Panimula at Disenyong Offline-First

Ang **TINDA POS Desktop** ay isang propesyonal at makabagong Point-of-Sale system na partikular na binuo para sa mga Sari-Sari Stores, Minimarts, Groceries, Hardware, at Wholesalers sa Pilipinas.

### Pangunahing Katangian (Core Superpowers):
- **100% Offline-First:** Gumagana nang tuluy-tuloy kahit walang koneksyon sa internet o mahina ang signal. Ang lahat ng transaksyon, presyo, customer credit, at imbentaryo ay ligtas na nakaimbak sa lokal na database ng inyong kompyuter gamit ang **Better-SQLite3** na may Write-Ahead Logging (WAL).
- **Walang Buwanang Bayarin (Zero Cloud Lock-in):** Ang inyong datos ay pag-aari ninyo nang buo at hindi nakasalalay sa mamahaling buwanang subscription.
- **Seguridad sa Bawat Sentimo (Integer Centavos Precision):** Walang "floating-point drift" o nawawalang sentimos. Ang bawat kalkulasyon ay mathematically verified hanggang sa kaliit-liitang sentimo (`_c`).
- **Clean Full Setup Engine:** Walang error-prone patches; bawat update ay malinis at awtomatikong may pre-update safety backup.

---

## KABANATA 2: Pag-install at Unang Pag-Setup (First-Run Wizard)

### Hakbang 1: Pag-install
1. I-download ang **`TindaPOS-Setup-2.2.9.exe`** mula sa opisyal na release.
2. I-double click ang installer. Awtomatikong maglalagay ito ng shortcut sa iyong Desktop at Start Menu.
3. Bubukas agad ang programa sa loob ng 2 segundo.

### Hakbang 2: Setup Wizard para sa Bagong Tindahan
Sa unang pagbukas, hihingin ng system ang mga batayang impormasyon:
- **Pangalan ng Tindahan (Store Name):** Hal. *Aling Nena Super Sari-Sari Store*.
- **Pangalan ng May-ari at Numero ng Telepono.**
- **Admin Username, Password, at 4-Digit Security PIN:** 
  > ⚠️ **Paalala:** Huwag kalimutan ang iyong PIN dahil ito ang gagamitin sa pag-apruba ng mga sensitibong gawain tulad ng Refund, Void, at Store Use.
- **Piliin kung nais magkarga ng Demo Products:** Maaaring mag-load ng panimulang listahan ng mga karaniwang paninda sa Pilipinas (soda, noodles, de-lata, bigas, atbp.).

---

## KABANATA 3: POS Cashiering at Mabilisang Pagbenta (F1 - POS)

Ang POS Terminal ang pangunahing screen kung saan nagaganap ang araw-araw na pagbenta.

### 1. Pagdagdag ng Produkto sa Cart
- **Gamit ang Barcode Scanner:** Itutok lamang ang barcode scanner sa produkto. Agad itong papasok sa cart nang may tunog ng kumpirmasyon.
- **Gamit ang Keyboard Search:** Pindutin ang `/` o i-type ang pangalan o SKU ng produkto (hal. `Coke 1.5L`). Pindutin ang `Enter` upang idagdag.
- **Quick Category Grids:** I-click ang mga kategorya sa kaliwang bahagi upang makita ang mga sikat na produkto.

### 2. Pagbabago ng Dami (Quantity) at Unit
- Upang dagdagan ang dami, pindutin ang `+` o `-` sa item row, o i-type ang numero.
- Kung ang produkto ay may multi-packaging (halimbawa: *Piraso*, *Kahon*, o *Balot*), i-click ang Unit dropdown upang magpalit agad ng presyo at awtomatikong ikalkula ang kabuuang bawas sa stock.

### 3. Pagpataw ng Diskwento (Discounts)
- **Senior Citizen / PWD (20% VAT-Exempt):** Pindutin ang `Diskwento` button at piliin ang SC/PWD. Awtomatikong ibabawas ang nararapat na porsyento alinsunod sa batas ng Pilipinas.
- **Custom / Promo Discount:** Maaaring mag-apply ng porsyento (hal. 5%) o tiyak na halaga (hal. ₱20 bawas).

### 4. Pagtanggap ng Bayad at Pag-Checkout (F9 - Checkout)
1. Pindutin ang **`F9`** sa keyboard.
2. Lalabas ang Checkout Modal na nagpapakita ng kabuuang babayaran.
3. Piliin ang Paraan ng Pagbayad:
   - **Cash:** I-type ang halagang inabot ng mamimili (o i-click ang quick bills: ₱100, ₱500, ₱1,000, Exact). Awtomatikong ipapakita ang eksaktong Sukli (Change).
   - **GCash / Maya:** I-type ang Reference Number ng transaksyon.
   - **Utang (Credit):** Piliin ang nakarehistrong customer (tingnan ang Kabanata 6).
4. Pindutin ang `Enter` o i-click ang `Complete Sale`.
5. Awtomatikong magpi-print ang resibo sa Thermal Printer at bubukas ang Cash Drawer.

---

## KABANATA 4: Pamamahala ng Imbentaryo at Multi-Packaging (F2 - Products)

Ang maayos na imbentaryo ang puso ng kumikitang tindahan.

### 1. Paglikha ng Bagong Produkto
Pindutin ang `+ Add Product` sa Products page:
- **Pangalan (Name):** Tiyaking malinaw at madaling hanapin (hal. *Datu Puti Soy Sauce 385ml*).
- **Barcode / SKU:** I-scan ang barcode o hayaang gumawa ang system ng natatanging SKU.
- **Kategorya (Category):** Hal. *Condiments, Snacks, Beverages, Canned Goods*.
- **Puhunan (Cost Price):** Ang presyo kung magkano binili sa supplier.
- **Presyo ng Tinda (Retail Price):** Ang presyo ng benta sa mamimili.

### 2. Multi-Packaging Units (Packaging Multipliers)
Hindi mo na kailangang gumawa ng magkahiwalay na produkto para sa tingi at bulto!
- **Base Unit:** *Piece (Piraso)* — Presyo: ₱15.00
- **Unit 2:** *Pack (10 Pcs)* — Conversion: `10` — Presyo: ₱140.00
- **Unit 3:** *Box (100 Pcs)* — Conversion: `100` — Presyo: ₱1,350.00
> Inig benta ng 1 Kahon, awtomatikong 100 piraso ang ibabawas ng system sa iyong kabuuang imbentaryo nang may 100% katumpakan!

### 3. Expiration Tracking at Low Stock Warning
- Maglagay ng **Low Stock Threshold** (hal. `5 piraso`). Kapag bumaba rito ang stock, kukulay dilaw/pula ang item upang ipaalala na kailangan nang mag-order.
- I-set ang **Petsa ng Expiration** para sa mga pagkaing madaling mapanis. May babala ang system 30 araw bago ito mag-expire.

---

## KABANATA 5: Wholesale Purchases at Pagtanggap ng Delivery

Kapag dumarating ang delivery mula sa mga ahente o distributor (hal. Nestlé, URC, Unilever), gamitin ang **Purchase Invoice System**.

### Pormula ng Cascading Trade Discounts ("Less 5% Less 5%"):
Karamihan sa mga distributor sa Pilipinas ay nagbibigay ng magkakasunod na diskwento sa resibo tulad ng `10+5+2` o `-5%-5%`.
- I-type lamang sa Discount field ang: `5+5` o `-5%-5%` o `₱50`.
- Awtomatikong ikakalkula ng TINDA POS ang sunod-sunod na diskwento:
  $$\text{Net Landed Cost} = \text{Gross} \times (1 - d_1) \times (1 - d_2)$$
- **Awtomatikong Ina-update ang Catalog Cost:** Ang netong presyo ng bawat piraso ay awtomatikong magiging bagong puhunan ng produkto para laging tumpak ang iyong Gross Profit Margin.

---

## KABANATA 6: Suki Utang Ledger at Paniningil (F4 - Customers)

Idinisenyo para sa kulturang Pilipino kung saan karaniwan ang pautang sa mga mapagkakatiwalaang suki nang may mahigpit na kontrol sa pananalapi.

### 1. Pagrehistro ng Customer at Credit Limit
- Ilagay ang Buong Pangalan, Palayaw (Nickname), Tirahan, at Telepono.
- Magtakda ng **Credit Limit (Hal. ₱2,000.00):** Kapag umabot na rito ang utang, haharangin ng system ang karagdagang utang upang maiwasan ang pagkalugi.

### 2. Pagpapautang sa POS
- Sa Checkout Modal, piliin ang `Charge to Account (Utang)`.
- Piliin ang pangalan ng Customer.
- Awtomatikong magtatala ito sa Ledger at magpi-print ng resibo na may lagdaan para sa customer.

### 3. Paniningil at Pagbabayad (Payment & Statement of Account)
- Sa Customers Page, i-click ang pangalan ng suki upang makita ang buong kasaysayan ng kanyang kinuha.
- I-click ang **`Receive Payment`** kapag nagbayad siya nang buo o hulugan (Partial Payment).
- **Print Statement of Account (SOA):** Maaaring i-print sa 58mm/80mm thermal receipt o malinis na A4/Letter paper na nagpapakita ng listahan ng mga petsa, halaga, at natitirang balanse upang walang pagtatalo sa singilan.
- **Master Utang Report:** Isang-pindot na listahan ng lahat ng may utang sa buong tindahan, nakaayos mula sa pinakamalaki hanggang sa pinakamaliit.

---

## KABANATA 7: Store Use at Operating Expense Voucher (Bago sa v2.2.10)

Ang **Store Use** ay ginagamit kapag ang tindahan mismo ang gagamit ng paninda para sa sariling operasyon (halimbawa: sabon at walis para sa paglilinis, bombilya na ipapalit sa pundido, kape at asukal para sa merienda ng tauhan, o plywood para sa ginagawang estante).

### Mga Pangunahing Katangian sa Bersyon 2.2.10:
1. **Awtomatikong Pagsunod sa Retail Selling Price:**
   - Pagkapili ng produkto o pagka-scan ng barcode, **agad na lalabas ang Retail Selling Price** bilang valuation upang hindi na kailangang hulaan o mano-manong hanapin ng kahera ang halaga.
   - Kapag pinalitan ang unit (hal. galing `Piraso` patungo sa `Kahon`), kusa ring magko-compute ang presyo para sa buong kahon.
   - Pwede pa ring baguhin nang mano-mano kung nais ng may-ari na puhunan (cost) ang itala.
2. **Double-Entry Accounting:**
   - Awtomatikong **ibinabawas ang piraso sa imbentaryo**.
   - Awtomatikong **inililista ang kabuuang halaga sa Operating Expenses (OPEX)** ng tindahan upang hindi maging "short" o mawala sa kwenta ng kita.
3. **Multi-Item Entry:** Maaaring maglagay ng maraming produkto sa iisang voucher tulad ng Purchase Invoice.
4. **Voucher History & Itemized Details Center (VIP):**
   - May bagong tab na **"Voucher History & Details (VIP)"** sa Store Use modal at hiwalay na button sa Expenses screen.
   - **Paghahanap at Pag-filter:** Mabilis na salain ang mga nakaraang voucher gamit ang Reference No. (hal. `SU-20261015-...`), petsa (Today, Last 7 Days, This Month, All Time), o pangalan ng produkto.
   - **Itemized Breakdown Dialog (View Details):** I-click ang icon na may mata (`View Details`) upang makita ang buong detalye ng voucher: bawat produktong ginamit, dami, unit, unit price, subtotal, at stock bago at pagkatapos mabawas.
   - **Muling Pag-print (Reprint Voucher Slip):** I-click ang printer icon upang muling i-print ang 58mm o 80mm thermal slip para sa opisyal na pag-file ng resibo at audit ng negosyo.
5. **Thermal Voucher Print:** Nagpi-print ng pormal na 58/80mm slip na may linya para sa humiling at nag-apruba.

---

## KABANATA 8: E-Wallet Hub at Pang-araw-araw na Cash Drawer Reconciliation

Ang mga tindahan ngayon ay nagsisilbi na ring remittance at loading center para sa GCash, Maya, atbp.

### 1. Cash In at Cash Out Logging
- **Cash In:** Ang customer ay nag-abot ng pisikal na pera kapalit ng digital funds sa kanilang cellphone. Awtomatikong nagdadagdag ito ng service fee.
- **Cash Out:** Ang customer ay nag-transfer ng digital funds sa tindahan, at naglabas ang kahera ng pisikal na pera mula sa drawer.

### 2. Midnight (12:00 AM) Automatic Reset
- Ang lahat ng E-Wallet counters ay awtomatikong nagre-reset tuwing hatinggabi (12:00 AM) upang ang bawat araw ay may malinis at independiyenteng kwenta na hindi nahahalo sa mga nakalipas na araw.

### 3. Strictly Daily Cash Drawer Reconciliation (Z-Read Audit)
Sa pagtatapos ng shift o pagsasara ng tindahan sa gabi:
- **Expected Cash:** 
  $$\text{Expected} = \text{Beginning Float} + \text{POS Net Cash Sales} + \text{E-Wallet Cash Delta} - \text{Cash Expenses}$$
- I-type lamang ang bilang ng mga papel at barya (₱1,000, ₱500, ₱100, ₱50, ₱20, mga barya).
- Awtomatikong sasabihin ng system kung ikaw ay **Exact (Balansado)**, **Over (Sobra)**, o **Short (Kulang)** nang walang daya.

---

## KABANATA 9: Hardware, Barcode Labels at Thermal Receipt Printers

### 1. Chiteng CT221B at Barcode Label Printers
- Suportado ang sukat na 40×30mm, 50×30mm, at 30×20mm.
- Gumagamit ng **Code 128 (Subset B) Pure Vector Geometry** na may pinalaking vertical bars (+120%) at bold 900-weight typography para sa 100% first-pass scanning gamit ang kahit anong murang USB o wireless scanner.

### 2. 58mm at 80mm ESC/POS Receipt Printers
- Walang putol na teksto: May built-in thermal spacing studio para ma-adjust ang Left Margin, Top Margin, at Line Spacing.
- Auto Cash Drawer Kick: Awtomatikong nagpapadala ng signal sa RJ11 port ng printer para bumukas ang drawer sa bawat cash sale.

---

## KABANATA 10: 1-Tap QR Mobile Pairing at Cloud Owner Dashboard

Nais mo bang makita ang benta ng iyong tindahan habang ikaw ay nasa bahay, namamalengke, o nagbabakasyon?

1. Buksan ang **Cloud Sync** modal sa TINDA POS.
2. Lalabas ang isang malaking QR Code sa screen.
3. Buksan ang Camera ng iyong iPhone o Android Phone at itutok sa screen.
4. I-tap ang lalabas na link. Agad na magbubukas ang iyong **Cloud Owner Dashboard** (`tinda-owner-dashboard.pages.dev`).
5. Awtomatikong nagpapadala ang computer ng benta bawat 3 minuto kapag may internet. Kung mawalan man ng internet, mananatiling ligtas ang data sa computer at magsa-sync agad sa oras na magkaroon muli ng koneksyon.

---

## KABANATA 11: Talaan ng mga Keyboard Shortcuts

Para sa napakabilis na operasyon ng kahera nang hindi na kailangang hawakan ang mouse:

| Shortcut | Aksyon / Gawain |
|---|---|
| **`F1`** | Buksan ang POS Terminal (Sales Screen) |
| **`F2`** | Buksan ang Listahan ng Produkto at Imbentaryo |
| **`F3`** | Buksan ang Dashboard at Benta Reports |
| **`F4`** | Buksan ang Suki Customers at Utang Ledger |
| **`F5`** | Buksan ang E-Wallet Hub (GCash / Maya) |
| **`F9`** | **Mabilisang Cash Checkout** (Diretso sa Cash Inabot) |
| **`F10`** | Buksan ang Drawer / Mabilisang POS Tools |
| **`/`** | Mabilisang Search Barcode o Pangalan ng Paninda |
| **`Esc`** | Kanselahin ang kasalukuyang modal o isara ang window |
| **`Enter`** | Kumpirmahin ang pagdagdag o pag-checkout |
| **`Alt + V`** | Magpalit ng view sa Inventory: Grid View vs List View |

---

## KABANATA 12: Pag-iwas sa Error, Pag-backup, at Troubleshooting

### 1. Awtomatikong Pre-Update Safety Snapshots
Bago mag-download at mag-install ng anumang bagong bersyon (tulad ng Full Setup), kusa munang kumukuha ang TINDA POS ng kumpletong kopya ng iyong database (`sqlite.db`) at inilalagay ito sa `backups/` folder. Kahit mag-brownout sa gitna ng update, 0% ang posibilidad na mawala ang iyong mga paninda at pautang.

### 2. Paano Mag-Backup nang Mano-mano
- Magtungo sa **Settings > Database & Backups**.
- I-click ang **`Create Instant Local Backup`**.
- Maaari ring kopyahin ang backup file papunta sa isang USB Flash Drive para sa karagdagang kapanatagan ng loob.

### 3. Karaniwang Tanong (FAQs)

- **Q: Paano kung biglang namatay ang kuryente (Brownout) habang nagbebenta?**  
  *A:* Dahil sa SQLite Write-Ahead Logging (WAL) architecture, walang masisirang datos. Pagbukas muli ng kompyuter, buo at ligtas ang lahat ng naitalang transaksyon.

- **Q: Bakit sinasabing 100% Full Setup lang ang gamitin at bawal ang patch?**  
  *A:* Ang mga patch ay screen lang ang pinapalitan, kaya nagkakaroon ng missing functions. Ang opisyal na **`TindaPOS-Setup-2.2.9.exe`** ay pinapalitan ang buong programa nang malinis kasama ang pinakabagong drivers at security updates nang hindi ginagalaw ang iyong nakaimbak na mga paninda.

---

*Inihanda at Binasbasan ng TINDA POS Doctoral Engineering Team:*  
**Dr. Vex (Principal Systems Architect) · Dr. Kael (Quantitative Logic) · Dr. Nyx (Operations Research) · Dr. Argus (Zero-Error QA Gatekeeper) · Jin (Chief Orchestrator)**
