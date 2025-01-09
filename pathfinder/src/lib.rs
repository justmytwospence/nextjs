#![deny(clippy::all)]

use gdal::raster::processing::dem::{aspect, AspectOptions};
use gdal::{
  errors::GdalError,
  raster,
  vsi::{create_mem_file_from_ref, MemFileRef},
  Dataset,
};
use geo_types::Point;
use geojson::{Feature, FeatureCollection, GeoJson, Geometry, Value};
use napi::JsUndefined;
use napi::{bindgen_prelude::*, JsGlobal, JsObject, JsString};
use napi_derive::napi;
use pathfinding::prelude::fringe;
use std::fmt;

#[napi]
pub struct Results {
  pub path_line: String,
  pub path_points: String,
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

impl fmt::Display for Aspect {
  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

fn azimuth_to_aspect(azimuth: f32) -> Aspect {
  match azimuth {
    337.5..=360.0 | 0.0..=22.5 => Aspect::North,
    22.5..=67.5 => Aspect::Northeast,
    67.5..=112.5 => Aspect::East,
    112.5..=157.5 => Aspect::Southeast,
    157.5..=202.5 => Aspect::South,
    202.5..=247.5 => Aspect::Southwest,
    247.5..=292.5 => Aspect::West,
    292.5..=337.5 => Aspect::Northwest,
    _ => Aspect::Flat,
  }
}

fn azimuth_in_aspects(azimuth: f32, aspects: &Vec<Aspect>) -> bool {
  for aspect in aspects {
    match aspect {
      Aspect::North => {
        return azimuth >= 327.5 || azimuth < 32.5;
      }
      Aspect::Northeast => {
        return azimuth >= 12.5 && azimuth < 77.5;
      }
      Aspect::East => {
        return azimuth >= 57.5 && azimuth < 122.5;
      }
      Aspect::Southeast => {
        return azimuth >= 102.5 && azimuth < 167.5;
      }
      Aspect::South => {
        return azimuth >= 147.5 && azimuth < 212.5;
      }
      Aspect::Southwest => {
        return azimuth >= 192.5 && azimuth < 257.5;
      }
      Aspect::West => {
        return azimuth >= 237.5 && azimuth < 302.5;
      }
      Aspect::Northwest => {
        return azimuth >= 282.5 && azimuth < 347.5;
      }
      Aspect::Flat => {
        return azimuth == -9999.0;
      }
    }
  }
  false
}

#[napi]
pub fn process_map(
  env: Env,
  mut array_buffer: Buffer,
  start: String,
  end: String,
  excluded_aspects: Option<Vec<Aspect>>,
) -> napi::Result<Results> {
  const MAX_GRADIENT: f32 = 0.5;
  let excluded_aspects: Vec<Aspect> = excluded_aspects.unwrap_or_else(|| vec![]);

  let start_geojson: GeoJson = start.parse::<GeoJson>().unwrap();
  let end_geojson: GeoJson = end.parse::<GeoJson>().unwrap();

  let start_point: Vec<f64> = match start_geojson {
    GeoJson::Geometry(Geometry {
      value: Value::Point(coords),
      ..
    }) => coords,
    _ => return Err(napi::Error::from_reason("Invalid point GeoJSON")),
  };

  let end_point: Vec<f64> = match end_geojson {
    GeoJson::Geometry(Geometry {
      value: Value::Point(coords),
      ..
    }) => coords,
    _ => return Err(napi::Error::from_reason("Invalid end point GeoJSON")),
  };

  let start_coords: Point<f64> = Point::new(start_point[0], start_point[1]);
  let end_coords: Point<f64> = Point::new(end_point[0], end_point[1]);

  gdal::DriverManager::register_all();
  let vsi_path: &str = "/vsimem/temp.tif";
  let array_data: &mut [u8] = array_buffer.as_mut();
  let _handle: MemFileRef<'_> =
    create_mem_file_from_ref(vsi_path, array_data).map_err(|e: GdalError| {
      napi::Error::from_reason(format!("Failed to create memory file: {}", e))
    })?;

  let elevation_dataset: Dataset = Dataset::open(vsi_path).map_err(|e: GdalError| {
    napi::Error::from_reason(format!("Failed to open elevation dataset: {}", e))
  })?;

  let transform: [f64; 6] = elevation_dataset
    .geo_transform()
    .map_err(|e: GdalError| napi::Error::from_reason(format!("Failed to get transform: {}", e)))?;

  let (width, height) = elevation_dataset.raster_size();
  let elevation_band: raster::RasterBand<'_> =
    elevation_dataset.rasterband(1).map_err(|e: GdalError| {
      napi::Error::from_reason(format!("Failed to get elevation raster band: {}", e))
    })?;
  let elevation_buffer: raster::Buffer<f32> = elevation_band
    .read_as::<f32>((0, 0), (width, height), (width, height), None)
    .map_err(|e: GdalError| {
      napi::Error::from_reason(format!("Failed to read elevation raster data: {}", e))
    })?;
  let elevations: Vec<f32> = elevation_buffer.data().to_vec();

  let aspect_dataset: Dataset = aspect(
    &elevation_dataset,
    std::path::Path::new("temp.tif"),
    &AspectOptions::new(),
  )
  .map_err(|e: GdalError| napi::Error::from_reason(format!("Failed to calculate aspect: {}", e)))?;

  let (aspect_width, aspect_height) = aspect_dataset.raster_size();
  let aspect_band: raster::RasterBand<'_> =
    aspect_dataset.rasterband(1).map_err(|e: GdalError| {
      napi::Error::from_reason(format!("Failed to get aspects raster band: {}", e))
    })?;
  let aspect_buffer: raster::Buffer<f32> = aspect_band
    .read_as::<f32>(
      (0, 0),
      (aspect_width, aspect_height),
      (aspect_width, aspect_height),
      None,
    )
    .map_err(|e: GdalError| {
      napi::Error::from_reason(format!("Failed to read aspects raster data: {}", e))
    })?;
  let aspects: Vec<f32> = aspect_buffer.data().to_vec();

  // Convert coordinates
  let (start_px_x, start_px_y) = geo_to_pixel(start_coords.x(), start_coords.y(), &transform);
  let (end_px_x, end_px_y) = geo_to_pixel(end_coords.x(), end_coords.y(), &transform);

  let start_node: (usize, usize) = (start_px_x as usize, start_px_y as usize);
  let end_node: (usize, usize) = (end_px_x as usize, end_px_y as usize);

  let cost_fn = |&(x, y): &(usize, usize), &(nx, ny): &(usize, usize)| -> i32 {
    const MAX_GRADIENT_MULTIPLIER: f32 = 5.0;

    let dx: f32 = (nx as isize - x as isize).abs() as f32 * 10.0;
    let dy: f32 = (ny as isize - y as isize).abs() as f32 * 10.0;
    let dz: f32 = elevations[ny * width + nx] - elevations[y * width + x];
    let distance: f32 = ((dx * dx) + (dy * dy)).sqrt();
    let gradient: f32 = dz / distance;
    let gradient_ratio: f32 = (gradient / MAX_GRADIENT).clamp(0.0, 1.0);
    let gradient_multiplier: f32 = 1.0 + gradient_ratio.powf(3.0) * (MAX_GRADIENT_MULTIPLIER - 1.0);
    // let _ = console_log(&env, format!("Cost: {:?}, {:?} -> {:?}, {:?}, Distance: {:?}, Gradient: {:?}, Gradient Multiplier: {:?}, Total: {:?}", x, y, nx, ny, distance, gradient, gradient_multiplier, (distance * gradient_multiplier) as i32).as_str());
    (distance * gradient_multiplier) as i32
  };

  let successors = |&(x, y): &(usize, usize)| -> Vec<((usize, usize), i32)> {
    // let _ = console_log(&env, format!("Exploring node ({:?}, {:?})", x, y).as_str());

    let directions: [(isize, isize); 8] = [
      (0, 1),
      (1, 0),
      (0, -1),
      (-1, 0),
      (1, 1),
      (1, -1),
      (-1, -1),
      (-1, 1),
    ];

    let mut neighbors: Vec<((usize, usize), i32)> = Vec::with_capacity(8);
    for &(dx, dy) in directions.iter() {
      let nx: usize = ((x as isize) + dx) as usize;
      let ny: usize = ((y as isize) + dy) as usize;

      if nx < width && ny < height {
        let current_elevation: f32 = elevations[y * width + x];
        let new_elevation: f32 = elevations[ny * width + nx];
        let gradient: f32 = (new_elevation - current_elevation).abs() / 10.0;
        // let _ = console_log(&env, format!("gradient: {:?}", gradient).as_str());
        if gradient < MAX_GRADIENT {
          let azimuth: f32 = aspects[ny * width + nx];
          // let _ = console_log(&env, format!("Aspect: {:?}, excluded: {:?}", categorize_aspect(aspect), excluded_aspects).as_str());
          if !azimuth_in_aspects(azimuth, &excluded_aspects) || gradient < 0.05 {
            neighbors.push(((nx as usize, ny as usize), cost_fn(&(x, y), &(nx, ny))));
          }
        }
      }
    }

    // let _ = console_log(&env, format!("Successors: {:?}", neighbors).as_str());
    neighbors
  };

  let heuristic = |&(x, y): &(usize, usize)| -> i32 { cost_fn(&(x, y), &end_node) as i32 };

  let is_end_node = |&node: &(usize, usize)| -> bool { node == end_node };

  let result: Option<(Vec<(usize, usize)>, i32)> =
    fringe(&start_node, successors, heuristic, is_end_node);

  let path: Vec<(usize, usize)> = match result {
    Some((path, _)) => path,
    None => return Err(napi::Error::from_reason("No path found".to_string())),
  };

  // Convert path to coordinates (including elevation)
  let path_coords: Vec<Vec<f64>> = path
    .iter()
    .map(|(x, y)| {
      let geo_x: f64 = transform[0] + ((*x as f64) * transform[1]);
      let geo_y: f64 = transform[3] + ((*y as f64) * transform[5]);
      let elevation: f64 = elevations[*y * width + *x] as f64;
      vec![geo_x, geo_y, elevation]
    })
    .collect();

  // Create point features with aspect properties
  let points: Vec<Feature> = path_coords
    .iter()
    .enumerate()
    .map(|(i, coord)| {
      let point_geometry = Geometry::new(Value::Point(vec![coord[0], coord[1]]));
      let aspect = azimuth_to_aspect(aspects[(path[i].1 * width + path[i].0) as usize]);
      
      let mut properties = serde_json::Map::new();
      properties.insert(
        "aspect".to_string(),
        serde_json::Value::String(aspect.to_string()),
      );

      Feature {
        bbox: None,
        geometry: Some(point_geometry),
        id: None,
        properties: Some(properties),
        foreign_members: None,
      }
    })
    .collect();

  // Create feature collection with both linestring and points
  let results: Results = Results {
    path_line: Geometry::new(Value::LineString(path_coords)),
    path_points: FeatureCollection { features: points, bbox: None, foreign_members: None },
  };

  Ok(results)
}

fn geo_to_pixel(lng: f64, lat: f64, transform: &[f64; 6]) -> (f64, f64) {
  let px_x: f64 = (lng - transform[0]) / transform[1];
  let px_y: f64 = (lat - transform[3]) / transform[5];
  (px_x, px_y)
}

fn console_log(env: &Env, message: &str) -> Result<JsUndefined> {
  let global: JsGlobal = env.get_global()?;
  let console: JsObject = global.get_named_property("console")?;
  let log_fn: JsFunction = console.get_named_property("log")?;
  let js_string: JsString = env.create_string(message)?;
  log_fn.call(None, &[js_string])?;
  env.get_undefined()
}
