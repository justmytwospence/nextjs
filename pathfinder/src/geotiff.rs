use std::io::Cursor;
use napi::bindgen_prelude::Buffer;
use tiff::encoder::colortype::Gray32Float;
use tiff::encoder::TiffEncoder;
use tiff::tags::Tag;
use tiff::TiffError;

pub fn serialize_to_geotiff(
  raster: Vec<Vec<f64>>,
  geo_keys: &Vec<u32>,
  origin: &[f64; 2]
) -> Option<Buffer> {
  let height: usize = raster.len();
  let width: usize = raster[0].len();
  let buffer: Vec<u8> = Vec::new();
  let mut cursor: Cursor<Vec<u8>> = Cursor::new(buffer);
  let mut encoder: TiffEncoder<&mut Cursor<Vec<u8>>> = TiffEncoder::new(&mut cursor)
    .map_err(|e: TiffError| napi::Error::from_reason(format!("{}", e)))
    .unwrap();
  {
    let mut image: tiff::encoder::ImageEncoder<
      '_,
      &mut Cursor<Vec<u8>>,
      Gray32Float,
      tiff::encoder::TiffKindStandard,
    > = encoder
      .new_image::<Gray32Float>(width as u32, height as u32)
      .map_err(|e: TiffError| napi::Error::from_reason(format!("{}", e)))
      .unwrap();

    image
      .encoder()
      .write_tag(Tag::Unknown(34735), &**geo_keys)
      .map_err(|e| napi::Error::from_reason(format!("{}", e)))
      .unwrap();
    image
      .encoder()
      .write_tag(Tag::Unknown(34737), "NAD83|}")
      .ok()?; // CRS citation (EPSG:4269)
    let geo_doubles: Vec<f64> = vec![6378137.0, 298.257222101]; // Semi-major axis and inverse flattening
    image
      .encoder()
      .write_tag(Tag::Unknown(34736), &geo_doubles[..])
      .ok()?;
    let one_third_arc_second: f64 = 1.0 / 10800.0;
    let pixel_scale: Vec<f64> = vec![one_third_arc_second, one_third_arc_second, 0.0];
    image
      .encoder()
      .write_tag(Tag::Unknown(33550), &pixel_scale[..])
      .unwrap(); // ModelPixelScaleTag
    let tie_points: Vec<f64> = vec![0.0, 0.0, 0.0, origin[0], origin[1], 0.0];
    image
      .encoder()
      .write_tag(Tag::Unknown(33922), &tie_points[..])
      .unwrap(); // ModelTiePointTag

    let flattened: Vec<f32> = raster.into_iter().flatten().map(|x| x as f32).collect();
    image
      .write_data(&flattened)
      .map_err(|e: TiffError| napi::Error::from_reason(format!("{}", e)))
      .ok()?;
  }
  Some(Buffer::from(cursor.into_inner()))
}