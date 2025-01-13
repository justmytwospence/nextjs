#!/bin/bash

set -x

# Set and export number of CPUs for parallel builds
NUM_CPUS=$(nproc)
echo "Number of CPUs: $NUM_CPUS"

# dependencies
CONDA_DIR="$HOME"/miniconda3

curl -s -o miniconda.sh https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash miniconda.sh -b > /dev/null

"$CONDA_DIR"/bin/conda install --quiet -c conda-forge libtree patchelf -y

"$CONDA_DIR"/bin/conda create --quiet -n gdal_env -c conda-forge \
  clang \
  geos \
  libcurl \
  libdeflate \
  libjxl \
  libtiff \
  proj -y

# gdal
curl -LO https://github.com/OSGeo/gdal/releases/download/v3.9.3/gdal-3.9.3.tar.gz
tar -xf gdal-3.9.3.tar.gz
cd gdal-3.9.3
mkdir build && cd build
cmake .. \
  -DBUILD_APPS=OFF \
  -DBUILD_PYTHON_BINDINGS=OFF \
  -DBUILD_SHARED_LIBS=ON \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_FLAGS="-lm -I$CONDA_DIR/envs/gdal_env/include -L$CONDA_DIR/envs/gdal_env/lib" \
  -DCMAKE_C_FLAGS="-lm -I$CONDA_DIR/envs/gdal_env/include -L$CONDA_DIR/envs/gdal_env/lib" \
  -DCMAKE_INSTALL_PREFIX="$CONDA_DIR"/envs/gdal_env \
  -DGDAL_BUILD_OPTIONAL_DRIVERS=OFF \
  -DGDAL_ENABLE_DRIVER_GTIFF=ON \
  -DGDAL_ENABLE_DRIVER_MEM=ON \
  -DGDAL_USE_CURL=ON \
  -DGDAL_USE_DEFLATE=ON \
  -DGDAL_USE_GEOS=ON \
  -DGDAL_USE_INTERNAL_LIBS=ON \
  -DGDAL_USE_WEBP=ON \
  -DOGR_BUILD_OPTIONAL_DRIVERS=OFF

echo "Building GDAL"
cmake --build . --target GDAL -- -j"${NUM_CPUS}"
"$CONDA_DIR"
cd ../..
rm -rf gdal-3.9.3

ls -lah "$CONDA_DIR"/envs/gdal_env
ls -lah "$CONDA_DIR"/envs/gdal_env/lib
ls -lah "$CONDA_DIR"/envs/gdal_env/include

"$CONDA_DIR"/bin/patchelf --set-rpath /var/task/dylibs "$CONDA_DIR"/envs/gdal_env/lib/libgdal.so
"$CONDA_DIR"/bin/conda run -n gdal_env ldd "$CONDA_DIR"/envs/gdal_env/lib/libgdal.so 

curl https://sh.rustup.rs -sSf | sh -s -- -y # vercel
# rustup default stable # netlify