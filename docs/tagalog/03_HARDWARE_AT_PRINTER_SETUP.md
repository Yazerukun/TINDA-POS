# 🖨️ GABAY SA HARDWARE, PRINTER AT BARCODE ENGINE
## TINDA POS Desktop — Propesyonal na Gabay sa Koneksyon ng Kagamitan

---

### 1. 🧾 THERMAL RECEIPT PRINTERS (58MM AT 80MM)

Ang TINDA POS ay may sariling built-in **ESC/POS Vector Spooler** na hindi nangangailangan ng mamahaling proprietary software.

#### Mga Hakbang sa Pagkabit:
1. Isaksak ang USB cable ng Thermal Printer sa kompyuter.
2. I-on ang printer at siguraduhing may tamang papel (Thermal Roll, hindi plain paper).
3. Sa Windows, magtungo sa **Settings > Bluetooth & Devices > Printers & Scanners** at siguraduhing nakikita ang printer (hal. *POS-58* o *POS-80*).
4. Buksan ang **TINDA POS > Settings > Hardware & Printer**.
5. Piliin ang iyong printer sa dropdown list.
6. Pindutin ang **`Test Print Receipt`**.

#### Pagsasaayos ng Margin at Spacing (Thermal Studio):
- Kung masyadong dikit ang teksto sa kaliwa: Ayusin ang **Left Margin** (inirerekomenda: `3mm`).
- Kung masyadong maikli ang cut pagkatapos mag-print: Dagdagan ang **Feed Lines** (inirerekomenda: `4 hanggang 5 lines`).

---

### 2. 🏷️ CHITENG CT221B AT BARCODE LABEL PRINTERS

Para sa mga tindahang nais maglagay ng sariling barcode sticker sa mga produkto (halimbawa: bigas, repacked pako, plastic, mantika, karne).

#### Pag-install ng Driver:
- Ang opisyal na installer ng driver ay kasama sa loob ng TINDA POS installation folder sa:
  `builds\win-unpacked\resources\drivers\Label-Printer-Driver-V1.5.exe`.
- Patakbuhin ang installer at piliin ang **Chiteng CT221B (USB)**.

#### Mga Suportadong Sukat ng Sticker:
- **40mm × 30mm:** Ang pinaka-standard para sa mga retail items sa Pilipinas.
- **50mm × 30mm:** Para sa mas malalaking kahon o bulto na nangangailangan ng malalaking letra.
- **30mm × 20mm:** Para sa maliliit na gamit tulad ng kendi o pako.

#### Code 128 Vector Geometry Engine:
- Gumagamit ang TINDA POS ng pinalaking vertical bars (+120% vertical height) at high-contrast quiet zones.
- Tinitiyak nito na kahit mga murang ₱300 barcode scanner sa Shopee/Lazada ay makakapagbasa sa unang pass pa lamang nang walang mintis!

---

### 3. 💵 CASH DRAWER (RJ11 CONNECTION)

Hindi kailangang isaksak ang cash drawer sa computer! Ang drawer ay isinasaksak direkta sa likod ng iyong **Receipt Printer** gamit ang **RJ11 telephone-style cable**.

#### Paano Gumagana:
- Kapag natapos ang isang Cash Sale sa POS, awtomatikong nagpapadala ang TINDA POS ng **Electronic Pulse (ESC/POS `27, 112, 0, 25, 250`)** sa printer.
- Ang printer ang magti-trigger sa solenoid ng drawer upang kusa itong bumukas.
- Maaari ring pindutin ang **`F10 > Kick Cash Drawer`** upang buksan ito nang mano-mano kung may pahintulot ng admin.

---

### 4. 🔍 USB AT WIRELESS BARCODE SCANNERS

Lahat ng standard USB barcode scanner (wired man o wireless 2.4GHz USB dongle) ay "Plug-and-Play". Hindi nangangailangan ng anumang driver dahil gumagana ang mga ito bilang **Human Interface Device (HID Keyboard)**.

#### Mahalagang Setting ng Scanner:
- Siguraduhing naka-enable sa barcode scanner ang **`Enter / Carriage Return (CR/LF)` Suffix**. Ito ang nag-uutos sa kompyuter na pindutin ang `Enter` matapos ma-scan ang barcode para awtomatikong pumasok sa cart.
