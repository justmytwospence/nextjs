# dependencies
curl -s -o miniconda.sh https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash miniconda.sh -b > /dev/null
$HOME/miniconda3/bin/conda create --quiet -n gdal_env -c conda-forge \
  clang \
  gdal \
  libcxx \
  libcxxabi \
  libjxl \
  libtiff \
  pkg-config \
  proj -y

BASEDIR = $(pwd)
curl -Lo gdal-3.10.0.tar.gz https://github.com/OSGeo/gdal/releases/download/v3.10.0/gdal-3.10.0.tar.gz
tar -xf gdal-3.10.0.tar.gz
cd gdal-3.10.0
mkdir build
cd build
$HOME/miniconda3/bin/conda run -n gdal_env cmake .. \
  -DBUILD_APPS=OFF \
  -DBUILD_PYTHON_BINDINGS=OFF \
  -DBUILD_SHARED_LIBS=OFF \
  -DCMAKE_ARCHIVE_OUTPUT_DIRECTORY=${BASEDIR} \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
  -DCMAKE_C_FLAGS="-fPIC" \
  -DCMAKE_CXX_FLAGS="-fPIC" \
  -DGDAL_BUILD_OPTIONAL_DRIVERS=OFF \
  -DGDAL_ENABLE_DRIVER_GTIFF=ON \
  -DGDAL_ENABLE_DRIVER_MEM=ON \
  -DGDAL_USE_INTERNAL_LIBS=ON \
  -DOGR_BUILD_OPTIONAL_DRIVERS=OFF
echo "Building GDAL"
cmake --build . --target GDAL -- -j4

cd $BASEDIR
ls -lah 
realpath libgdal.a

rm -rf gdal-3.10.0*