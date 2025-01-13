#!/bin/bash

set -x

CONDA_DIR="$HOME"/miniconda3

mkdir dylibs

# copy GDAL dependencies
echo "Copying GDAL dependencies"
"$HOME"/miniconda3/bin/conda run -n gdal_env ldd /opt/buildhome/miniconda3/envs/gdal_env/lib/libgdal.so
cp /opt/buildhome/miniconda3/envs/gdal_env/lib/libgdal.so* dylibs/
"$HOME"/miniconda3/bin/conda run -n gdal_env ldd /opt/buildhome/miniconda3/envs/gdal_env/lib/libgdal.so | grep '=>' | grep -v " not " | awk '{print $3}' | while read -r lib; do
  echo "Copying $lib"
  cp "$lib" dylibs/
  "$CONDA_DIR"/bin/patchelf --set-rpath /var/task/dylibs dylibs/$(basename "$lib")
done

# copy .node dependencies
echo "Copying .node dynamic dependencies"
"$HOME"/miniconda3/bin/conda run -n gdal_env ldd pathfinder/pathfinder.linux-x64-gnu.node
"$HOME"/miniconda3/bin/conda run -n gdal_env ldd pathfinder/pathfinder.linux-x64-gnu.node | grep '=>' | grep -v " not " | awk '{print $3}' | while read -r lib; do
  echo "Copying $lib"
  cp "$lib" dylibs/
  "$CONDA_DIR"/bin/patchelf --set-rpath /var/task/dylibs dylibs/$(basename $lib)
done

rm dylibs/libm.so.6