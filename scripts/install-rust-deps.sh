#!/bin/bash

wget --quiet -O miniconda.sh https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh 
bash miniconda.sh -b > /dev/null
$HOME/miniconda3/bin/conda create --quiet -n gdal_env -c conda-forge pkg-config clang libcxx libcxxabi gdal -y 
export GDAL_HOME="$HOME/miniconda3/envs/gdal_env"
echo $(ls $GDAL_HOME)
echo $(ls $GDAL_HOME/include)