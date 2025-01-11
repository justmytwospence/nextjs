extern crate napi_build;

fn main() { 
  println!("cargo:rustc-link-search=native=/opt/build/repo");
  println!("cargo:rustc-link-lib=static=gdal");
  napi_build::setup();
}
