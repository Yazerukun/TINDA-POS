# TINDA POS — One-Time Manual Software Update

Applies to installed (Setup) versions **v1.0.3**, **v1.0.4**, **v1.0.5**.

## Why this is needed

v1.0.3–v1.0.5 shipped a Software Update defect: the download path called the
updater's `downloadUpdate()` without first running `checkForUpdates()`, so
"Download Update" always failed with *"Please check update first"*. Publishing a new
version **cannot repair code already installed** on your computer — so those versions
need exactly **one manual update**, after which automatic updates work forever.

## One-time steps (installed version)

1. (Recommended) Open **Settings → Backup** and save a backup file somewhere safe.
2. Close TINDA POS completely (Logout, then close the window / Exit).
3. Open the release page: `https://github.com/Yazerukun/TINDA-POS/releases`
4. Download **`TindaPOS-Setup-1.0.7.exe`**.
5. (Optional) Verify the file hash — see *Verifying the download* below.
6. Run the installer. Keep the same install options (same language, same user level).
   The installer only replaces the program files; your data (products, sales,
   customers, utang, expenses, shifts, cash counts) is stored separately and is
   **not touched**.
7. When installation finishes, open **Settings → About**.
   **Installed version must show `v1.0.7`.**
8. Quickly check your data: Inventory, Transactions, Customers, Reports.
   If anything looks missing, restore the backup from step 1.

After this step, **Software Update now works by itself**: future releases (v1.0.8+)
will appear in Settings → About → Software Update → Check for Updates and install
automatically with a safety backup before install.

## Portable version users

1. Download **`TindaPOS-Portable-1.0.7.exe`** from the same release page.
2. Replace your old Portable EXE with the new one (keep the same folder).
   Your `TindaPOS-Data` folder is preserved automatically — no data loss.

## Verifying the download (recommended)

SHA-256 checksums (publish the real ones in the release/README):

- `TindaPOS-Setup-1.0.7.exe` — `713c52839826229055a708fc222bd52a1b2ab3288ca04ce374cd15e81d819356`
- `TindaPOS-Portable-1.0.7.exe` — `88b2346bbdfe6823cdbc5f708e25cb503df2471e478ddb2a515d15b0b83b23f0`

On Windows, verify with Command Prompt:

```
certutil -hashfile my-downloaded.exe SHA256
```

Compare the output with the checksum above. They must match exactly.

## What this does NOT require

- No reinstalling Windows.
- No re-entering your data.
- No losing transactions/history.
- No payment required.