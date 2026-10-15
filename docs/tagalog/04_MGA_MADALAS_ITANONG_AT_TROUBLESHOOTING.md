# ❓ MGA MADALAS ITANONG AT GABAY SA TROUBLESHOOTING
## TINDA POS Desktop — Zero-Error Emergency Guide

---

### 1. ⚡ MGA ISYU SA KURYENTE AT BROWNOUT

**Tanong: Biglang namatay ang kompyuter dahil sa brownout habang nagka-kahera ako. Masisira ba ang aking database o mawawala ang benta?**  
**Sagot:** **HINDI.**  
Gumagamit ang TINDA POS ng **SQLite Write-Ahead Logging (WAL)**. Ang bawat transaksyon ay nakasulat sa disk bago pa man mag-print ang resibo. Pagbukas muli ng kompyuter:
1. Buksan muli ang TINDA POS.
2. Awtomatikong magsasagawa ng auto-recovery ang database.
3. Buo ang lahat ng naitalang benta, stock, at pautang.

---

### 2. 💿 BAKIT BAWAL ANG PATCH AT DAPAT FULL SETUP.EXE LANG?

**Tanong: Dati may naririnig akong hot patch, bakit ngayon ay Full Setup.exe na lang ang dapat i-download?**  
**Sagot:**  
Ang "Patch" ay ang screen o itsura lamang ng app ang pinapalitan. Hindi nito kayang i-update ang background engine at drivers sa loob ng kompyuter, na siyang nagiging dahilan ng mga error tulad ng *"window.api.inventory.storeUse is not a function"*.  
Sa pamamagitan ng **`TindaPOS-Setup-2.2.9.exe`**:
- 100% bago at sariwa ang buong programa.
- Awtomatikong nagba-backup ang system bago mag-update para walang mawala.
- Malinis ang pagkaka-install at walang naiiwanang sira o lumang files.

---

### 3. 🔑 NAKALIMUTANG ADMIN PASSWORD O PIN

**Tanong: Nakalimutan ng may-ari ang Admin Password o Manager PIN. Paano ito marereset?**  
**Sagot:**  
1. Kung may isa pang nakatalagang Admin user, maaaring mag-log in ang katuwang na admin at i-reset ang PIN sa ilalim ng **Settings > Users**.
2. Kung ikaw lamang ang nag-iisang admin:
   - Magbukas ng Command Prompt sa kompyuter.
   - Patakbuhin ang emergency credential reset script na matatagpuan sa installation folder:
     `node tools/reset_admin_credentials.mjs`
   - Kusa itong magbibigay ng pansamantalang PIN para muling makapasok.

---

### 4. 🖨️ AYAW MAG-PRINT NG RESIBO O MALABO ANG PRINT

**Tanong: Walang lumalabas na papel o puti lang ang lumalabas na papel.**  
**Sagot:**  
1. **Binaligtad na Papel:** Ang thermal paper ay may isang gilid lamang na may chemical coating. Kung puti lang ang lumalabas, baligtad ang pagkakasalang ng rolyo. Baligtarin ang rolyo at subukang mag-print muli.
2. **Koneksyon ng USB:** Tiyaking nakasaksak ang USB cable sa parehong port kung saan ito naunang na-install.
3. **Paper Jam:** Buksan ang takip ng printer, gupitin ang gusot na bahagi, at isara nang mahigpit ang takip hanggang lumagutok (click).

---

### 5. 🌐 PAANO KUNG MAWALAN NG INTERNET?

**Tanong: Kailangan ba ng WiFi para makapagbenta?**  
**Sagot:** **HINDI KAILANGAN.**  
Ang TINDA POS ay **100% Offline**. Maaari kang magbenta, mag-inventory, maglista ng utang, at mag-print ng resibo kahit walang internet nang buong taon!  
Ang internet ay ginagamit lamang kapag:
- Nais mong tingnan ang benta sa iyong Cellphone gamit ang Cloud Owner Dashboard.
- Magda-download ka ng bagong bersyon ng programa.

---

### 6. 💾 PAANO ANG TAMA AT LIGTAS NA PAG-BACKUP?

Inirerekomenda ang **Lingguhang Pag-backup sa USB Flash Drive**:
1. Isaksak ang iyong USB flash drive sa kompyuter.
2. Sa TINDA POS, magtungo sa **Settings > Database**.
3. I-click ang **`Export Database Backup`**.
4. Piliin ang iyong USB Flash Drive at i-save ang file.
5. Ligtas na ang iyong tindahan kahit manakaw o masira ang kompyuter!
