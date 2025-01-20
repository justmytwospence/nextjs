use georaster::geotiff::GeoTiffReader;
use napi::bindgen_prelude::Buffer;
use napi_derive::napi;
use std::{f64::consts::PI, io::Cursor};

use crate::{get_raster, serialize_to_geotiff};

#[napi]
pub struct AzimuthResult {
  pub elevations: Buffer,
  pub azimuths: Buffer,
  pub gradients: Buffer,
}

#[derive(PartialEq, Debug)]
#[napi(string_enum)]
pub enum Aspect {
  North,
  Northeast,
  East,
  Southeast,
  South,
  Southwest,
  West,
  Northwest,
  Flat,
}

impl Aspect {
  pub fn from_azimuth(azimuth: f64) -> Aspect {
    if azimuth == -1.0 {
      Aspect::Flat
    } else {
      match azimuth as f64 {
        a if a < 22.5 => Aspect::North,
        a if a < 67.5 => Aspect::Northeast,
        a if a < 112.5 => Aspect::East,
        a if a < 157.5 => Aspect::Southeast,
        a if a < 202.5 => Aspect::South,
        a if a < 247.5 => Aspect::Southwest,
        a if a < 292.5 => Aspect::West,
        a if a < 337.5 => Aspect::Northwest,
        _ => Aspect::North,
      }
    }
  }

  pub fn contains_azimuth(&self, azimuth: f64, tolerance: Option<f64>) -> bool {
    let tolerance: f64 = tolerance.unwrap_or(0.0);
    match self {
      Aspect::Northeast => (22.5 - tolerance) <= azimuth && azimuth <= (67.5 + tolerance),
      Aspect::East => (67.5 - tolerance) <= azimuth && azimuth <= (112.5 + tolerance),
      Aspect::Southeast => (112.5 - tolerance) <= azimuth && azimuth <= (157.5 + tolerance),
      Aspect::South => (157.5 - tolerance) <= azimuth && azimuth <= (202.5 + tolerance),
      Aspect::Southwest => (202.5 - tolerance) <= azimuth && azimuth <= (247.5 + tolerance),
      Aspect::West => (247.5 - tolerance) <= azimuth && azimuth <= (292.5 + tolerance),
      Aspect::Northwest => (292.5 - tolerance) <= azimuth && azimuth <= (337.5 + tolerance),
      Aspect::North => {
        (0.0 - tolerance) <= azimuth && azimuth <= (22.5 + tolerance)
          || (337.5 - tolerance) <= azimuth && azimuth <= 360.0
      }
      Aspect::Flat => azimuth == -1.0,
    }
  }
}

/// Calculate azimuth from horizontal (Gx) and vertical (Gy) gradients
pub fn calculate_azimuth(gx: f64, gy: f64) -> f64 {
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

  azimuth_degrees as f64
}

/// Compute gradient along azimuth
fn compute_gradient_along_azimuth(gx: f64, gy: f64, azimuth: f64) -> f64 {
  if azimuth == -1.0 {
    return 0.0;
  }

  const PIXEL_SIZE: f64 = 10.0; // 10m pixel size
  const KERNEL_SUM: f64 = 68.0; // Sum of absolute values in Sobel 5x5 kernel

  // Normalize gradients
  let gx_normalized: f64 = gx / (KERNEL_SUM * PIXEL_SIZE).abs();
  let gy_normalized: f64 = gy / (KERNEL_SUM * PIXEL_SIZE).abs();

  // Calculate slope as rise/run
  ((gx_normalized * gx_normalized) + (gy_normalized * gy_normalized)).sqrt()
}

/// Apply a 5x5 Sobel filter to compute azimuth and gradient along azimuth for each pixel on a `Vec<f64>`
#[napi]
pub fn compute_azimuths(elevations_geotiff: Buffer) -> AzimuthResult {
  let mut cursor: Cursor<Buffer> = Cursor::new(elevations_geotiff);
  let mut elevations_geotiff: GeoTiffReader<&mut Cursor<Buffer>> =
    GeoTiffReader::open(&mut cursor).unwrap();
  let elevations: Vec<Vec<f64>> = get_raster(&mut elevations_geotiff).unwrap();

  let gx_kernel: [[f64; 5]; 5] = [
    [-5.0, -4.0, 0.0, 4.0, 5.0],
    [-8.0, -10.0, 0.0, 10.0, 8.0],
    [-10.0, -20.0, 0.0, 20.0, 10.0],
    [-8.0, -10.0, 0.0, 10.0, 8.0],
    [-5.0, -4.0, 0.0, 4.0, 5.0],
  ];

  let gy_kernel: [[f64; 5]; 5] = [
    [-5.0, -8.0, -10.0, -8.0, -5.0],
    [-4.0, -10.0, -20.0, -10.0, -4.0],
    [0.0, 0.0, 0.0, 0.0, 0.0],
    [4.0, 10.0, 20.0, 10.0, 4.0],
    [5.0, 8.0, 10.0, 8.0, 5.0],
  ];

  let height: usize = elevations.len();
  let width: usize = elevations[0].len();

  let mut azimuths: Vec<Vec<f64>> = vec![vec![0.0; width]; height];
  let mut gradients: Vec<Vec<f64>> = vec![vec![0.0; width]; height];

  // Apply convolution
  for i in 2..(height - 2) {
    for j in 2..(width - 2) {
      let mut gx: f64 = 0.0;
      let mut gy: f64 = 0.0;

      // Apply the 5x5 kernel
      for ki in 0..5 {
        for kj in 0..5 {
          let x: usize = j + kj - 2; // Adjust column index (center kernel on current pixel)
          let y: usize = i + ki - 2; // Adjust row index
          let pixel_value: f64 = elevations[y][x];

          gx += pixel_value * gx_kernel[ki][kj];
          gy += pixel_value * gy_kernel[ki][kj];
        }
      }

      // Compute azimuth for the current pixel
      let azimuth: f64 = calculate_azimuth(gx, gy);
      azimuths[i][j] = azimuth;
      gradients[i][j] = compute_gradient_along_azimuth(gx, gy, azimuth);
    }
  }

  let geo_keys: Vec<u32> = elevations_geotiff.geo_keys.as_ref().unwrap().clone();
  let origin: [f64; 2] = elevations_geotiff.origin().unwrap();

  AzimuthResult {
    elevations: serialize_to_geotiff(elevations, &geo_keys, &origin).unwrap(),
    azimuths: serialize_to_geotiff(azimuths, &geo_keys, &origin).unwrap(),
    gradients: serialize_to_geotiff(gradients, &geo_keys, &origin).unwrap(),
  }
}
