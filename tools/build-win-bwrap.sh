#!/bin/bash
# Run TINDA POS Windows RC build inside a bubblewrap mount namespace
# with a disk-backed /tmp (NSIS fails on the small host tmpfs).
set -euo pipefail

SRC=/home/ian/tindapos-v106-qa/v116-worktree/source
TMPREAL=/home/ian/tindapos-v106-qa/.bwrap-tmp
NODEBASE=/home/ian/.local/share/mise/installs/node/26.7.0

mkdir -p "$TMPREAL"

bwrap \
  --die-with-parent \
  --unshare-all \
  --share-net \
  --new-session \
  --dev /dev \
  --proc /proc \
  --ro-bind /usr /usr \
  --ro-bind /etc /etc \
  --ro-bind /lib /lib \
  --ro-bind /lib64 /lib64 \
  --ro-bind /bin /bin \
  --ro-bind /sbin /sbin \
  --ro-bind /run /run \
  --ro-bind "$NODEBASE" "$NODEBASE" \
  --bind "$SRC" "$SRC" \
  --bind "$TMPREAL" /tmp \
  --clearenv \
  --setenv PATH "$NODEBASE/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" \
  --setenv HOME "$HOME" \
  --setenv TMPDIR /tmp \
  --setenv ELECTRON_CACHE /tmp/.electron-cache \
  --chdir "$SRC" \
  bash -c "npm run build && npx electron-builder --win --publish never -c.directories.output=builds-v117-rc"
