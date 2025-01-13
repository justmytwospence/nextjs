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
  cmake \
  geos \
  libcurl \
  libcxxabi \
  libdeflate \
  libjxl \
  libtiff \
  pkg-config \
  proj -y

  # gxx_linux-64 \
  # libcxx \

"$CONDA_DIR"/bin/conda list glibc
"$CONDA_DIR"/bin/conda list gxx_linux-64
"$CONDA_DIR"/bin/conda run -n gdal_env ldd --version

# gdal
curl -LO https://github.com/OSGeo/gdal/releases/download/v3.10.0/gdal-3.10.0.tar.gz
tar -xf gdal-3.10.0.tar.gz
cd gdal-3.10.0
mkdir build && cd build
"$CONDA_DIR"/bin/conda run -n gdal_env cmake .. \
  -DBUILD_APPS=OFF \
  -DBUILD_PYTHON_BINDINGS=OFF \
  -DBUILD_SHARED_LIBS=ON \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_FLAGS="-I$CONDA_DIR/envs/gdal_env/include -L$CONDA_DIR/envs/gdal_env/lib" \
  -DCMAKE_C_FLAGS="-I$CONDA_DIR/envs/gdal_env/include -L$CONDA_DIR/envs/gdal_env/lib" \
  -DCMAKE_EXE_LINKER_FLAGS="-L$CONDA_DIR/envs/gdal_env/lib" \
  -DCMAKE_INSTALL_PREFIX="$CONDA_DIR"/envs/gdal_env \
  -DCMAKE_SHARED_LINKER_FLAGS="-L$CONDA_DIR/envs/gdal_env/lib" \
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
"$CONDA_DIR"/bin/conda run -n gdal_env cmake --build . --target install -- -j"${NUM_CPUS}"
"$CONDA_DIR"/bin/patchelf --set-rpath --force-rpath /var/task/dylibs "$CONDA_DIR"/envs/gdal_env/lib/libgdal.so.36.3.10.0
cd ../..
rm -rf gdal-3.10.0

ls -lah "$CONDA_DIR"/envs/gdal_env
ls -lah "$CONDA_DIR"/envs/gdal_env/lib
ls -lah "$CONDA_DIR"/envs/gdal_env/include

"$CONDA_DIR"/bin/conda run -n gdal_env ldd "$CONDA_DIR"/envs/gdal_env/lib/libgdal.so 

rustup default stable