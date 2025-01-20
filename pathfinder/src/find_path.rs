use std::{f64::consts::E, io::Cursor};

use geojson::{FeatureCollection, GeoJson, Geometry, Value};
use georaster::{geotiff::GeoTiffReader, Coordinate};
use napi::{bindgen_prelude::Buffer, Env};
use pathfinding::directed::fringe::fringe;
use crate::{azimuth::Aspect, console_log::console_log, raster::get_raster};

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

fn distance(a: (usize, usize), b: (usize, usize)) -> f64 {
  let dx: f64 = (b.0 as isize - a.0 as isize).abs() as f64 * 10.0;
  let dy: f64 = (b.1 as isize - a.1 as isize).abs() as f64 * 10.0;
  ((dx * dx) + (dy * dy)).sqrt()
}

fn logistic_multiplier(x: f64) -> f64 {
  // worked out with https://www.desmos.com/calculator/rra3xxrvxh
  const SCALE: f64 = 5.0; // overall how much to penalize steep gradients
  const GROWTH_RATE: f64 = 70.0; // 
  const X0: f64 = 0.12; // the inflection point of the logistic curve - should be the point at which the gradient matters most
  let logistic_curve: f64 = SCALE / (1.0 + (-GROWTH_RATE * (x - X0)).exp());
  let y_shift: f64 = 1.0 - SCALE / (1.0 + (GROWTH_RATE * X0).exp());
  logistic_curve + y_shift
}

fn exponential_multiplier(x: f64) -> f64 {
  // https://www.desmos.com/calculator/7pr9vwem2m
  const M: f64 = 50.0;
  const B: f64 = 0.1;
  E.powf(M * (x - B)) + 1.0
}

fn linear_multiplier(x: f64) -> f64 {
  (20.0 * x).clamp(1.0, 20.0)
}

fn cost_fn(distance: f64, gradient: f64) -> i32 {
  let gradient_multiplier: f64 = linear_multiplier(gradient);
  (distance * gradient_multiplier) as i32
}

#[napi]
pub fn find_path_rs(
  env: Env,
  elevations_buffer: Buffer,
  start: String,
  end: String,
  max_gradient: Option<f64>,
  azimuths_buffer: Buffer,
  excluded_aspects: Option<Vec<Aspect>>,
  gradients_buffer: Buffer,
  aspect_gradient_threshold: Option<f64>,
) -> napi::Result<String> { 
  let max_gradient: f64 = max_gradient.unwrap_or(1.0);
  let excluded_aspects: Vec<Aspect> = excluded_aspects.unwrap_or(vec![]);
  let aspect_gradient_threshold: f64 = aspect_gradient_threshold.unwrap_or(0.0);

  let mut elevations_cursor: Cursor<Buffer> = Cursor::new(elevations_buffer);
  let mut elevations_geotiff: GeoTiffReader<&mut Cursor<Buffer>> = GeoTiffReader::open(&mut elevations_cursor).unwrap();
  let elevations: Vec<Vec<f64>> = get_raster(&mut elevations_geotiff)?;

  let mut azimuths_cursor: Cursor<Buffer> = Cursor::new(azimuths_buffer);
  let mut azimuths_geotiff: GeoTiffReader<&mut Cursor<Buffer>> = GeoTiffReader::open(&mut azimuths_cursor).unwrap();
  let azimuths: Vec<Vec<f64>> = get_raster(&mut azimuths_geotiff)?;

  let mut gradients_cursor: Cursor<Buffer> = Cursor::new(gradients_buffer);
  let mut gradients_geotiff: GeoTiffReader<&mut Cursor<Buffer>> = GeoTiffReader::open(&mut gradients_cursor).unwrap();
  let gradients: Vec<Vec<f64>> = get_raster(&mut gradients_geotiff)?;

  let start_coord: Coordinate = parse_point_to_coordinate(&start)?;
  let end_coord: Coordinate = parse_point_to_coordinate(&end)?;

  let (start_x, start_y) = elevations_geotiff.coord_to_pixel(start_coord).unwrap();
  let start_node: (usize, usize) = (start_x as usize, start_y as usize);
  let (end_x, end_y) = elevations_geotiff.coord_to_pixel(end_coord).unwrap();
  let end_node: (usize, usize) = (end_x as usize, end_y as usize);

  let (width, height) = elevations_geotiff.image_info().dimensions.unwrap();
  let width: usize = width as usize;
  let height: usize = height as usize;

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

  let d: f64 = distance((start_node.0, start_node.1), (end_node.0, end_node.1));
  let dz: f64 = elevations[end_node.1][end_node.0] - elevations[start_node.1][end_node.0];
  let gradient: f64 = dz / d;
  let _ = console_log(
    &env,
    format!(
      "Width: {:?}, Height: {:?}, Starting at ({:?}, {:?}) at elevation {:?}, Goal: ({:?}, {:?}) at elevation {:?}, Distance: {:?}, dz: {:?}, Gradient {:?}, Heuristic: {:?}, Cost: {:?}",
      width, height, 
      start_node.0, start_node.1, elevations[start_node.1][start_node.0], 
      end_node.0, end_node.1, elevations[end_node.1][end_node.0], 
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
    'neighbors: for &(dx, dy) in DIRECTIONS.iter() {
      let nx: usize = ((x as isize) + dx) as usize;
      let ny: usize = ((y as isize) + dy) as usize;

      if nx < width && ny < height {
        let azimuth: f64 = azimuths[ny][nx];
        let aspect_gradient: f64 = gradients[ny][nx];
        if aspect_gradient > aspect_gradient_threshold {
          // let _ = console_log(&env, format!("Checking aspect gradient {:?} vs {:?}", aspect_gradient, aspect_gradient_threshold).as_str());
          for aspect in &excluded_aspects {
            // let _ = console_log(&env, format!("Checking aspect: {:?} against azimuth: {:?}", aspect, azimuth).as_str());
            if aspect.contains_azimuth(azimuth as f64, Some(2.5 as f64)) {
              // let _ = console_log(&env, format!("Excluding aspect: {:?} at azimuth: {:?}, gradient {:?} vs {:?}", aspect, azimuth, aspect_gradient, aspect_gradient_threshold).as_str());
              break 'neighbors;
            }
          }
        }

        let d: f64 = distance((x, y), (nx, ny));
        let dz: f64 = elevations[ny][nx] - elevations[y][x];
        let gradient: f64 = dz / d;
        // let _ = console_log(&env, format!("distance: {:?}, dz: {:?}, gradient: {:?}", distance, dz, gradient).as_str());
        if gradient < max_gradient {
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

  // Create feature collection with both linestring and points
  let results: String = FeatureCollection {
    features: path_nodes
      .iter()
      .map(|(x, y)| {
        let coordinate: Coordinate = elevations_geotiff.pixel_to_coord(*x as u32, *y as u32).unwrap();
        let elevation: f64 = elevations[*y][*x];
        let azimuth: f64 = azimuths[*y][*x];
        let aspect: Aspect = Aspect::from_azimuth(azimuth);
        geojson::Feature {
          bbox: None,
          geometry: Some(Geometry::new(Value::Point(vec![
            coordinate.x,
            coordinate.y,
            elevation as f64,
          ]))),
          id: None,
          properties: Some(serde_json::json!({
            "aspect": format!("{:?}", aspect),
            "azimuth": azimuth.to_string(),
          }).as_object().unwrap().clone()),
          foreign_members: None,
        }
      })
      .collect::<Vec<geojson::Feature>>(),
    bbox: None,
    foreign_members: None,
  }
  .to_string();

  Ok(results)
}