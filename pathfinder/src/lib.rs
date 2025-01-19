#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

mod azimuth;
mod console_log;
mod find_path;
mod geotiff;
mod raster;

pub use azimuth::compute_azimuths;
pub use raster::get_raster;
pub use find_path::find_path_rs;
pub use geotiff::serialize_to_geotiff;