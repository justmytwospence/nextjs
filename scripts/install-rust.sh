#!/bin/bash

curl https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -sSf | sh  -s 
conda install -c conda-forge clang

echo "conda info --base"
echo `conda info ---base`

curl https://sh.rustup.rs -sSf | sh -s -- -y
export PATH="$HOME/.cargo/bin:$PATH"
