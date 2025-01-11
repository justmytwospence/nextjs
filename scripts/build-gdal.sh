# dependencies
curl -s -o miniconda.sh https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash miniconda.sh -b > /dev/null
$HOME/miniconda3/bin/conda create --quiet -n gdal_env -c conda-forge libjxl pkg-config libtiff proj -y

curl -Lo gdal-3.10.0.tar.gz https://github.com/OSGeo/gdal/releases/download/v3.10.0/gdal-3.10.0.tar.gz
tar -xf gdal-3.10.0.tar.gz
cd gdal-3.10.0
mkdir build
cd build
$HOME/miniconda3/bin/conda run -n gdal_env cmake .. \
  -BUILD_APPS=OFF \
  -BUILD_PYTHON_BINDINGS:BOOL=OFF \
  -BUILD_SHARED_LIBS=OFF \
  -DCMAKE_ARCHIVE_OUTPUT_DIRECTORY=. \
  -DCMAKE_BUILD_TYPE=Release \
  -DGDAL_BUILD_OPTIONAL_DRIVERS=OFF \
  -DGDAL_ENABLE_DRIVER_GTIFF=ON \
  -DGDAL_ENABLE_DRIVER_MEM=ON \
  -DOGR_BUILD_OPTIONAL_DRIVERS=OFF
echo "Building GDAL"
cmake --build . --target GDAL -- VERBOSE=1
ls -lah .