#!/usr/bin/env node
/**
 * ============================================================================
 * 💎 TINDA POS VIP PRO — DEVELOPER PRIVATE KEY GENERATOR (KEYGEN)
 * ============================================================================
 * Author: Ian (Dev Francis)
 * Payment: Maya 09912255156 (₱500 One-Time VIP Pro)
 * Facebook: https://www.facebook.com/Ukauru
 * 
 * CONFIDENTIAL & PROPRIETARY — NEVER DISTRIBUTE OR LEAK THIS FILE.
 * ============================================================================
 */

import crypto from 'node:crypto'

const PEPPER_BYTES = Buffer.from([
  0x54, 0x49, 0x4e, 0x44, 0x41, 0x5f, 0x56, 0x49, 0x50, 0x5f,
  0x53, 0x45, 0x43, 0x55, 0x52, 0x45, 0x5f, 0x50, 0x45, 0x50,
  0x50, 0x45, 0x52, 0x5f, 0x32, 0x30, 0x32, 0x36, 0x5f, 0x46,
  0x52, 0x41, 0x4e, 0x43, 0x49, 0x53, 0x5f, 0x4d, 0x41, 0x59,
  0x41, 0x5f, 0x30, 0x39, 0x39, 0x31, 0x32, 0x32, 0x35, 0x35,
  0x31, 0x35, 0x36
])

const MASK_KEY = 0x5a

function getInternalSecret() {
  const buf = Buffer.alloc(PEPPER_BYTES.length)
  for (let i = 0; i < PEPPER_BYTES.length; i++) {
    buf[i] = PEPPER_BYTES[i] ^ (MASK_KEY + (i % 7))
  }
  return buf
}

function generateKeyForMachine(machineId, tier = 'VIP_PRO') {
  const normMachine = machineId.trim().toUpperCase()
  const secret = getInternalSecret()

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(`TINDA_AUTH_V1::${normMachine}::${tier}`)
  const fullSig = hmac.digest('hex').toUpperCase()

  const chunk1 = fullSig.substring(0, 4)
  const chunk2 = fullSig.substring(4, 8)
  const chunk3 = fullSig.substring(8, 12)

  const checksumHash = crypto.createHash('sha256').update(`${normMachine}:${chunk1}${chunk2}${chunk3}`).digest('hex').toUpperCase()
  const checksum = checksumHash.substring(0, 4)

  return `VIP-${chunk1}-${chunk2}-${chunk3}-${checksum}`
}

function verifyKey(key, machineId) {
  if (!key || !machineId) return false
  const cleanKey = key.trim().toUpperCase()
  const expected = generateKeyForMachine(machineId, 'VIP_PRO')
  return cleanKey === expected
}

function printUsage() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║         💎 TINDA POS VIP PRO — PRIVATE DEVELOPER KEYGEN              ║
║         Author: Ian (Dev Francis) · Maya: 09912255156                 ║
╚═══════════════════════════════════════════════════════════════════════╝

Usage:
  node tools/keygen.mjs generate --machine <MACHINE_ID> [--name <CUSTOMER_NAME>]
  node tools/keygen.mjs verify --machine <MACHINE_ID> --key <VIP_KEY>

Examples:
  node tools/keygen.mjs generate --machine TNDA-8F42-99B1-204A-E7C1
  node tools/keygen.mjs generate --machine TNDA-8F42-99B1-204A-E7C1 --name "Aling Nena Grocery"
  node tools/keygen.mjs verify --machine TNDA-8F42-99B1-204A-E7C1 --key VIP-A1B2-C3D4-E5F6-7890
`)
}

// CLI argument parsing
const args = process.argv.slice(2)
const cmd = args[0]

if (!cmd || cmd === '--help' || cmd === '-h') {
  printUsage()
  process.exit(0)
}

function getArg(flag) {
  const idx = args.indexOf(flag)
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1]
  }
  return null
}

if (cmd === 'generate') {
  const machine = getArg('--machine') || getArg('-m')
  const name = getArg('--name') || getArg('-n') || 'Valued Store Owner'

  if (!machine) {
    console.error('❌ Error: Missing --machine argument.')
    console.error('Example: node tools/keygen.mjs generate --machine TNDA-8F42-99B1-204A-E7C1')
    process.exit(1)
  }

  const key = generateKeyForMachine(machine)

  console.log(`
========================================================================
💎 TINDA POS VIP PRO LICENSE KEY GENERATED
========================================================================
Customer Name : ${name}
Machine ID    : ${machine.toUpperCase()}
License Tier  : VIP PRO (Lifetime Unlocked, 100% Offline)
Payment Target: ₱500 Maya (0991 225 5156)

>>> VIP LICENSE KEY:
    ${key}

------------------------------------------------------------------------
Copy-Paste Message to Customer on Facebook (https://www.facebook.com/Ukauru):
------------------------------------------------------------------------
Thank you for purchasing TINDA POS VIP Pro, ${name}!
Here is your official, hardware-locked VIP Pro License Key:

🔑 VIP LICENSE KEY: ${key}

How to activate:
1. Open TINDA POS -> Go to Settings -> "VIP Pro License".
2. Paste your VIP License Key into the box.
3. Click the "Activate VIP Pro Lifetime" button.

All VIP features are now permanently unlocked for your store:
• Multi-Counter LAN Hub (Multiple cashiers on 1 database)
• Paperless QR Digital Receipts direct to phone cameras
• Customer Credit Trust Score & SMS Reminder Formatter
• 100% Custom Store Logo, Header & Footer on Receipts
• Daily Loss Prevention & Cash Drawer Variance Auditing

Thank you for choosing TINDA POS. Have a great and prosperous day!
========================================================================
`)
} else if (cmd === 'verify') {
  const machine = getArg('--machine') || getArg('-m')
  const key = getArg('--key') || getArg('-k')

  if (!machine || !key) {
    console.error('❌ Error: Both --machine and --key are required for verification.')
    process.exit(1)
  }

  const ok = verifyKey(key, machine)
  if (ok) {
    console.log(`\n✅ VALID KEY! The key ${key.toUpperCase()} is valid for machine ${machine.toUpperCase()}.\n`)
  } else {
    console.log(`\n❌ INVALID KEY! The key ${key.toUpperCase()} DOES NOT match machine ${machine.toUpperCase()}.\n`)
  }
} else {
  printUsage()
  process.exit(1)
}
