# dependencies
curl -s -o miniconda.sh https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash miniconda.sh -b > /dev/null
$HOME/miniconda3/bin/conda create --quiet -n gdal_env -c conda-forge \
  clang \
  gdal \
  libcxx \
  libcxxabi \
  libdeflate \
  libjxl \
  libtiff \
  pkg-config \
  proj -y

# libproj
curl -LO https://download.osgeo.org/proj/proj-data-1.20.tar.gz
tar xf proj-data-1.20.tar.gz
cd proj-data-1.20
mkdir build && cd build
$HOME/miniconda3/bin/conda run -n gdal_env cmake .. \
  -DBUILD_APPS=OFF \
  -DBUILD_SHARED_LIBS=OFF \
  -DBUILD_TESTING=OFF \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_POSITION_INDEPENDENT_CODE=ON
make -j4
ls -lah .
mv libproj.a ../..
cd ../..
rm -rf proj-data-1.20

# geos
curl -LO https://download.osgeo.org/geos/geos-3.13.0.tar.bz2
tar -xf geos-3.13.0.tar.bz2
cd geos-3.13.0
mkdir build && cd build
echo "Building GEOS"
cmake .. \
  -DBUILD_SHARED_LIBS=OFF \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_POSITION_INDEPENDENT_CODE=ON
make -j4 
ls -lah lib
mv lib/libgeos_c.a ../..
cd ../..
rm -rf geos-3.13.0

# libdeflate
curl -LO https://github.com/ebiggers/libdeflate/archive/v1.19.tar.gz
tar xf v1.19.tar.gz
cd libdeflate-1.19
mkdir build && cd build
echo "Building libdeflate"
cmake .. \
  -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
  -DLIBDEFLATE_BUILD_STATIC_LIB=ON \
  -DLIBDEFLATE_BUILD_SHARED_LIB=OFF
make -j4
mv libdeflate.a ../..
cd ../..
rm -rf libdeflate-1.19

# webp
curl -LO https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.5.0.tar.gz
tar xf libwebp-1.5.0.tar.gz
cd libwebp-1.5.0
mkdir build && cd build
echo "Building libwebp"
cmake .. \
  -DCMAKE_POSITION_INDEPENDENT_CODE=ON
make -j4 
mv libwebp.a ../..
cd ../..
rm -rf libwebp-1.5.0

# gdal
curl -LO https://github.com/OSGeo/gdal/releases/download/v3.10.0/gdal-3.10.0.tar.gz
tar -xf gdal-3.10.0.tar.gz
cd gdal-3.10.0
mkdir build && cd build
$HOME/miniconda3/bin/conda run -n gdal_env cmake .. \
  -DBUILD_APPS=OFF \
  -DBUILD_PYTHON_BINDINGS=OFF \
  -DBUILD_SHARED_LIBS=OFF \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_FLAGS="-fPIC" \
  -DCMAKE_C_FLAGS="-fPIC" \
  -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
  -DDeflate_LIBRARY_RELEASE=../../libdeflate.a \
  -DGDAL_BUILD_OPTIONAL_DRIVERS=OFF \
  -DGDAL_ENABLE_DRIVER_GTIFF=ON \
  -DGDAL_ENABLE_DRIVER_MEM=ON \
  -DGDAL_USE_DEFLATE=ON \
  -DGDAL_USE_INTERNAL_LIBS=ON \
  -DGDAL_USE_WEBP=ON \
  -DOGR_BUILD_OPTIONAL_DRIVERS=OFF \
  -DWEBP_LIBjARARY=../../libwebp.a \
  -DGEOS_LIBRARY=../../libgeos_c.a \
  -DPROJ_LIBRARY_RELEASE=../../libproj.a 

echo "Building GDAL"
cmake --build . --target GDAL -- -j4
mv libgdal.a ../..
cd ../..
rm -rf gdal-3.10.0 