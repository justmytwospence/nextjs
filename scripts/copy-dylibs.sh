#!/bin/bash

set -e  # Exit on error

ldd pathfinder/pathfinder.linux-x64-gnu.node
nm -C pathfinder/pathfinder.linux-x64-gnu.node | grep GDAL

mkdir dylibs

echo "Copying .node dynamic dependencies"
ldd pathfinder/pathfinder.linux-x64-gnu.node | grep '=>' | grep -v " not " | awk '{print $3}' | while read -r lib; do
  echo "Copying $lib"
  cp "$lib" /opt/build/repo/dylibs/
done
