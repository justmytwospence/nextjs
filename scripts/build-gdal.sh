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
  glib \
  gxx_linux-64 \
  libcurl \
  libcxx \
  libcxxabi \
  libdeflate \
  libjxl \
  libsqlite \
  libtiff \
  pkg-config \
  proj -y

ls -lah "$CONDA_DIR"/envs/gdal_env/bin
"$CONDA_DIR"/bin/conda list glibc
"$CONDA_DIR"/bin/conda list gxx_linux-64
"$CONDA_DIR"/bin/conda run -n gdal_env ldd --version

# # libc 
# curl -LO https://ftp.gnu.org/gnu/libc/glibc-2.40.tar.xz
# tar xf glibc-2.40.tar.xz
# cd glibc-2.40
# mkdir build && cd build
# echo "Building libc"
# $HOME/miniconda3/bin/conda run -n gdal_env ../configure \
#   --prefix=/opt/build/repo/glibc-2.40/build \
#   --enable-static-pie \
#   CFLAGS="-O2 -fPIC -U_FORTIFY_SOURCE -D_FORTIFY_SOURCE=0 -Wno-error=attributes" \
#   CXXFLAGS="-O2 -fPIC"
# make -j4
# mv libc.a ../..
# cd ../..
# rm -rf glibc-2.40

# gdal
curl -LO https://github.com/OSGeo/gdal/releases/download/v3.10.0/gdal-3.10.0.tar.gz
tar -xf gdal-3.10.0.tar.gz
cd gdal-3.10.0
mkdir build && cd build
echo "Building GDAL"
echo "$LD_LIBRARY_PATH"
"$CONDA_DIR"/bin/conda run -n gdal_env cmake .. \
  -DBUILD_APPS=OFF \
  -DBUILD_PYTHON_BINDINGS=OFF \
  -DBUILD_SHARED_LIBS=ON \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_C_COMPILER="$CONDA_DIR"/envs/gdal_env/bin/clang \
  -DCMAKE_CXX_COMPILER="$CONDA_DIR"/envs/gdal_env/bin/clang-cpp \
  -DCMAKE_CXX_FLAGS="-nostdlib --sysroot=$CONDA_DIR/envs/gdal_env -I$CONDA_DIR/envs/gdal_env/include -L$CONDA_DIR/envs/gdal_env/lib" \
  -DCMAKE_C_FLAGS="-nostdlib --sysroot=$CONDA_DIR/envs/gdal_env -I$CONDA_DIR/envs/gdal_env/include -L$CONDA_DIR/envs/gdal_env/lib" \
  -DCMAKE_EXE_LINKER_FLAGS="-L$CONDA_DIR/envs/gdal_env/lib" \
  -DCMAKE_INSTALL_PREFIX="$CONDA_DIR"/envs/gdal_env \
  -DCMAKE_SHARED_LINKER_FLAGS="-L$CONDA_DIR/envs/gdal_env/lib" \
  -DACCEPT_MISSING_LINUX_FS_HEADER=ON \
  -DACCEPT_MISSING_SQLITE3_MUTEX_ALLOC=ON \
  -DGDAL_BUILD_OPTIONAL_DRIVERS=OFF \
  -DGDAL_ENABLE_DRIVER_GTIFF=ON \
  -DGDAL_ENABLE_DRIVER_MEM=ON \
  -DGDAL_USE_CURL=ON \
  -DGDAL_USE_DEFLATE=ON \
  -DGDAL_USE_GEOS=ON \
  -DGDAL_USE_INTERNAL_LIBS=ON \
  -DGDAL_USE_WEBP=ON \
  -DOGR_BUILD_OPTIONAL_DRIVERS=OFF

  # -DCMAKE_CXX_FLAGS="-fPIC" \
  # -DCMAKE_C_FLAGS="-fPIC" \
  # -DCMAKE_POSITION_INDEPENDENT_CODE=ON \

"$CONDA_DIR"/bin/conda run -n gdal_env cmake --build . --target install -- -j"${NUM_CPUS}"
"$CONDA_DIR"/bin/patchelf --set-rpath /var/task/dylibs "$CONDA_DIR"/envs/gdal_env/lib/libgdal.so.36.3.10.0
cd ../..
rm -rf gdal-3.10.0

ls -lah "$CONDA_DIR"/envs/gdal_env
ls -lah "$CONDA_DIR"/envs/gdal_env/lib
ls -lah "$CONDA_DIR"/envs/gdal_env/include

"$CONDA_DIR"/bin/conda run -n gdal_env ldd "$CONDA_DIR"/envs/gdal_env/lib/libgdal.so 
"$CONDA_DIR"/bin/conda run -n gdal_env ldd "$CONDA_DIR"/envs/gdal_env/lib/libm.so.6

rustup default stable