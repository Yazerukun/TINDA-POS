# TINDA POS v1.0.27 Stable

Release target: `v1.0.27`
Updater gate: byte-identical firmware of updater machinery (electron-updater + electron-builder + app-update.yml untouched in this release, allowing seamless auto-update from v1.0.19, v1.0.20, v1.0.21, v1.0.22, v1.0.23, v1.0.24, v1.0.25, and v1.0.26 to v1.0.27).

---

## What's New in v1.0.27 (TINDA BANTAY: Complete 172-Item Market Catalog)

### 1. Expanded 172-Item Real-Time Market Price Catalog
- **Comprehensive Commodity Coverage**: Complete market catalog containing **172 staple grocery and sari-sari store products** across all 12 key Philippine retail categories:
  - 🍜 **Instant Noodles & Soups** (Lucky Me Pancit Canton all flavors, Mami Chicken/Beef/Spicy, Supreme Bowls, Payless Xtra Big, Nissin Cup Noodles)
  - 🥫 **Canned Fish & Seafood** (Mega Sardines regular/hot, 555 Sardines, Ligo Red/Green, Master Sardines, Century Tuna Flakes in Oil/Hot&Spicy 155g & 180g, San Marino Corned Tuna, 555 Tuna Caldereta)
  - 🥩 **Canned Meat & Poultry** (Argentina Corned Beef 150g/175g/260g, Purefoods Corned Beef 150g/210g, CDO Karne Norte 100g/150g, Highlands Gold Corned Beef, CDO Meat Loaf, Argentina Beef Loaf, Ma-Ling Pork Luncheon Meat, Reno Liver Spread)
  - 🥛 **Dairy & Milk Products** (Bear Brand Fortified 33g/300g/700g, Birch Tree Full Cream 33g/300g, Alaska Powdered 33g/300g, Alaska Evaporada 360ml, Alaska Condensada 300ml, Carnation Evaporated, Nestle All Purpose Cream, Eden Cheese 160g, Cheez Whiz Jar, Milo 24g/300g)
  - ☕ **Coffee & Beverages** (Nescafe Classic 2g/50g, Nescafe 3-in-1 Original/Creamy White, Kopiko Blanca/Black/Brown & Twin Packs, Great Taste White/Choco & Twin Packs, San Mig Sugar Free, Tang Orange/Pineapple, Nestea Lemon, Coca-Cola 290ml RGB/Mismo/1.5L, Sprite, Royal, Mountain Dew, Cobra, Sting, Nature's Spring Purified Water 500ml/1L)
  - 🍳 **Cooking Oil & Condiments** (Datu Puti Vinegar/Soy Sauce/Patis, Silver Swan Soy Sauce/Vinegar, Marca Piña, Lorins Patis, UFC Banana Catsup Bottle/Pouch, Mang Tomas Sarsa, Golden Fiesta Cooking Oil 250ml/500ml/1L, Minola Coconut Oil)
  - 🧂 **Seasonings & Bouillon** (Maggi Magic Sarap 8g, Ajinomoto MSG 44g/100g, Knorr Pork/Chicken Cubes 2-pack, Knorr Sinigang Original/Gabi)
  - 🍪 **Snacks, Biscuits & Bread** (SkyFlakes 3-Pack, Fita, Rebisco Sandwich Choco/Butter, Hansel Mocha, Magic Flakes, Oishi Prawn Crackers Plain/Spicy, Piattos Cheese/Sour Cream 40g, Chippy BBQ/Chili-Cheese 27g, Nova Cheddar, Clover Chips BBQ/Cheese, Ding Dong Nuts, Nagaraya Garlic, Gardenia Classic White Bread 600g)
  - 🧼 **Personal Care & Toiletries** (Safeguard Pure White 60g/130g, Safeguard Floral Pink, Lifebuoy Red, Silka Papaya 65g, Palmolive Shampoo 15ml, Sunsilk Smooth 15ml, Head & Shoulders Cool Menthol 12ml, Rejoice 15ml, Cream Silk Conditioner 18ml, Colgate 25ml/145g, Close Up Red Hot 50ml, Modess Regular 8s, Whisper Wings 8s, Eskinol Classic White 75ml)
  - 🧺 **Laundry & Household Cleaning** (Surf Powder Sun Fresh/Blossom Fresh 55g, Ariel Sunrise Fresh 66g, Tide with Touch of Downy 66g, Breeze ActiveClean 70g, Downy Sunrise Fresh/Passion 25ml, Joy Dishwashing Liquid Lemon Sachet/Bottle, Axion Dishwashing Paste 190g, Zonrox Bleach 250ml/500ml/1L, Scotch-Brite Heavy Duty Sponge)
  - 🌾 **Rice, Sugar & Staples** (Well-Milled Rice 1kg, Regular-Milled Rice 1kg, Sinandomeng Premium 1kg, Dinorado Special Fragrant Rice 1kg, Refined White Sugar 1kg, Brown Sugar Washed 1kg)
  - 🍺 **Liquor, Beer & Tobacco** (San Miguel Pale Pilsen 330ml, Red Horse Beer 500ml/1L, San Mig Light 330ml, Ginebra Kwatro Kantos 350ml, Tanduay Lapad 375ml, Emperador Light 750ml, Alfonso I Light 700ml, Marlboro Red/Gold 20s, Philip Morris Blue, Fortune Blue, Cricket Lighter, Rizal Safety Matches)

### 2. Built-in 100% Offline Seed + Real-Time Online Sync
- **Bundled Offline Seed**: All 172 commodity records are compiled directly into the application (`seedPriceReferences.ts`). Even on brand-new offline installations with zero internet connectivity, the store owner immediately has access to all 172 items out-of-the-box.
- **Real-Time Live Online Sync**: When online, TINDA POS automatically connects to the live GitHub repository feed (`https://raw.githubusercontent.com/Yazerukun/TINDA-POS/master/data/price-catalog.json`), refreshing prices seamlessly in the background.

### 3. Powered by Scrapling v0.4.15
- **TINDA SCOUT Harvester**: Updated to leverage the latest `d4vinci/Scrapling` (v0.4.15) with full dependencies (`w3lib`, `cssselect`) for automated harvesting from DTI SRP bulletins and major supermarket chains.

---

## Deliverables

- `TindaPOS-Setup-1.0.27.exe` (Windows installer + auto-update payload)
- `TindaPOS-Portable-1.0.27.exe` (Portable edition)
- `TindaPOS-User-Guide.pdf` (v1.0.27)
- `SHA256SUMS-v1.0.27.txt`
