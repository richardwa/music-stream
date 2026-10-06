#!/bin/bash
set -euo pipefail

# Ensure script is run as root
if [[ $EUID -ne 0 ]]; then
  echo "Error: This script must be run as root." >&2
  exit 1
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
username="$(basename "$DIR")"

# Create deployment account
"$DIR/../.bin/createAccount.sh" "$username"

# Setup permissions (no external public volumes required)
