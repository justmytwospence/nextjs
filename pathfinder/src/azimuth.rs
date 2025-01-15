use std::f64::consts::PI;

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