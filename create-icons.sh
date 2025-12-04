#!/bin/bash
# Simple script to create basic PNG icons for the extension
# You should replace these with proper icons

# Create a simple 16x16 PNG
convert -size 16x16 xc:"#ff6600" -font Arial -pointsize 8 -fill white -gravity center -annotate +0+0 "C" /Users/mohamedazizbenrejeb/WebstormProjects/cleanit/public/icons/icon-16.png 2>/dev/null || echo "ImageMagick not installed - using placeholder files"

# Create a simple 48x48 PNG
convert -size 48x48 xc:"#ff6600" -font Arial -pointsize 20 -fill white -gravity center -annotate +0+0 "CW" /Users/mohamedazizbenrejeb/WebstormProjects/cleanit/public/icons/icon-48.png 2>/dev/null || echo "ImageMagick not installed - using placeholder files"

# Create a simple 128x128 PNG
convert -size 128x128 xc:"#ff6600" -font Arial -pointsize 24 -fill white -gravity center -annotate +0+0 "CleanWeb" /Users/mohamedazizbenrejeb/WebstormProjects/cleanit/public/icons/icon-128.png 2>/dev/null || echo "ImageMagick not installed - using placeholder files"
