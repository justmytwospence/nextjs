extern crate napi_build;

fn main() { 
  println!("cargo:rustc-link-search=native=/opt/build/repo");
  println!("cargo:rustc-link-lib=static=gdal");
  println!("cargo:rustc-link-lib=static=stdc++"); 
  println!("cargo:rustc-link-lib=static=gcc");   
  napi_build::setup();
}
