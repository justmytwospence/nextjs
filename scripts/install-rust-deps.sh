#!/bin/bash

rustup toolchain install stable
curl -s -o miniconda.sh https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash miniconda.sh -b > /dev/null
$HOME/miniconda3/bin/conda create --quiet -n gdal_env -c conda-forge pkg-config clang libcxx libcxxabi gdal -y 
ls $HOME/miniconda3/envs/gdal_env/lib
ldd $HOME/miniconda3/envs/gdal_env/lib/libgdal.so.36

mkdir -p artifacts/
cp $HOME/miniconda3/envs/gdal_env/lib/libgdal.so* artifacts/
ldd $HOME/miniconda3/envs/gdal_env/lib/libgdal.so.36 | grep "=> /" | awk '{print $3}' | while read -r lib; do
    echo "Copying dependency: $lib"
    cp "$lib" artifacts/
done
chmod +x artifacts/*

ls -lah artifacts
ldd artifacts/libgdal.so.36

echo $RUSTFLAGS