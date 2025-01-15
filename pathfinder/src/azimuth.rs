use tiff::encoder::colortype::Gray32Float;
use tiff::tags::Tag;
use tiff::TiffError;
use tiff::encoder::TiffEncoder;
use std::f64::consts::PI;
use std::io::Cursor;

/// Calculate azimuth from horizontal (Gx) and vertical (Gy) gradients
fn calculate_azimuth(gx: f32, gy: f32) -> f32 {
    if gx == 0.0 && gy == 0.0 {
        return -1.0; // Default value for flat areas
    }

    // Calculate azimuth in radians, then convert to degrees
    let azimuth_radians: f64 = ((-gx) as f64).atan2(gy as f64); // Invert gx to correct E/W mapping
    let mut azimuth_degrees: f64 = azimuth_radians * 180.0 / PI;

    // Normalize to [0, 360)
    if azimuth_degrees < 0.0 {
        azimuth_degrees += 360.0;
    }

    azimuth_degrees as f32
}

/// Apply a 5x5 Sobel filter to compute azimuth for each pixel on a `Vec<f32>`
pub(crate) fn compute_azimuth_5x5(image: &Vec<f32>, width: usize, height: usize) -> Vec<f32> {
    // Define the 5x5 Sobel kernels (f32 for precision)
    let gx_kernel: [[f32; 5]; 5] = [
        [-5.0, -4.0,  0.0,  4.0,  5.0],
        [-8.0, -10.0, 0.0, 10.0,  8.0],
        [-10.0, -20.0, 0.0, 20.0, 10.0],
        [-8.0, -10.0, 0.0, 10.0,  8.0],
        [-5.0, -4.0,  0.0,  4.0,  5.0],
    ];

    let gy_kernel: [[f32; 5]; 5] = [
        [-5.0, -8.0, -10.0, -8.0, -5.0],
        [-4.0, -10.0, -20.0, -10.0, -4.0],
        [ 0.0,   0.0,   0.0,   0.0,  0.0],
        [ 4.0,  10.0,  20.0,  10.0,  4.0],
        [ 5.0,   8.0,  10.0,   8.0,  5.0],
    ];

    let mut azimuths = vec![-1.0; width * height]; // Default azimuth -1 for uncomputed pixels

    // Apply convolution
    for i in 2..(height - 2) {
        for j in 2..(width - 2) {
            let mut gx = 0.0;
            let mut gy = 0.0;

            // Apply the 5x5 kernel
            for ki in 0..5 {
                for kj in 0..5 {
                    let x = j + kj - 2; // Adjust column index (center kernel on current pixel)
                    let y = i + ki - 2; // Adjust row index
                    let pixel_value = image[y * width + x];

                    gx += pixel_value * gx_kernel[ki][kj];
                    gy += pixel_value * gy_kernel[ki][kj];
                }
            }

            // Compute azimuth for the current pixel
            azimuths[i * width + j] = calculate_azimuth(gx, gy);
        }
    }

    azimuths
}

pub(crate) fn serialize_azimuth_to_geotiff(
  azimuths: Vec<f32>, 
  width: usize, 
  height: usize, 
  geo_keys: Vec<u32>,
  origin: Vec<f64>,
) -> Option<Vec<u8>> {
  let buffer: Vec<u8> = Vec::new();
  let mut cursor: Cursor<Vec<u8>> = Cursor::new(buffer);
  let mut encoder: TiffEncoder<&mut Cursor<Vec<u8>>> = TiffEncoder::new(&mut cursor).map_err(|e: TiffError| napi::Error::from_reason(format!("{}", e))).unwrap();
  {
    let mut image: tiff::encoder::ImageEncoder<'_, &mut Cursor<Vec<u8>>, Gray32Float, tiff::encoder::TiffKindStandard> = encoder.new_image::<Gray32Float>(width as u32, height as u32).map_err(|e: TiffError| napi::Error::from_reason(format!("{}", e))).unwrap();

    image.encoder().write_tag(Tag::Unknown(34735), &*geo_keys).map_err(|e| napi::Error::from_reason(format!("{}", e))).unwrap();
    image.encoder().write_tag(Tag::Unknown(34737), "NAD83|}").ok()?; // CRS citation (EPSG:4269)
    let geo_doubles: Vec<f64> = vec![6378137.0, 298.257222101]; // Semi-major axis and inverse flattening
    image.encoder().write_tag(Tag::Unknown(34736), &geo_doubles[..]).ok()?; 
    let one_third_arc_second: f64 = 1.0 / 10800.0;
    let pixel_scale: Vec<f64> = vec![one_third_arc_second, one_third_arc_second, 0.0];
    image.encoder().write_tag(Tag::Unknown(33550), &pixel_scale[..]).unwrap(); // ModelPixelScaleTag
    let tie_points: Vec<f64> = vec![0.0, 0.0, 0.0, origin[0], origin[1], 0.0];
    image.encoder().write_tag(Tag::Unknown(33922), &tie_points[..]).unwrap(); // ModelTiePointTag

    image.write_data(&azimuths).map_err(|e: TiffError| napi::Error::from_reason(format!("{}", e))).ok()?;
  }
  Some(cursor.into_inner())
}