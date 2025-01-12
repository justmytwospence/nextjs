extern crate napi_build;

fn main() { 
  // println!("cargo:rustc-link-search=native=/opt/build/repo");
  // println!("cargo:rustc-link-lib=static=gdal");
  println!("cargo:rustc-link-arg=-Wl,-rpath,/opt/buildhome/miniconda3/envs/gdal_env");
  println!("cargo:rustc-link-arg=-Wl,-rpath,/var/task/dylibs");
  napi_build::setup();
}
