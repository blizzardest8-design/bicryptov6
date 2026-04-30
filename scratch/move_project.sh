#!/bin/bash
SOURCE="/mnt/e/Downloads/Bicrypto v6.3/Bicrypto v6.3 Nulled/codecanyon-35599184-bicrypto-crypto-trading-platform/codecanyon-35599184-bicrypto-crypto-trading-platform-watchlist-kyc-charting-library-wallets-binary-trading-news/"
DEST="$HOME/bicrypto"
mkdir -p "$DEST"
rsync -av --exclude "node_modules" --exclude ".git" "$SOURCE" "$DEST/"
