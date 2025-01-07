#![deny(clippy::all)]

use napi::bindgen_prelude::*;
use napi_derive::napi;
use gdal::Dataset;
use geo_types::Point;
use geojson::{GeoJson, Value};
use serde::Serialize;

#[derive(Serialize)]
struct PathResult {
    start: [f64; 2],
    end: [f64; 2],
    wkt: String,
    format: String,
}

#[napi]
pub fn process_map(
    array_buffer: Uint8Array,
    start: String,
    end: String,
) -> napi::Result<String> {
    // Parse GeoJSON points
    let start_geojson: GeoJson = start.parse().map_err(|e| {
        napi::Error::from_reason(format!("Invalid start point GeoJSON: {}", e))
    })?;
    let end_geojson: GeoJson = end.parse().map_err(|e| {
        napi::Error::from_reason(format!("Invalid end point GeoJSON: {}", e))
    })?;

    // Extract coordinates from GeoJSON Points
    let start_point = match start_geojson {
        GeoJson::Feature(feature) => match feature.geometry {
            Some(geometry) => match geometry.value {
                Value::Point(coords) => coords,
                _ => return Err(napi::Error::from_reason("Start point must be a GeoJSON Point".to_string())),
            },
            None => return Err(napi::Error::from_reason("Start point must have a geometry".to_string())),
        },
        _ => return Err(napi::Error::from_reason("Start point must be a GeoJSON Feature".to_string())),
    };

    let end_point = match end_geojson {
        GeoJson::Feature(feature) => match feature.geometry {
            Some(geometry) => match geometry.value {
                Value::Point(coords) => coords,
                _ => return Err(napi::Error::from_reason("End point must be a GeoJSON Point".to_string())),
            },
            None => return Err(napi::Error::from_reason("End point must have a geometry".to_string())),
        },
        _ => return Err(napi::Error::from_reason("End point must be a GeoJSON Feature".to_string())),
    };

    let start_coords = Point::new(start_point[0], start_point[1]);
    let end_coords = Point::new(end_point[0], end_point[1]);

    gdal::DriverManager::register_all();
    
    let vsi_path = "/vsimem/temp.tif";
    gdal::vsi::create_mem_file(vsi_path, array_buffer.as_ref().to_vec()).map_err(|e| {
        napi::Error::from_reason(format!("Failed to create memory file: {}", e))
    })?;

    let dataset = Dataset::open(vsi_path).map_err(|e| {
        napi::Error::from_reason(format!("Failed to open dataset: {}", e))
    })?;

    let transform = dataset.geo_transform().map_err(|e| {
        napi::Error::from_reason(format!("Failed to get transform: {}", e))
    })?;

    // Convert coordinates
    let (start_px_x, start_px_y) = geo_to_pixel(
        start_coords.x(),
        start_coords.y(),
        &transform,
    );
    let (end_px_x, end_px_y) = geo_to_pixel(
        end_coords.x(),
        end_coords.y(),
        &transform,
    );

    let spatial_ref = dataset.spatial_ref().map_err(|e| {
        napi::Error::from_reason(format!("Failed to get spatial reference: {}", e))
    })?;

    let wkt = spatial_ref.to_wkt().map_err(|e| {
        napi::Error::from_reason(format!("Failed to convert to WKT: {}", e))
    })?;

    let result = PathResult {
        start: [start_px_x, start_px_y],
        end: [end_px_x, end_px_y],
        wkt,
        format: "WKT".to_string(),
    };

    Ok(serde_json::to_string_pretty(&result).map_err(|e| {
        napi::Error::from_reason(format!("Failed to serialize result: {}", e))
    })?)
}

fn geo_to_pixel(lng: f64, lat: f64, transform: &[f64; 6]) -> (f64, f64) {
    let px_x = (lng - transform[0]) / transform[1];
    let px_y = (lat - transform[3]) / transform[5];
    (px_x, px_y)
}