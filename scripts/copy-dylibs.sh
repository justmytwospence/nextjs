#!/bin/bash

set -e  # Exit on error

mkdir dylibs

echo "Copying gdal dynamic dependencies"
"$HOME"/miniconda3/bin/conda run -n gdal_env ldd libgdal.a | grep '=>' | grep -v " not " | awk '{print $3}' | while read -r lib; do
  echo "Copying $lib"
  cp "$lib" /opt/build/repo/dylibs/
done

echo "Copying .node dynamic dependencies"
"$HOME"/miniconda3/bin/conda run -n gdal_env ldd pathfinder/pathfinder.linux-x64-gnu.node | grep '=>' | grep -v " not " | awk '{print $3}' | while read -r lib; do
  echo "Copying $lib"
  cp "$lib" /opt/build/repo/dylibs/
done
