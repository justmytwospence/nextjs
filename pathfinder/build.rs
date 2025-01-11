extern crate napi_build;

fn main() { 
  println!("cargo:rustc-link-search=native=/opt/build/repo/gdal-3.10.0/build");
  println!("cargo:rustc-link-lib=static=gdal");
  napi_build::setup();
}
