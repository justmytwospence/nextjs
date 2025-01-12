#!/bin/bash

set -e  # Exit on error

mkdir dylibs

echo "Copying .node dynamic dependencies"
"$HOME"/miniconda3/bin/conda run -n gdal_env libtree pathfinder/pathfinder.linux-x64-gnu.node | grep '=>' | grep -v " not " | awk '{print $3}' | while read -r lib; do
  echo "Copying $lib"
  cp "$lib" /opt/build/repo/dylibs/
done
