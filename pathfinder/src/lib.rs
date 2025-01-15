#![deny(clippy::all)]

use geojson::{GeoJson, Geometry, Value};
use georaster::geotiff::{GeoTiffReader, RasterValue};
use georaster::Coordinate;
use napi::JsUndefined;
use napi::{bindgen_prelude::*, JsGlobal, JsObject, JsString};
use napi_derive::napi;
use pathfinding::prelude::{dijkstra, fringe, idastar};
use std::f32::consts::E;
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

fn distance(a: (usize, usize), b: (usize, usize)) -> f32 {
  let dx: f32 = (b.0 as isize - a.0 as isize).abs() as f32 * 10.0;
  let dy: f32 = (b.1 as isize - a.1 as isize).abs() as f32 * 10.0;
  ((dx * dx) + (dy * dy)).sqrt()
}

fn logistic_multiplier(x: f32) -> f32 {
  // worked out with https://www.desmos.com/calculator/rra3xxrvxh
  const SCALE: f32 = 5.0; // overall how much to penalize steep gradients
  const GROWTH_RATE: f32 = 70.0; // 
  const X0: f32 = 0.12; // the inflection point of the logistic curve - should be the point at which the gradient matters most
  let logistic_curve: f32 = SCALE / (1.0 + (-GROWTH_RATE * (x - X0)).exp());
  let y_shift: f32 = 1.0 - SCALE / (1.0 + (GROWTH_RATE * X0).exp());
  logistic_curve + y_shift
}

fn exponential_multiplier(x: f32) -> f32 {
  // https://www.desmos.com/calculator/7pr9vwem2m
  const M: f32 = 50.0;
  const B: f32 = 0.1;
  E.powf(M * (x - B)) + 1.0
}

fn linear_multiplier(x: f32) -> f32 {
  (30.0 * x).clamp(1.0, 20.0)
}

fn cost_fn(distance: f32, gradient: f32) -> i32 {
  let gradient_multiplier: f32 = linear_multiplier(gradient);
  (distance * gradient_multiplier) as i32
}

#[napi]
pub fn pathfind(
  env: Env,
  geotiff_buffer: Buffer,
  start: String,
  end: String,
  _excluded_aspects: Option<Vec<String>>,
) -> napi::Result<Results> {
  let start_coord: Coordinate = parse_point_to_coordinate(&start)?;
  let end_coord: Coordinate = parse_point_to_coordinate(&end)?;

  let mut cursor: Cursor<Buffer> = Cursor::new(geotiff_buffer);
  let mut geotiff: GeoTiffReader<&mut Cursor<Buffer>> = GeoTiffReader::open(&mut cursor).unwrap();

  let (start_x, start_y) = geotiff.coord_to_pixel(start_coord).unwrap();
  let start_node: (usize, usize) = (start_x as usize, start_y as usize);
  let (end_x, end_y) = geotiff.coord_to_pixel(end_coord).unwrap();
  let end_node: (usize, usize) = (end_x as usize, end_y as usize);

  let (width, height) = geotiff.image_info().dimensions.unwrap();
  let width: usize = width as usize;
  let height: usize = height as usize;

  let mut elevations: Vec<f32> = vec![0.0; width * height];
  for pixel in geotiff.pixels(0, 0, width as u32, height as u32) {
    let (x, y, value) = pixel;
    let elevation: f32 = match value {
      RasterValue::F32(v) => Ok(v),
      _ => Err(napi::Error::from_reason("Elevation data must be f32")),
    }?;
    elevations[y as usize * width + x as usize] = elevation;
  }

  let heuristic = |&(x, y): &(usize, usize)| -> i32 {
    let cost: i32 = distance((x, y), end_node) as i32;
    // let _ = console_log(
    //   &env,
    //   format!(
    //     "Heuristic for ({:?}, {:?}) -> ({:?}, {:?}) = {:?}",
    //     x, y, end_node.0, end_node.1, cost
    //   )
    //   .as_str(),
    // );
    return cost
  };

  let d: f32 = distance((start_node.0, start_node.1), (end_node.0, end_node.1));
  let dz: f32 = elevations[end_node.1 * width + end_node.0] - elevations[start_node.1 * width + end_node.0];
  let gradient: f32 = dz / d;
  let _ = console_log(
    &env,
    format!(
      "Width: {:?}, Height: {:?}, Starting at ({:?}, {:?}) at elevation {:?}, Goal: ({:?}, {:?}) at elevation {:?}, Distance: {:?}, dz: {:?}, Gradient {:?}, Heuristic: {:?}, Cost: {:?}",
      width, height, 
      start_node.0, start_node.1, elevations[start_node.1 * width + start_node.0], 
      end_node.0, end_node.1, elevations[end_node.1 * width + end_node.0], 
      d, dz, gradient, heuristic(&start_node), cost_fn(d, gradient)
    )
    .as_str(),
  );

  let successors = |&(x, y): &(usize, usize)| -> Vec<((usize, usize), i32)> {
    const DIRECTIONS: [(isize, isize); 8] = [
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
    for &(dx, dy) in DIRECTIONS.iter() {
      let nx: usize = ((x as isize) + dx) as usize;
      let ny: usize = ((y as isize) + dy) as usize;

      if nx < width && ny < height {
        let d: f32 = distance((x, y), (nx, ny));
        let dz: f32 = elevations[ny * width + nx] - elevations[y * width + x];
        let gradient: f32 = dz / d;
        // let _ = console_log(&env, format!("distance: {:?}, dz: {:?}, gradient: {:?}", distance, dz, gradient).as_str());
        const MAX_GRADIENT: f32 = 0.25;
        if gradient < MAX_GRADIENT {
          let cost: i32 = cost_fn(d, gradient);
          neighbors.push(((nx, ny), cost));
        }
      }
    }
    // let _ = console_log(&env, format!("# neighbors: {:?}", neighbors.len()).as_str());
    neighbors
  };

  let is_end_node = |&node: &(usize, usize)| -> bool { node == end_node };

  let result: Option<(Vec<(usize, usize)>, i32)> =
    fringe(&start_node, successors, heuristic, is_end_node);

  let path_nodes: Vec<(usize, usize)> = match result {
    Some((path, _)) => path,
    None => return Err(napi::Error::from_reason("No path found".to_string())),
  };

  // Convert path to coordinates (including elevation)
  let path_coords: Vec<Vec<f64>> = path_nodes
    .iter()
    .map(|(x, y)| {
      let coordinate: Coordinate = geotiff.pixel_to_coord(*x as u32, *y as u32).unwrap();
      let elevation: f64 = elevations[y * width + x] as f64;
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
