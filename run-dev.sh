#/bin/bash

npm run build

MUSIC_FOLDER=~/music \
  VIDEO_FOLDER=~/video \
  YT_CACHE=~/.yt-download/cache \
  YT_TMP=~/.yt-download/tmp \
  YT_DOWNLOADED_TXT=~/.yt-download/downloaded.txt \
  npm run dev
