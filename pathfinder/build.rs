extern crate napi_build;

fn main() { 
  // println!("cargo:rustc-link-search=native=/opt/build/repo");
  // println!("cargo:rustc-link-lib=static=gdal");
  // println!("cargo:rustc-link-arg=-Wl,-rpath,/opt/buildhome/miniconda3/envs/gdal_env/lib");
  println!("cargo:rustc-link-arg=-Wl,-rpath,/var/task/dylibs");
  println!("cargo:rustc-link-lib=dylib=gdal");
  println!("cargo:rustc-link-search=native=/opt/buildhome/miniconda3/envs/gdal_env");
  napi_build::setup();
}
