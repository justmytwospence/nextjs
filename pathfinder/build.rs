extern crate napi_build;

fn main() {
  println!("cargo:rustc-link-search=native=/var/task/artifacts"); // Directory with shared libraries
  println!("cargo:rustc-link-lib=dylib=gdal"); // Link dynamically with libgdal.so
  println!("cargo:rustc-link-arg=-Wl,-rpath,$ORIGIN/../artifacts"); // Set RPATH
  napi_build::setup();
}
