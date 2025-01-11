#!/bin/bash

rustup toolchain install stable
curl -s -o miniconda.sh https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash miniconda.sh -b > /dev/null
$HOME/miniconda3/bin/conda create --quiet -n gdal_env -c conda-forge pkg-config clang libcxx libcxxabi gdal -y 
ls $HOME/miniconda3/envs/gdal_env/lib
mkdir -p artifacts/
cp -r $HOME/miniconda3/envs/gdal_env/lib/libgdal.so* artifacts/
chmod +x artifacts/*
ls -lah artifacts
ldd artifacts/libgdal.so.36
echo $RUSTFLAGS