#![deny(clippy::all)]

use geojson::{GeoJson, Geometry, Value};
use georaster::geotiff::{GeoTiffReader, RasterValue};
use georaster::Coordinate;
use napi::JsUndefined;
use napi::{bindgen_prelude::*, JsGlobal, JsObject, JsString};
use napi_derive::napi;
use pathfinding::prelude::{fringe, idastar};
use std::io::Cursor;

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

#[napi]
pub struct Results {
  pub path_line: String,
  pub path_points: String,
}

fn parse_point_to_coordinate(point_str: &str) -> napi::Result<Coordinate> {
  let geojson: GeoJson = GeoJson::from_json_value(point_str.parse().unwrap())
    .map_err(|_| napi::Error::from_reason("Invalid GeoJSON"))?;

  match geojson {
    GeoJson::Geometry(Geometry {
      value: Value::Point(coords),
      ..
    }) => Ok(Coordinate::new(coords[1], coords[0])),
    _ => Err(napi::Error::from_reason("Invalid point GeoJSON")),
  }
}

#[napi]
pub fn pathfind(
  env: Env,
  array_buffer: Buffer,
  start: String,
  end: String,
  excluded_aspects: Option<Vec<String>>,
) -> napi::Result<Results> {
  const MAX_GRADIENT: f32 = 0.5;
  let start_coord: Coordinate = parse_point_to_coordinate(&start)?;
  let end_coord: Coordinate = parse_point_to_coordinate(&end)?;

  let mut cursor: Cursor<Buffer> = Cursor::new(array_buffer);
  let mut geotiff: GeoTiffReader<&mut Cursor<Buffer>> = GeoTiffReader::open(&mut cursor).unwrap();

  let (start_x, start_y) = geotiff.coord_to_pixel(start_coord).unwrap();
  let start_node: (usize, usize) = (start_x as usize, start_y as usize);
  let (end_x, end_y) = geotiff.coord_to_pixel(end_coord).unwrap();
  let end_node: (usize, usize) = (end_x as usize, end_y as usize);

  let (width, height) = geotiff.image_info().dimensions.unwrap();
  let width: usize = width as usize;
  let height: usize = height as usize;
  let _ = console_log(&env, format!("Starting at {:?}, {:?} out of {:?} {:?}", start_node.0, start_node.1, width, height).as_str());
  let pixels: Vec<RasterValue> = geotiff
    .pixels(0, 0, width as u32, height as u32)
    .map(|pixel: (u32, u32, RasterValue)| pixel.2)
    .collect();
  let elevations: Vec<f32> = pixels
    .into_iter()
    .map(|value: RasterValue| match value {
      RasterValue::F32(v) => Ok(v),
      _ => Err(napi::Error::from_reason("Elevation data must be f32")),
    })
    .collect::<Result<Vec<f32>>>()?;

  let cost_fn = |&(x, y): &(usize, usize), &(nx, ny): &(usize, usize)| -> i32 {
    const MAX_GRADIENT_MULTIPLIER: f32 = 100.0;

    let dx: f32 = (nx as isize - x as isize).abs() as f32 * 10.0;
    let dy: f32 = (ny as isize - y as isize).abs() as f32 * 10.0;
    let dz: f32 = elevations[ny * width + nx] - elevations[y * width + x];
    let distance: f32 = ((dx * dx) + (dy * dy)).sqrt();
    let gradient: f32 = dz / distance;
    let gradient_ratio: f32 = (gradient / MAX_GRADIENT).clamp(0.0, 1.0);
    let gradient_multiplier: f32 = 1.0 + gradient_ratio.powf(1.5) * (MAX_GRADIENT_MULTIPLIER - 1.0);
    // let _ = console_log(&env, format!("Cost: {:?}, {:?} -> {:?}, {:?}, Distance: {:?}, Gradient: {:?}, Gradient Multiplier: {:?}, Total: {:?}", x, y, nx, ny, distance, gradient, gradient_multiplier, (distance * gradient_multiplier) as i32).as_str());
    (distance * gradient_multiplier) as i32
  };

  let successors = |&(x, y): &(usize, usize)| -> Vec<((usize, usize), i32)> {
    let _ = console_log(&env, format!("Exploring node ({:?}, {:?})", x, y).as_str());

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
        if gradient < MAX_GRADIENT {
          neighbors.push(((nx as usize, ny as usize), cost_fn(&(x, y), &(nx, ny))));
        }
      }
    }

    // let _ = console_log(&env, format!("Successors: {:?}", neighbors).as_str());
    neighbors
  };

  let heuristic = |&(x, y): &(usize, usize)| -> i32 { cost_fn(&(x, y), &end_node) as i32 };

  let is_end_node = |&node: &(usize, usize)| -> bool { node == end_node };

  let result: Option<(Vec<(usize, usize)>, i32)> =
    idastar(&start_node, successors, heuristic, is_end_node);

  let path_nodes: Vec<(usize, usize)> = match result {
    Some((path, _)) => path,
    None => return Err(napi::Error::from_reason("No path found".to_string())),
  };

  // Convert path to coordinates (including elevation)
  let path_coords: Vec<Vec<f64>> = path_nodes
    .iter()
    .map(|(x, y)| {
      let coordinate: Coordinate = geotiff.pixel_to_coord(*x as u32, *y as u32).unwrap();
      let elevation: f64 = elevations[*y * width + *x] as f64;
      vec![coordinate.x, coordinate.y, elevation]
    })
    .collect();

  // Create feature collection with both linestring and points
  let results: Results = Results {
    path_line: Geometry::new(Value::LineString(path_coords)).to_string(),
    path_points: "foo".to_string(),
  };

  Ok(results)
}

fn console_log(env: &Env, message: &str) -> Result<JsUndefined> {
  let global: JsGlobal = env.get_global()?;
  let console: JsObject = global.get_named_property("console")?;
  let log_fn: JsFunction = console.get_named_property("log")?;
  let js_string: JsString = env.create_string(message)?;
  log_fn.call(None, &[js_string])?;
  env.get_undefined()
}
