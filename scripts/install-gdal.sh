#!/bin/bash

wget --quiet -O miniconda.sh https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh 
bash miniconda.sh -b > /dev/null
$HOME/miniconda3/bin/conda create --quiet -n gdal_env -c conda-forge gdal -y 
export GDAL_INCLUDE_DIR="$HOME/miniconda3/envs/gdal_env/include"
export GDAL_LIB_DIR="$HOME/miniconda3/envs/gdal_env/lib"
echo $(ls $GDAL_INCLUDE_DIR)
echo $(ls $GDAL_LIB_DIR)