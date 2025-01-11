curl -Lo gdal-3.10.0.tar.gz https://github.com/OSGeo/gdal/releases/download/v3.10.0/gdal-3.10.0.tar.gz
tar -xf gdal-3.10.0.tar.gz
cd gdal-3.10.0
mkdir build
cd build
cmake .. \
  -DBUILD_APPS=OFF \                
  -DBUILD_SHARED_LIBS=OFF \         
  -DENABLE_STATIC_LIB=ON \           
  -DENABLE_PYTHON=OFF \              
  -DCMAKE_ARCHIVE_OUTPUT_DIRECTORY=../artifacts 
cmake --build . --target GDAL --config Release
ls -lah ../artifacts