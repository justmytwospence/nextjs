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
  geos \
  libcurl \
  libdeflate \
  libjxl \
  libtiff \
  pkg-config \
  proj -y

  # clang \
  # gdal \
  # gxx_linux-64 \
  # libcxx \
  # libcxxabi \

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

# # proj
# curl -LO https://download.osgeo.org/proj/proj-9.5.1.tar.gz
# tar xf proj-9.5.1.tar.gz
# cd proj-9.5.1
# mkdir build && cd build
# $HOME/miniconda3/bin/conda run -n gdal_env cmake .. \
#   -DBUILD_APPS=OFF \
#   -DBUILD_SHARED_LIBS=OFF \
#   -DBUILD_TESTING=OFF \
#   -DCMAKE_BUILD_TYPE=Release \
#   -DCMAKE_POSITION_INDEPENDENT_CODE=ON
# make -j4
# mv lib/libproj.a ../..
# cd ../..
# rm -rf proj-9.5.1

# # geos
# curl -LO https://download.osgeo.org/geos/geos-3.13.0.tar.bz2
# tar -xf geos-3.13.0.tar.bz2
# cd geos-3.13.0
# mkdir build && cd build
# echo "Building GEOS"
# cmake .. \
#   -DBUILD_SHARED_LIBS=OFF \
#   -DCMAKE_BUILD_TYPE=Release \
#   -DCMAKE_POSITION_INDEPENDENT_CODE=ON
# make -j4 
# mv lib/libgeos_c.a ../..
# cd ../..
# rm -rf geos-3.13.0

# # libdeflate
# curl -LO https://github.com/ebiggers/libdeflate/archive/v1.19.tar.gz
# tar xf v1.19.tar.gz
# cd libdeflate-1.19
# mkdir build && cd build
# echo "Building libdeflate"
# cmake .. \
#   -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
#   -DLIBDEFLATE_BUILD_STATIC_LIB=ON \
#   -DLIBDEFLATE_BUILD_SHARED_LIB=OFF
# make -j4
# mv libdeflate.a ../..
# cd ../..
# rm -rf libdeflate-1.19

# # webp
# curl -LO https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.5.0.tar.gz
# tar xf libwebp-1.5.0.tar.gz
# cd libwebp-1.5.0
# mkdir build && cd build
# echo "Building libwebp"
# cmake .. \
#   -DCMAKE_POSITION_INDEPENDENT_CODE=ON
# make -j4 
# mv libwebp.a ../..
# cd ../..
# rm -rf libwebp-1.5.0

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

  # -DCMAKE_CXX_FLAGS="-fPIC" \
  # -DCMAKE_C_FLAGS="-fPIC" \
  # -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
  # -DBUILD_SHARED_LIBS=OFF \
  # -DDeflate_LIBRARY_RELEASE=../../libdeflate.a \
  # -DGDAL_USE_WEBP=ON \
  # -DWEBP_LIBjARARY=../../libwebp.a \
  # -DGEOS_LIBRARY=../../libgeos_c.a \
  # -DPROJ_LIBRARY_RELEASE=../../libproj.a 

echo "Building GDAL"
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