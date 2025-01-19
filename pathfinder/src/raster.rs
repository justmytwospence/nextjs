use georaster::geotiff::{GeoTiffReader, RasterValue};
use napi::bindgen_prelude::Buffer;
use std::io::Cursor;

pub fn get_raster(geotiff: &mut GeoTiffReader<&mut Cursor<Buffer>>) -> napi::Result<Vec<Vec<f64>>> {
  let (width, height) = geotiff.image_info().dimensions.unwrap();
  let width: usize = width as usize;
  let height: usize = height as usize;

  let mut raster_data: Vec<Vec<f64>> = vec![vec![0.0; width]; height];
  for pixel in geotiff.pixels(0, 0, width as u32, height as u32) {
    let (x, y, value) = pixel;
    let data: f64 = match value {
      RasterValue::F64(v) => Ok(v),
      RasterValue::F32(v) => Ok(v as f64),
      _ => Err(napi::Error::from_reason(format!("Data must be f64, found: {:?}", value))),
    }?;
    raster_data[y as usize][x as usize] = data;
  }
  Ok(raster_data)
}
