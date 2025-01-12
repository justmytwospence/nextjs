#!/bin/bash

set -e  

"$HOME"/miniconda3/bin/conda run -n gdal_env ldd pathfinder/pathfinder.linux-x64-gnu.node ldd pathfinder/pathfinder.linux-x64-gnu.node 

mkdir dylibs

# copy GDAL dependencies
echo "Copying GDAL dependencies"
"$HOME"/miniconda3/bin/conda run -n gdal_env ldd gdal-3.10.0/build/lib/libgdal.so | grep '=>' | grep -v " not " | awk '{print $3}' | while read -r lib; do
  echo "Copying $lib"
  cp "$lib" dylibs/
done

# copy .node dependencies
echo "Copying .node dynamic dependencies"
"$HOME"/miniconda3/bin/conda run -n gdal_env ldd pathfinder/pathfinder.linux-x64-gnu.node | grep '=>' | grep -v " not " | awk '{print $3}' | while read -r lib; do
  echo "Copying $lib"
  cp "$lib" dylibs/
done
