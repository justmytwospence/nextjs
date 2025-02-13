#!/bin/bash

set -x

CONDA_DIR="$HOME"/miniconda3
"$CONDA_DIR"/bin/patchelf --set-rpath --force-rpath /var/task/dylibs "$CONDA_DIR"/envs/gdal_env/lib/libgdal.so.36
"$CONDA_DIR"/bin/patchelf --set-interpreter /var/task/dylibs/ld-linux-x86.so.2 "$CONDA_DIR"/envs/gdal_env/lib/libgdal.so.36

mkdir dylibs

echo "Copying linker"
cp /lib64/ld-linux-x86-64.so.2 dylibs/

# copy GDAL dependencies
echo "Copying GDAL dependencies"
"$HOME"/miniconda3/bin/conda run -n gdal_env ldd /opt/buildhome/miniconda3/envs/gdal_env/lib/libgdal.so
cp /opt/buildhome/miniconda3/envs/gdal_env/lib/libgdal.so* dylibs/
"$HOME"/miniconda3/bin/conda run -n gdal_env ldd /opt/buildhome/miniconda3/envs/gdal_env/lib/libgdal.so | grep '=>' | grep -v " not " | awk '{print $3}' | while read -r lib; do
  echo "Copying $lib"
  cp "$lib" dylibs/
  "$CONDA_DIR"/bin/patchelf --set-rpath /var/task/dylibs dylibs/$(basename "$lib")
done

ldd dylibs/libm.so.6

# copy .node dependencies
echo "Copying .node dynamic dependencies"
"$HOME"/miniconda3/bin/conda run -n gdal_env ldd pathfinder/pathfinder.linux-x64-gnu.node
"$HOME"/miniconda3/bin/conda run -n gdal_env ldd pathfinder/pathfinder.linux-x64-gnu.node | grep '=>' | grep -v " not " | awk '{print $3}' | while read -r lib; do
  echo "Copying $lib"
  cp "$lib" dylibs/
  "$CONDA_DIR"/bin/patchelf --set-rpath /var/task/dylibs dylibs/$(basename $lib)
done
