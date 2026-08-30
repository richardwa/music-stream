#/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

npm run build

MUSIC_FOLDER="$DIR/sample-music" npm run dev
