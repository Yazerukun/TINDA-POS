#!/usr/bin/env python3
"""
TINDA POS — Automated Release Verification Gate.
Validates all required artifacts before publishing a GitHub release.
"""

import sys
import os
import hashlib
import base64
import yaml
from pathlib import Path

def compute_sha512_base64(filepath: Path) -> str:
    hasher = hashlib.sha512()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return base64.b64encode(hasher.digest()).decode("utf-8")

def compute_sha256_hex(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest().lower()

def verify_release_artifacts(directory: str, version: str) -> bool:
    dist_dir = Path(directory)
    print(f"=== TINDA POS RELEASE GATE: Validating v{version} in {dist_dir} ===")
    
    if not dist_dir.exists():
        print(f"[FAIL] Error: Directory '{dist_dir}' does not exist.")
        return False

    all_passed = True

    # 1. Check all required artifacts exist
    setup_file = dist_dir / f"TindaPOS-Setup-{version}.exe"
    portable_file = dist_dir / f"TindaPOS-Portable-{version}.exe"
    latest_yml = dist_dir / "latest.yml"
    user_guide = dist_dir / "TindaPOS-User-Guide.pdf"

    for label, path in [
        ("Setup Installer", setup_file),
        ("Portable Executable", portable_file),
        ("Updater Manifest (latest.yml)", latest_yml),
        ("User Guide PDF", user_guide)
    ]:
        if not path.exists():
            print(f"[FAIL] MISSING ARTIFACT: {label} ({path.name}) not found!")
            all_passed = False
        else:
            size_mb = path.stat().st_size / (1024 * 1024)
            print(f"[PASS] Found {label}: {path.name} ({size_mb:.2f} MB)")

    if not all_passed:
        print("\n[FAIL] RELEASE GATE FAILED: Missing required release files.")
        return False

    # 2. Validate latest.yml integrity against Setup.exe
    print("\n--- Validating latest.yml Manifest Integrity ---")
    try:
        with open(latest_yml, "r", encoding="utf-8") as f:
            manifest = yaml.safe_load(f)
        
        manifest_version = str(manifest.get("version", ""))
        if manifest_version != version:
            print(f"[FAIL] Version mismatch in latest.yml! Expected: {version}, Got: {manifest_version}")
            all_passed = False
        else:
            print(f"[PASS] Manifest version matches: {manifest_version}")

        actual_size = setup_file.stat().st_size
        manifest_file_entry = manifest.get("files", [{}])[0]
        manifest_size = manifest_file_entry.get("size")
        if actual_size != manifest_size:
            print(f"[FAIL] Size mismatch for Setup.exe! Actual: {actual_size} bytes, Manifest: {manifest_size} bytes")
            all_passed = False
        else:
            print(f"[PASS] Setup.exe file size verified: {actual_size} bytes")

        actual_sha512 = compute_sha512_base64(setup_file)
        manifest_sha512 = manifest.get("sha512")
        if actual_sha512 != manifest_sha512:
            print("[FAIL] SHA-512 mismatch between Setup.exe and latest.yml!")
            print(f"   Actual:   {actual_sha512}")
            print(f"   Manifest: {manifest_sha512}")
            all_passed = False
        else:
            print("[PASS] SHA-512 Base64 checksum matches latest.yml perfectly!")

    except Exception as e:
        print(f"[FAIL] Error parsing latest.yml: {e}")
        all_passed = False

    # 3. Print Checksums for release notes
    print("\n--- SHA-256 Checksums for Release Notes ---")
    for path in [setup_file, portable_file, user_guide]:
        if path.exists():
            print(f"{compute_sha256_hex(path)}  {path.name}")

    if all_passed:
        print("\n[PASS] ALL RELEASE GATES PASSED! Safe to publish to GitHub.")
    else:
        print("\n[FAIL] RELEASE GATE FAILED! Do not publish until issues are resolved.")

    return all_passed

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python release_gate.py <directory> <version>")
        sys.exit(1)
    
    success = verify_release_artifacts(sys.argv[1], sys.argv[2])
    sys.exit(0 if success else 1)
